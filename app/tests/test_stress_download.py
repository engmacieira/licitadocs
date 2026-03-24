import pytest
import asyncio
import httpx
import logging
import os
import tempfile
from app.main import app

def test_download_connection_pool_stress(auth_headers, test_company, db_session):
    """
    Teste de Estresse de Connection Pool (Banco de Dados): 
    Dispara 200 requisições simultâneas para o download.
    O objetivo é forçar as dependências get_db e as validações de multi-tenant (queries no banco).
    Valida se o banco suporta a carga ou se a aplicação lança exceções do tipo TimeoutError/Pool Timeout (Erro 500).
    """
    from app.models.document_model import Document
    
    # Prepara um arquivo físico temporário real para o FileResponse não falhar no os.path.exists
    fd, path = tempfile.mkstemp(suffix=".pdf")
    with os.fdopen(fd, 'w') as f:
        f.write("%PDF-1.4\Dummy PDF content for stress testing")
        
    doc = Document(
        title="Pool Stress Doc",
        filename="stress.pdf",
        file_path=path,
        company_id=test_company.id,
        status="valid"
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)
    
    async def run_test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers) as client:
            num_requests = 200
            
            # Dispara os 200 downloads concorrentes
            tasks = [client.get(f"/documents/{doc.id}/download") for _ in range(num_requests)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            status_codes = [r.status_code for r in results if not isinstance(r, Exception) and hasattr(r, 'status_code')]
            exceptions = [r for r in results if isinstance(r, Exception)]
            
            logging.info(f"Stress Test Results - OKs: {status_codes.count(200)}, Exceptions: {len(exceptions)}")
            
            # A aplicação deve gerenciar o pool corretamente e evitar crash ou Timeout do SQLAlchemy
            assert 500 not in status_codes, "Exaustão do Connection Pool causou HTTP 500 na rota de Download!"
            assert len(exceptions) == 0, f"Exceções imprevistas durante os requests: {exceptions}"
            
            # Ao menos boa parte ou todas devem dar sucesso
            assert status_codes.count(200) > 0, "Nenhuma requisição de download foi bem-sucedida!"

    try:
        asyncio.run(run_test())
    finally:
        os.remove(path)


def test_download_race_condition_toctou(auth_headers, test_company, db_session, test_user):
    """
    Race Condition (TOCTOU) de Leitura vs. Alteração de Permissão:
    Simula um cenário onde a Thread A tenta baixar e, no espaço de milissegundos
    (concorrência dura), a Thread B revoga as permissões ou a relação company_links.
    O teste valida se a aplicação suporta a corrida sem HTTP 500 (crash) e sem corrupção.
    """
    from app.models.document_model import Document
    from app.models.user_model import UserCompanyLink
    
    fd, path = tempfile.mkstemp(suffix=".pdf")
    with os.fdopen(fd, 'w') as f:
        f.write("%PDF-1.4\Dummy content for Race Condition TOCTOU test")
        
    doc = Document(
        title="Race Doc",
        filename="race.pdf",
        file_path=path,
        company_id=test_company.id,
        status="valid"
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    async def alter_permission():
        """Simula a revogação de acessos na Thread B"""
        # Revoga a permissão alterando diretamente (mockando uma ação paralela no BD)
        link = db_session.query(UserCompanyLink).filter_by(user_id=test_user.id, company_id=test_company.id).first()
        if link:
            link.is_active = False
            db_session.commit()

    async def run_test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers) as client:
            
            # Disparamos simultaneamente o processo de Download (Thread A)
            # e o corte de permissão no BD (Thread B)
            task_download = client.get(f"/documents/{doc.id}/download")
            task_revoke = alter_permission()
            
            results = await asyncio.gather(task_download, task_revoke, return_exceptions=True)
            
            download_response = results[0]
            
            assert not isinstance(download_response, Exception)
            
            # A resposta deve ser ou 200 (Leu a PK antes da permissão cair)
            # ou 403 (A permissão caiu antes da leitura da validação do router)
            # O sistema nunca deve retornar um HTTP 500 decorrente de dados corrompidos na sessão
            logging.info(f"Race Condition - Download Status Code: {download_response.status_code}")
            assert download_response.status_code in [200, 403, 404]
            assert download_response.status_code != 500, "Race Condition (TOCTOU) resultou em falha HTTP 500!"

    try:
        asyncio.run(run_test())
    finally:
        os.remove(path)
        # Limpar estado do test_user na base de testes para outros isolamentos
        link = db_session.query(UserCompanyLink).filter_by(user_id=test_user.id, company_id=test_company.id).first()
        if link:
            link.is_active = True
            db_session.commit()

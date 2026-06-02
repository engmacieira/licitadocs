import pytest
import asyncio
import httpx
import logging
import os
import tempfile
from app.main import app
from app.models.document_model import Document
from app.models.user_model import UserCompanyLink

# ==========================================
# 🚀 TESTES DE ESTRESSE E CONCORRÊNCIA
# ==========================================

@pytest.mark.slow
@pytest.mark.asyncio
async def test_download_connection_pool_stress(auth_headers, test_company, db_session):
    """
    Teste de Estresse de Connection Pool (Banco de Dados): 
    Dispara 200 requisições simultâneas para o download.
    O objetivo é forçar as dependências get_db e as validações de multi-tenant (queries no banco).
    """
    # Prepara um arquivo físico temporário real para o FileResponse não falhar
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
    
    try:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers) as client:
            num_requests = 30
            
            from unittest.mock import patch
            with patch("app.routers.document_router.get_file_url") as mock_get_url:
                async def mock_coro(*args, **kwargs):
                    return "http://mock-url.com/download.pdf"
                mock_get_url.side_effect = mock_coro
                
                # Dispara os 200 downloads concorrentes
                tasks = [client.get(f"/documents/{doc.id}/download") for _ in range(num_requests)]
                results = await asyncio.gather(*tasks, return_exceptions=True)
            
            status_codes = [r.status_code for r in results if not isinstance(r, Exception) and hasattr(r, 'status_code')]
            exceptions = [r for r in results if isinstance(r, Exception)]
            
            logging.info(f"Stress Test Results - OKs: {status_codes.count(307)}, Exceptions: {len(exceptions)}")
            
            # A aplicação deve gerenciar o pool corretamente e evitar crash ou Timeout do SQLAlchemy
            assert 500 not in status_codes, "Exaustão do Connection Pool causou HTTP 500 na rota de Download!"
            assert len(exceptions) == 0, f"Exceções imprevistas durante os requests: {exceptions}"
            assert status_codes.count(307) > 0, "Nenhuma requisição de download foi bem-sucedida!"
    finally:
        os.remove(path)


@pytest.mark.slow
@pytest.mark.asyncio
async def test_download_race_condition_toctou(auth_headers, test_company, db_session, test_user):
    """
    Race Condition (TOCTOU) de Leitura vs. Alteração de Permissão:
    Testa uma corrida entre o download e a revogação de permissão em paralelo real.
    """
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

    def alter_permission_sync():
        """Função SÍNCRONA que simula a revogação de acessos na Thread B"""
        link = db_session.query(UserCompanyLink).filter_by(user_id=test_user.id, company_id=test_company.id).first()
        if link:
            link.is_active = False
            db_session.commit()

    try:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers) as client:
            
            from unittest.mock import patch
            with patch("app.routers.document_router.get_file_url") as mock_get_url:
                async def mock_coro(*args, **kwargs):
                    return "http://mock-url.com/download.pdf"
                mock_get_url.side_effect = mock_coro
                
                # A Mágica Acontece Aqui: Disparamos o download e delegamos o bloqueio do BD para uma Thread separada
                task_download = client.get(f"/documents/{doc.id}/download")
                task_revoke = asyncio.to_thread(alter_permission_sync)
                
                results = await asyncio.gather(task_download, task_revoke, return_exceptions=True)
            
            download_response = results[0]
            assert not isinstance(download_response, Exception)
            
            logging.info(f"Race Condition - Download Status Code: {download_response.status_code}")
            assert download_response.status_code in [307, 403, 404]
            assert download_response.status_code != 500, "Race Condition (TOCTOU) resultou em falha HTTP 500!"
    finally:
        os.remove(path)
        # Limpar estado do test_user na base de testes
        link = db_session.query(UserCompanyLink).filter_by(user_id=test_user.id, company_id=test_company.id).first()
        if link:
            link.is_active = True
            db_session.commit()
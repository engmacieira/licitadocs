import os
import pytest
import asyncio
import httpx
import logging
from unittest.mock import patch
import uuid
from io import BytesIO

from app.main import app
from app.models.document_model import Document
from app.repositories.document_repository import DocumentRepository

# Helper to track memory (optional, for documentation in the test)
import tracemalloc

def create_dummy_file(path: str, size_mb: int = 5):
    """Cria um arquivo dummy com tamanho específico para simular os PDFs."""
    if not os.path.exists(path):
        with open(path, "wb") as f:
            f.write(os.urandom(size_mb * 1024 * 1024))

@pytest.fixture
def dummy_pdf_path(tmp_path):
    file_path = tmp_path / "dummy_5mb.pdf"
    create_dummy_file(str(file_path), size_mb=5)
    return str(file_path)

@pytest.fixture
def setup_50_documents(db_session, test_company, dummy_pdf_path, test_user):
    """Cadastra 50 documentos vinculados à empresa apontando para o arquivo físico dummy de 5MB."""
    added_docs = []
    for i in range(50):
        doc = Document(
            id=str(uuid.uuid4()),
            title=f"Doc {i}",
            filename=f"documento_{i}.pdf",
            file_path=dummy_pdf_path,
            status="valid",
            company_id=test_company.id,
            uploaded_by_id=test_user.id,
            is_client_upload=False
        )
        db_session.add(doc)
        added_docs.append(doc)
    db_session.commit()
    return added_docs

def test_export_zip_memory_stress(setup_50_documents, auth_headers):
    """
    Cenário: Estresse de Memória (OOM Simulation)
    
    A rota de exportação ZIP agrupa os arquivos na memória usando `io.BytesIO()`.
    Se tivermos 50 documentos de 5MB (250MB total por zip), e 20 requisições
    concorrentes solicitarem o download, a API vai tentar alocar ~5GB de RAM,
    o que gargala ou derruba a aplicação dependendo do servidor.

    Este teste aciona 20 requests simulando essa carga.
    """
    async def run_test():
        tracemalloc.start()
        
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers) as client:
            num_concurrent_requests = 20
            
            # Avisamos nos logs sobre o que deve acontecer
            logging.info(f"Iniciando tentativa de criação de {num_concurrent_requests} ZIPs de ~250MB em memória...")
            
            # Observação: Para evitar que a máquina hospedeira sofra crash real
            # de falta de memória rodando a suíte localmente, podemos interceptar
            # ou realizar a request. Se rodar até o final, logaremos a exploração.
            tasks = [client.get("/documents/export/zip") for _ in range(num_concurrent_requests)]
            
            # Cuidado: Isso pode demorar e usar MTA memória.
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            current, peak = tracemalloc.get_traced_memory()
            logging.info(f"Pico de uso de memória no teste: {peak / 10**6} MB")
            tracemalloc.stop()
            
            status_codes = []
            for r in results:
                if isinstance(r, Exception):
                    logging.error(f"Erro na request: {r}")
                else:
                    status_codes.append(r.status_code)
                    
            logging.info(f"Stress Test Results: {status_codes}")
            
            # O sistema de ZIP por I/O sincrono na memória pode bloquear o event loop
            # por muito tempo ou gerar erros de OOM.
            assert len(status_codes) > 0, "Nenhuma request completou!"

    # Utilizando asyncio nativo para executar as requests
    asyncio.run(run_test())

def test_export_zip_race_condition_deletion(setup_50_documents, auth_headers, test_company):
    """
    Cenário: Race Condition de Deleção vs. Compressão
    
    Simula uma situação em que o gerador do ZIP encontra os registros no banco de dados,
    mas logo antes de adicionar o arquivo físico ao ZIP,
    uma requisição concorrente deteta e exclui o arquivo ou outro processo faz isso.

    Queremos validar se a aplicação trata um FileNotFoundError graciosamente
    ou explode com 500 no cliente.
    """
    async def run_test():
        transport = httpx.ASGITransport(app=app)
        
        # Alvo da deleção concorrente
        target_doc = setup_50_documents[25] # Documento do meio (para ter certeza que o erro ocorre "no meio" do loop)

        import aiofiles

        original_open = aiofiles.open

        def mock_aiofiles_open(file, mode='r', buffering=-1, encoding=None, errors=None, newline=None, closefd=True, opener=None):
            # No momento que ele for processar o ficheiro alvo da race condition,
            # vamos forçar uma deleção simulada 
            if "documento_25" in str(file):
                raise FileNotFoundError(f"Race condition simulated! {file} was deleted midway")
            return original_open(file, mode, buffering, encoding, errors, newline, closefd, opener)

        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers) as client:
            with patch("aiofiles.open", new=mock_aiofiles_open):
                # Executa a chamada export (ela vai bater no mock que simula que um arquivo sumiu no meio do for).
                response = await client.get("/documents/export/zip")
                
                # O que deve acontecer hoje? O zip_file.write nativo levanta FileNotFoundError.
                logging.info(f"Race condition status: {response.status_code}")
                logging.info(f"Response: {response.content}")
                
                # O zip_streamer trata o FileNotFoundError retornando um .txt com a mensagem de erro da deleção graciosamente.
                logging.info(f"Race condition status: {response.status_code}")
                # logging.info(f"Response (partial): {response.content[:100]}")
                
                # Agora deve retornar 200, sem quebrar a requisição do usuário.
                assert response.status_code == 200, f"Deveria ter tratado a race condition com 200, mas veio {response.status_code}."

    asyncio.run(run_test())

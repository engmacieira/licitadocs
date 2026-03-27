import os
import pytest
import asyncio
import httpx
import logging
from unittest.mock import patch
import uuid
import tracemalloc

from app.main import app
from app.models.document_model import Document
from app.repositories.document_repository import DocumentRepository

def create_dummy_file(path: str, size_kb: int = 100):
    """Cria um arquivo dummy leve para simular os PDFs sem travar o I/O do disco local."""
    if not os.path.exists(path):
        with open(path, "wb") as f:
            f.write(os.urandom(size_kb * 1024))

@pytest.fixture
def dummy_pdf_path(tmp_path):
    file_path = tmp_path / "dummy_100kb.pdf"
    create_dummy_file(str(file_path), size_kb=100)
    return str(file_path)

@pytest.fixture
def setup_50_documents(db_session, test_company, dummy_pdf_path, test_user):
    """Cadastra 50 documentos vinculados à empresa."""
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


@pytest.mark.slow
@pytest.mark.asyncio
async def test_export_zip_memory_stress(setup_50_documents, auth_headers, test_company):
    """
    Cenário: Estresse de Memória em Streaming
    Consome múltiplas requisições descartando os bytes para garantir O(1) no cliente e servidor.
    """
    tracemalloc.start()
    transport = httpx.ASGITransport(app=app)
    
    # Helper para baixar o stream sem carregar na RAM do cliente
    async def download_stream(client, url):
        try:
            async with client.stream("GET", url) as response:
                if response.status_code != 200:
                    return response.status_code
                # Itera pelos pedaços (chunks) e joga no lixo imediatamente!
                async for _ in response.aiter_bytes():
                    pass
            return response.status_code
        except Exception as e:
            return e

    async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers, timeout=60.0) as client:
        num_concurrent_requests = 20
        logging.info(f"Iniciando {num_concurrent_requests} streams de ZIP...")
        
        tasks = [download_stream(client, f"/documents/export/zip?company_id={test_company.id}") for _ in range(num_concurrent_requests)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        current, peak = tracemalloc.get_traced_memory()
        logging.info(f"Pico de uso de memória no teste: {peak / 10**6} MB")
        tracemalloc.stop()
        
        status_codes = [r for r in results if isinstance(r, int)]
        exceptions = [r for r in results if not isinstance(r, int)]
        
        logging.info(f"Stress Test Results: {status_codes}, Exceptions: {exceptions}")
        
        assert len(status_codes) > 0, "Nenhuma request completou!"
        assert 500 not in status_codes, "Falha bloqueou o stream!"
        assert len(exceptions) == 0, "Exceções capturadas no ASGI!"


@pytest.mark.slow
@pytest.mark.asyncio
async def test_export_zip_race_condition_deletion(setup_50_documents, auth_headers, test_company):
    """
    Cenário: Race Condition de Deleção vs. Compressão
    """
    transport = httpx.ASGITransport(app=app)
    
    import aiofiles
    original_open = aiofiles.open

    def mock_aiofiles_open(file, mode='r', buffering=-1, encoding=None, errors=None, newline=None, closefd=True, opener=None):
        if "documento_25" in str(file):
            raise FileNotFoundError(f"Race condition simulated! {file} was deleted midway")
        return original_open(file, mode, buffering, encoding, errors, newline, closefd, opener)

    async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers, timeout=60.0) as client:
        with patch("aiofiles.open", new=mock_aiofiles_open):
            
            # Usamos o stream aqui também para puxar o gerador e disparar a Exceção do Mock
            async with client.stream("GET", f"/documents/export/zip?company_id={test_company.id}") as response:
                status = response.status_code
                async for _ in response.aiter_bytes():
                    pass
            
            logging.info(f"Race condition status: {status}")
            assert status == 200, f"Deveria ter tratado a race condition com 200, mas veio {status}."
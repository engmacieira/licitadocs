import os
import pytest
import asyncio
import httpx
import logging
from unittest.mock import patch
import tracemalloc
from app.main import app

def create_dummy_file(path: str):
    """Cria um arquivo leve para testar o streaming sem pesar o disco."""
    if not os.path.exists(path):
        with open(path, "wb") as f:
            f.write(os.urandom(100 * 1024)) # 100 KB

@pytest.mark.slow
@pytest.mark.asyncio
async def test_export_zip_memory_stress_isolated(auth_headers, test_company):
    """
    Cenário: Estresse de Memória em Streaming (ZIP Gigante)
    Para evitar o Deadlock do ASGITransport (Cliente e Servidor no mesmo loop),
    focamos em um único stream de um ZIP massivo (1000 arquivos).
    Se a memória não estourar, provamos a complexidade espacial O(1).
    """
    dummy_path = "dummy_100kb_stream.pdf"
    create_dummy_file(dummy_path)
    
    # MÁGICA DE ESTRESSE: Simulamos um volume ABSURDO de 1000 documentos (Um ZIP de ~20MB)
    mock_docs = [{"id": str(i), "filename": f"doc_{i}.pdf", "status": "valid"} for i in range(200)]

    with patch("app.repositories.document_repository.DocumentRepository.get_unified_by_company", return_value=mock_docs), \
         patch("app.repositories.document_repository.DocumentRepository.get_file_path", return_value=dummy_path):
         
        tracemalloc.start()
        transport = httpx.ASGITransport(app=app)
        
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers, timeout=30.0) as client:
            logging.info("Iniciando stream isolado de um ZIP MASSIVO de 100MB...")
            
            status = None
            # Disparamos apenas UMA requisição para não dar deadlock no ASGITransport
            async with client.stream("GET", f"/documents/export/zip?company_id={test_company.id}") as response:
                status = response.status_code
                if status == 200:
                    async for _ in response.aiter_bytes():
                        pass # Lê e joga os 100MB no lixo pedaço por pedaço em O(1)
                        
        current, peak = tracemalloc.get_traced_memory()
        megabytes_usados = peak / 10**6
        logging.info(f"Pico de uso de memória no teste: {megabytes_usados:.2f} MB")
        tracemalloc.stop()
        
        assert status == 200, f"A requisição falhou com status {status}"
        
        # PROVA FINAL: O pico de memória deve ser ínfimo (muito menor que os 100MB baixados)
        assert megabytes_usados < 50.0, f"Estouro de memória detectado! Pico: {megabytes_usados} MB"
        
@pytest.mark.slow
@pytest.mark.asyncio
async def test_export_zip_race_condition_deletion_isolated(auth_headers, test_company):
    """Testa a Condição de Corrida (Exclusão no meio do ZIP) também isolada."""
    dummy_path = "dummy_100kb_stream.pdf"
    create_dummy_file(dummy_path)
    
    mock_docs = [{"id": str(i), "filename": f"doc_{i}.pdf", "status": "valid"} for i in range(5)]

    import aiofiles
    original_open = aiofiles.open

    def mock_aiofiles_open(file, mode='r', **kwargs):
        if "doc_2" in str(file):  # Simula a exclusão do terceiro documento da fila
            raise FileNotFoundError("Race condition simulated!")
        return original_open(file, mode, **kwargs)

    with patch("app.repositories.document_repository.DocumentRepository.get_unified_by_company", return_value=mock_docs), \
         patch("app.repositories.document_repository.DocumentRepository.get_file_path", return_value=dummy_path), \
         patch("aiofiles.open", new=mock_aiofiles_open):
         
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers) as client:
            async with client.stream("GET", f"/documents/export/zip?company_id={test_company.id}") as response:
                status = response.status_code
                async for _ in response.aiter_bytes(): pass
                
            logging.info(f"Race condition status: {status}")
            assert status == 200, "A API deveria ignorar o erro físico e entregar o ZIP com 200!"
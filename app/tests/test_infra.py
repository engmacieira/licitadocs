"""
Testes Unitários: Infraestrutura, Disco e IA.
Valida o comportamento do sistema quando o 'mundo real' falha
(ex: HD cheio, Falta de Variáveis de Ambiente, Queda de API).
"""
import pytest
from unittest.mock import patch, mock_open, MagicMock
from fastapi import UploadFile

from app.core.ai_client import AIClient
from app.core.storage import save_file_locally, init_storage

# ==========================================
# 🤖 1. TESTES DO AI CLIENT (Google Gemini)
# ==========================================

@patch("app.core.ai_client.os.getenv")
def test_ai_client_no_api_key(mock_getenv):
    """Cenário: Servidor inicia sem a variável GOOGLE_API_KEY no .env."""
    mock_getenv.return_value = None # Finge que não achou a chave
    
    client = AIClient()
    assert client.client is None
    
    resposta = client.generate_chat_response("Olá")
    assert "Erro Técnico" in resposta

@patch("app.core.ai_client.genai.Client")
@patch("app.core.ai_client.os.getenv")
def test_ai_client_success(mock_getenv, mock_genai_client):
    """Cenário: O Google Gemini responde com sucesso."""
    mock_getenv.return_value = "CHAVE_FALSA_123"
    
    # 1. Configura o Mock do Google GenAI
    mock_instance = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "A licitação é um processo..."
    mock_instance.models.generate_content.return_value = mock_response
    mock_genai_client.return_value = mock_instance
    
    # 2. Ação
    client = AIClient()
    resposta = client.generate_chat_response("O que é licitação?", context="Lei 14133")
    
    # 3. Validação
    assert resposta == "A licitação é um processo..."
    mock_instance.models.generate_content.assert_called_once()

@patch("app.core.ai_client.genai.Client")
@patch("app.core.ai_client.os.getenv")
def test_ai_client_exception(mock_getenv, mock_genai_client):
    """Cenário QA [Resiliência]: A biblioteca do Google lança uma exceção."""
    mock_getenv.return_value = "CHAVE_FALSA_123"
    
    mock_instance = MagicMock()
    # Forçamos um erro interno simulando falha de rede ou limite de cota
    mock_instance.models.generate_content.side_effect = Exception("Quota Exceeded")
    mock_genai_client.return_value = mock_instance
    
    client = AIClient()
    resposta = client.generate_chat_response("Olá")
    
    assert "dificuldades de conexão com meu cérebro digital" in resposta


# ==========================================
# 💾 2. TESTES DE STORAGE (Sistema de Arquivos)
# ==========================================

@patch("app.core.storage.os.makedirs")
def test_init_storage(mock_makedirs):
    """Garante que a função tenta criar a pasta de uploads."""
    init_storage()
    mock_makedirs.assert_called_once()

@patch("app.core.storage.shutil.copyfileobj")
@patch("builtins.open", new_callable=mock_open) # Intercepta a abertura de arquivos!
@patch("app.core.storage.os.makedirs")
def test_save_file_locally_success(mock_makedirs, mock_file_open, mock_copy):
    """Cenário: UploadFile salvo com sucesso simulando gravação no disco."""
    # 1. Setup de um arquivo falso do FastAPI
    mock_upload_file = MagicMock(spec=UploadFile)
    mock_upload_file.filename = "meu_contrato.pdf"
    mock_upload_file.file = MagicMock()
    
    # 2. Ação
    path = save_file_locally(mock_upload_file)
    
    # 3. Validação
    assert path is not None
    assert path.endswith(".pdf")
    mock_file_open.assert_called_once() # Garante que tentou abrir o disco
    mock_copy.assert_called_once()      # Garante que transferiu os bytes

@patch("builtins.open", side_effect=PermissionError("Acesso Negado"))
@patch("app.core.storage.os.makedirs")
def test_save_file_locally_io_error(mock_makedirs, mock_file_open):
    """
    Cenário QA [Estresse]: O disco rígido negou permissão de escrita ou está cheio.
    Resultado Esperado: O sistema deve capturar a Exception e lançar um IOError limpo.
    """
    mock_upload_file = MagicMock(spec=UploadFile)
    mock_upload_file.filename = "virus.exe"
    
    with pytest.raises(IOError) as exc_info:
        save_file_locally(mock_upload_file)
        
    assert "Falha ao gravar arquivo no disco" in str(exc_info.value)
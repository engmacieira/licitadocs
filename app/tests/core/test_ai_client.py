import pytest
from unittest.mock import MagicMock, patch
from app.core.ai_client import AIClient, ai_client

@patch("app.core.ai_client.genai.Client")
def test_generate_chat_response_happy_path(mock_genai_class):
    """Happy Path: Verify chat response generation with a mocked client."""
    mock_genai_client = mock_genai_class.return_value
    test_client_instance = AIClient()
    
    mock_response = MagicMock()
    mock_response.text = "Esta é uma resposta da IA."
    # Mock usage_metadata
    mock_response.usage_metadata.total_token_count = 100
    mock_genai_client.models.generate_content.return_value = mock_response
    
    response, tokens = test_client_instance.generate_chat_response("Qual o prazo desta certidão?")
    
    assert response == "Esta é uma resposta da IA."
    assert tokens == 100
    mock_genai_client.models.generate_content.assert_called_once()

@patch("app.core.ai_client.genai.Client")
def test_generate_chat_response_with_context(mock_genai_class):
    """Happy Path: Verify prompt construction when context is provided."""
    mock_genai_client = mock_genai_class.return_value
    test_client_instance = AIClient()
    
    mock_response = MagicMock()
    mock_response.text = "Resposta baseada no contexto."
    mock_response.usage_metadata.total_token_count = 150
    mock_genai_client.models.generate_content.return_value = mock_response
    
    response, tokens = test_client_instance.generate_chat_response("Pergunta", context="Conteúdo do Doc")
    
    assert response == "Resposta baseada no contexto."
    assert tokens == 150
    # Get the called prompt
    args, kwargs = mock_genai_client.models.generate_content.call_args
    full_prompt = kwargs.get('contents')
    
    assert "--- CONTEXTO DO DOCUMENTO ---" in full_prompt
    assert "Conteúdo do Doc" in full_prompt
    assert "Pergunta" in full_prompt

@patch("app.core.ai_client.genai.Client")
def test_generate_chat_response_empty_ai_response(mock_genai_class):
    """Edge Case: Verify behavior when IA returns an empty response."""
    mock_genai_client = mock_genai_class.return_value
    test_client_instance = AIClient()
    
    mock_response = MagicMock()
    mock_response.text = "" # Empty text
    mock_response.usage_metadata.total_token_count = 10
    mock_genai_client.models.generate_content.return_value = mock_response
    
    response, tokens = test_client_instance.generate_chat_response("Pergunta")
    assert "A IA não conseguiu gerar uma resposta" in response
    assert tokens == 10

@patch("app.core.ai_client.genai.Client")
def test_generate_chat_response_client_not_configured(mock_genai_class):
    """Error Handling: Verify behavior when client is not initialized (no API Key)."""
    # Force client to be None by masking environment variable
    with patch("os.getenv", return_value=None):
        test_client_instance = AIClient()
        assert test_client_instance.client is None
    
    response, tokens = test_client_instance.generate_chat_response("Pergunta")
    assert "Erro Técnico: O motor de IA não foi configurado" in response
    assert tokens == 0

@patch("app.core.ai_client.genai.Client")
def test_generate_chat_response_api_failure(mock_genai_class):
    """Error Handling: Verify behavior when API call fails."""
    mock_genai_client = mock_genai_class.return_value
    test_client_instance = AIClient()
    
    mock_genai_client.models.generate_content.side_effect = Exception("API Outage")
    
    response, tokens = test_client_instance.generate_chat_response("Pergunta")
    assert "Estou com dificuldades para analisar este documento agora" in response
    assert tokens == 0

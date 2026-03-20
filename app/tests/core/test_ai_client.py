import pytest
from unittest.mock import MagicMock
from app.core.ai_client import AIClient, ai_client

def test_generate_chat_response_happy_path():
    """Happy Path: Verify chat response generation with a mocked client."""
    # Create a fresh AIClient instance to avoid interference with the singleton
    test_client_instance = AIClient()
    
    # Mock the internal client and its models.generate_content method
    mock_genai_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Esta é uma resposta da IA."
    mock_genai_client.models.generate_content.return_value = mock_response
    
    test_client_instance.client = mock_genai_client
    
    response = test_client_instance.generate_chat_response("Qual o prazo desta certidão?")
    
    assert response == "Esta é uma resposta da IA."
    mock_genai_client.models.generate_content.assert_called_once()

def test_generate_chat_response_with_context():
    """Happy Path: Verify prompt construction when context is provided."""
    test_client_instance = AIClient()
    mock_genai_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Resposta baseada no contexto."
    mock_genai_client.models.generate_content.return_value = mock_response
    test_client_instance.client = mock_genai_client
    
    response = test_client_instance.generate_chat_response("Pergunta", context="Conteúdo do Doc")
    
    assert response == "Resposta baseada no contexto."
    # Get the called prompt
    args, kwargs = mock_genai_client.models.generate_content.call_args
    full_prompt = kwargs.get('contents')
    if not full_prompt:
        # Fallback to positional if kwargs is empty (unlikely with our code but safe)
        full_prompt = args[1] if len(args) > 1 else args[0]
    
    assert "--- CONTEXTO DO DOCUMENTO ---" in full_prompt
    assert "Conteúdo do Doc" in full_prompt
    assert "Pergunta" in full_prompt

def test_generate_chat_response_empty_ai_response():
    """Edge Case: Verify behavior when IA returns an empty response."""
    test_client_instance = AIClient()
    mock_genai_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "" # Empty text
    mock_genai_client.models.generate_content.return_value = mock_response
    test_client_instance.client = mock_genai_client
    
    response = test_client_instance.generate_chat_response("Pergunta")
    assert "A IA não conseguiu gerar uma resposta" in response

def test_generate_chat_response_client_not_configured():
    """Error Handling: Verify behavior when client is not initialized (no API Key)."""
    test_client_instance = AIClient()
    test_client_instance.client = None # Explicitly None
    
    response = test_client_instance.generate_chat_response("Pergunta")
    assert "Erro Técnico: O motor de IA não foi configurado" in response

def test_generate_chat_response_api_failure():
    """Error Handling: Verify behavior when API call fails."""
    test_client_instance = AIClient()
    mock_genai_client = MagicMock()
    mock_genai_client.models.generate_content.side_effect = Exception("API Outage")
    test_client_instance.client = mock_genai_client
    
    response = test_client_instance.generate_chat_response("Pergunta")
    assert "Estou com dificuldades para analisar este documento agora" in response

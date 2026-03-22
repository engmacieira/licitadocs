import pytest
from fastapi import status
from unittest.mock import patch

def test_ai_chat_success(client, auth_headers):
    """Valida a interação com o Concierge (IA)."""
    # Mocking AIService.generate_concierge_response to avoid external AI calls
    with patch("app.services.ai_service.AIService.generate_concierge_response") as mock_ai:
        mock_ai.return_value = "Olá! Eu sou o seu assistente jurídico virtual. Em que posso ajudar?"
        
        payload = {"message": "Quantos documentos eu tenho no cofre?"}
        response = client.post("/ai/chat", json=payload, headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["response"] == "Olá! Eu sou o seu assistente jurídico virtual. Em que posso ajudar?"

def test_ai_chat_unauthorized(client):
    """Valida que o chat exige autenticação."""
    payload = {"message": "Hello"}
    response = client.post("/ai/chat", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

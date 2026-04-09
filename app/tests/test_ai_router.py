import pytest
from fastapi import status
from unittest.mock import patch

def test_ai_chat_success(client, auth_headers, test_company):
    """Valida a interação com o Concierge (IA)."""
    # Mocking AIService.generate_concierge_response to avoid external AI calls
    with patch("app.services.ai_service.AIService.generate_concierge_response") as mock_ai:
        mock_ai.return_value = "Olá! Eu sou o seu assistente jurídico virtual. Em que posso ajudar?"
        
        payload = {
            "message": "Quantos documentos eu tenho no cofre?",
            "company_id": str(test_company.id)
        }
        response = client.post("/ai/chat", json=payload, headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["response"] == "Olá! Eu sou o seu assistente jurídico virtual. Em que posso ajudar?"

def test_ai_chat_missing_company_id(client, auth_headers):
    """Valida que company_id é obrigatório."""
    payload = {"message": "Hello"}
    response = client.post("/ai/chat", json=payload, headers=auth_headers)
    assert response.status_code == 422

def test_ai_chat_forbidden_for_admin(client, admin_headers, test_company):
    """Valida que Admin NÃO tem acesso ao chat (Exclusivo para Clientes)."""
    payload = {
        "message": "Hello Admin",
        "company_id": str(test_company.id)
    }
    response = client.post("/ai/chat", json=payload, headers=admin_headers)
    assert response.status_code == 403
    assert "exclusivo para clientes" in response.json()["detail"].lower()

def test_ai_chat_unauthorized(client, test_company):
    """Valida que o chat exige autenticação."""
    payload = {
        "message": "Hello",
        "company_id": test_company.id
    }
    response = client.post("/ai/chat", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

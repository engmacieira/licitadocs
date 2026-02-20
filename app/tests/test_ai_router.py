"""
Testes de Integração de Rotas: AI Router.
Valida o endpoint do chatbot, garantindo segurança e 
ensinando o conceito vital de MOCKING em testes externos.
"""
from fastapi import status
from unittest.mock import patch

# ==========================================
# 🛡️ 1. TESTES DE SEGURANÇA (ACL BYPASS)
# ==========================================

def test_chat_unauthorized_public_user(client):
    """
    Cenário QA [Hardening]: Tentar conversar com a IA sem enviar token.
    Resultado Esperado: 401 Unauthorized.
    """
    payload = {"message": "Quais são meus documentos vencidos?"}
    response = client.post("/ai/chat", json=payload)
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

# ==========================================
# 🤖 2. TESTES DE FUNCIONAMENTO (COM MOCK)
# ==========================================

# O @patch substitui temporariamente a função original por uma "falsa" (Mock)
@patch("app.routers.ai_router.AIService.generate_concierge_response")
def test_chat_success_with_mock(mock_ai_service, authorized_client):
    """
    Cenário: Usuário válido faz uma pergunta para a IA.
    Resultado Esperado: Retornar a resposta simulada (Mock) sem gastar API real.
    """
    # 1. Setup: Ensinamos o nosso "dublê" a responder o que quisermos
    mock_ai_service.return_value = "Olá! Você tem 2 documentos vencidos, segundo nosso Cofre."
    
    # 2. Ação: Fazemos a requisição HTTP normalmente
    payload = {"message": "Como estão meus documentos?"}
    response = authorized_client.post("/ai/chat", json=payload)
    
    # 3. Validação: A resposta HTTP foi 200 OK?
    assert response.status_code == status.HTTP_200_OK
    
    # 4. Validação: O JSON devolveu a nossa resposta mockada?
    data = response.json()
    assert data["response"] == "Olá! Você tem 2 documentos vencidos, segundo nosso Cofre."
    
    # QA Bônus: Garante que o código do Router realmente tentou chamar o Service por baixo dos panos!
    mock_ai_service.assert_called_once()

def test_chat_empty_message(authorized_client):
    """
    Cenário: Tentar enviar um payload vazio ou sem a chave 'message'.
    Resultado Esperado: 422 Unprocessable Entity (O Pydantic tem que bloquear).
    """
    payload = {} # Sem a chave requerida
    response = authorized_client.post("/ai/chat", json=payload)
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
from fastapi import status
from unittest.mock import patch
from app.models.user_model import User

def test_chat_consultant_success(client, db_session):
    """
    Cenário: Usuário logado envia pergunta e recebe resposta (Simulada).
    """
    # 1. Setup: Criar Usuário e Logar
    email = "licitante@teste.com"
    password = "senha_forte_123"
    client.post("/auth/register", json={"email": email, "password": password})
    
    # Login para pegar token
    login_res = client.post("/auth/login", data={"username": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. O MOCK (A Mágica)
    # Estamos dizendo: "Quando o código tentar chamar ask_consultant, 
    # não vá no Google. Apenas retorne 'Resposta Simulada da IA'."
    with patch("app.services.ai_service.AIService.ask_consultant") as mock_ask:
        mock_ask.return_value = "Esta é uma resposta simulada da CND Federal."
        
        # 3. Ação: Enviar pergunta
        payload = {"message": "O que é CND?"}
        response = client.post("/ai/chat", json=payload, headers=headers)

    # 4. Asserção
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["response"] == "Esta é uma resposta simulada da CND Federal."
    
    # Garante que o serviço foi chamado exatamente 1 vez com a mensagem certa
    mock_ask.assert_called_once_with("O que é CND?")

def test_chat_consultant_empty_message(client, db_session):
    """
    Cenário: Usuário envia mensagem vazia (Validação).
    """
    # 1. Login
    client.post("/auth/register", json={"email": "user2@teste.com", "password": "123"}) # Senha fraca falha no registro, cuidado
    # Vamos usar o setup correto:
    email = "user2@teste.com" 
    client.post("/auth/register", json={"email": email, "password": "senha_forte_123"})
    token = client.post("/auth/login", data={"username": email, "password": "senha_forte_123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Ação: Mensagem vazia
    response = client.post("/ai/chat", json={"message": "   "}, headers=headers)

    # 3. Asserção
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_chat_unauthorized(client):
    """
    Cenário: Usuário sem login tenta falar com a IA.
    """
    response = client.post("/ai/chat", json={"message": "Ola"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
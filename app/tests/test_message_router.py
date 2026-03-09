"""
Testes de Integração de Rotas: Mensagens (Inbox/Chat).
Garante que as mensagens são enviadas, lidas e que a segurança B2B é mantida.
"""
from fastapi import status
# Importamos o nosso helper que cria uma empresa e um utilizador vinculado
from app.tests.test_company_router import setup_company_and_user

# ==========================================
# 🧪 TESTES DE CRIAÇÃO (POST)
# ==========================================

def test_send_message_success(db_session, client):
    """Cenário: Cliente envia uma mensagem válida para o chat da sua empresa."""
    company, user, token = setup_company_and_user(db_session)
    
    payload = {
        "content": "Olá, preciso de ajuda para atualizar a CND Municipal.",
        "message_type": "chat"
    }
    
    response = client.post(
        f"/messages/{company.id}",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    
    assert data["content"] == payload["content"]
    assert data["company_id"] == company.id
    assert data["sender_id"] == user.id
    assert data["is_read"] is False
    assert "sender_name" in data # Verifica se o nome amigável foi injetado (UX)

def test_send_message_forbidden(db_session, client):
    """
    Cenário de Segurança: Cliente tenta enviar mensagem para o chat 
    de uma empresa à qual ele não pertence. Deve ser bloqueado.
    """
    # Criamos Empresa A e Utilizador A
    company_a, user_a, token_a = setup_company_and_user(db_session)
    
    # Criamos Empresa B e Utilizador B (Para gerar um ID de empresa diferente)
    company_b, user_b, token_b = setup_company_and_user(db_session)
    
    # Utilizador A tenta enviar mensagem para a Empresa B
    response = client.post(
        f"/messages/{company_b.id}",
        json={"content": "Mensagem hacker!", "message_type": "chat"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    
    # A nossa dependência 'verify_company_access' deve travar isto!
    assert response.status_code == status.HTTP_403_FORBIDDEN


# ==========================================
# 🧪 TESTES DE LEITURA (GET / PATCH)
# ==========================================

def test_list_messages_success(db_session, client):
    """Cenário: Cliente visualiza o histórico de mensagens, ordenado corretamente."""
    company, user, token = setup_company_and_user(db_session)
    
    # O Cliente envia 2 mensagens
    client.post(f"/messages/{company.id}", json={"content": "Primeira"}, headers={"Authorization": f"Bearer {token}"})
    client.post(f"/messages/{company.id}", json={"content": "Segunda"}, headers={"Authorization": f"Bearer {token}"})
    
    # Vamos buscar a lista
    response = client.get(
        f"/messages/{company.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert len(data) == 2
    assert data[0]["content"] == "Primeira" # Garante a ordenação cronológica ascendente
    assert data[1]["content"] == "Segunda"

def test_mark_message_as_read(db_session, client):
    """Cenário: Cliente marca uma mensagem como lida para apagar a notificação."""
    company, user, token = setup_company_and_user(db_session)
    
    # 1. Cria a mensagem
    create_resp = client.post(
        f"/messages/{company.id}",
        json={"content": "Aviso do Admin"},
        headers={"Authorization": f"Bearer {token}"}
    )
    msg_id = create_resp.json()["id"]
    
    # 2. Marca como lida
    read_resp = client.patch(
        f"/messages/{msg_id}/read",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert read_resp.status_code == status.HTTP_200_OK
    
    # 3. Confirma se o status mudou no banco (listando as mensagens)
    list_resp = client.get(
        f"/messages/{company.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert list_resp.json()[0]["is_read"] is True

def test_mark_message_as_read_forbidden(db_session, client):
    """
    Cenário Segurança: Cliente tenta marcar como lida a mensagem de outra empresa.
    """
    company_a, user_a, token_a = setup_company_and_user(db_session)
    company_b, user_b, token_b = setup_company_and_user(db_session)
    
    # A empresa A recebe uma mensagem
    create_resp = client.post(
        f"/messages/{company_a.id}",
        json={"content": "Confidencial Empresa A"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    msg_id = create_resp.json()["id"]
    
    # O utilizador B tenta marcar a mensagem da empresa A como lida
    read_resp = client.patch(
        f"/messages/{msg_id}/read",
        headers={"Authorization": f"Bearer {token_b}"} # Token do invasor
    )
    
    assert read_resp.status_code == status.HTTP_403_FORBIDDEN
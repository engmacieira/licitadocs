import pytest
from fastapi import status
from app.models.message_model import Message

def test_list_messages_empty(client, auth_headers, test_company):
    """Valida listagem de mensagens vazia."""
    response = client.get(f"/messages/{test_company.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_create_broadcast_admin_only(client, auth_headers, test_company):
    """Valida restrição: apenas Admin pode criar broadcast."""
    payload = {
        "subject": "Broadcast Test",
        "content": "Test Content",
        "message_type": "info",
        "send_to_all": True
    }
    response = client.post("/messages/admin/broadcast", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_mark_as_read_success(client, auth_headers, test_user, test_company, db_session):
    """Valida marcação de mensagem como lida."""
    # 1. Cria mensagem via DB
    msg = Message(
        subject="Test Msg",
        content="Test Content",
        company_id=test_company.id,
        sender_id=test_user.id,
        message_type="info",
        is_read=False
    )
    db_session.add(msg)
    db_session.commit()

    # 2. Marca como lida
    response = client.patch(f"/messages/{msg.id}/read", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert "sucesso" in response.json()["status"]

def test_delete_message_soft_delete(client, auth_headers, test_user, test_company, db_session):
    """Valida soft delete de mensagem (Protocolo via Repositório, pois não há endpoint de delete)."""
    # 1. Cria mensagem
    msg = Message(
        subject="To Delete",
        content="Delete Me",
        company_id=test_company.id,
        sender_id=test_user.id,
        message_type="info"
    )
    db_session.add(msg)
    db_session.commit()

    # 2. Deleta via Repositório
    from app.repositories.message_repository import MessageRepository
    MessageRepository.soft_delete(db_session, msg.id)

    # 3. Valida no DB (Soft Delete)
    db_session.expire_all()
    deleted_msg = db_session.query(Message).filter_by(id=msg.id).first()
    assert deleted_msg is not None
    assert deleted_msg.deleted_at is not None

    # 4. Valida que não aparece na listagem padrão
    response = client.get(f"/messages/{test_company.id}", headers=auth_headers)
    assert not any(m["id"] == str(msg.id) for m in response.json())

def test_message_router_error_cases(client, db_session):
    """Testa casos de erro (404/403) no Message Router."""
    from app.core.security import create_access_token
    from app.models.user_model import User, UserRole
    import os
    
    admin_email = f"admin_err_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="h", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}

    # 404: Empresa inexistente no envio (Admin bypasses 403)
    response = client.post("/messages/non_existent", headers=headers, json={"content": "Oi", "message_type": "chat"})
    assert response.status_code == 404
    
    # 404: Mensagem inexistente na leitura
    response = client.patch("/messages/non_existent/read", headers=headers)
    assert response.status_code == 404
    
    # 404: Ticket inexistente na resolução
    response = client.patch("/messages/non_existent/resolve", headers=headers)
    assert response.status_code == 404

def test_message_admin_views_and_broadcast(client, db_session, test_company):
    """Testa visões administrativas e broadcasts de mensagens."""
    from app.core.security import create_access_token
    from app.models.user_model import User, UserRole
    import os
    
    admin_email = f"admin_msg_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Listar tudo (Admin)
    response = client.get("/messages/admin/all", headers=headers)
    assert response.status_code == 200
    
    # 2. Listar alertas (Admin)
    response = client.get("/messages/admin/alerts", headers=headers)
    assert response.status_code == 200
    
    # 3. Broadcast para TODAS as empresas
    payload = {
        "subject": "Aviso Global",
        "content": "Manutenção programada",
        "send_to_all": True
    }
    response = client.post("/messages/admin/broadcast", headers=headers, json=payload)
    assert response.status_code == 201
    
    # 4. Broadcast para empresa específica
    payload_spec = {
        "subject": "Aviso Local",
        "content": "Sua conta vai vencer",
        "send_to_all": False,
        "company_ids": [str(test_company.id)]
    }
    response = client.post("/messages/admin/broadcast", headers=headers, json=payload_spec)
    assert response.status_code == 201

    # 5. Erro no broadcast: nenhuma empresa
    payload_empty = {
        "subject": "X",
        "content": "Y",
        "send_to_all": False,
        "company_ids": []
    }
    response = client.post("/messages/admin/broadcast", headers=headers, json=payload_empty)
    assert response.status_code == 400

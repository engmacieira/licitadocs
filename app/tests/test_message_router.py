import pytest
from unittest.mock import patch
from app.models.message_model import Message
from app.models.company_model import Company

# --- FIXTURE MÁGICA: BYPASS DO ACL (403) ---
@pytest.fixture(autouse=True)
def bypass_company_access():
    """
    Desliga temporariamente a função 'verify_company_access' dentro do router.
    Isso evita o Erro 403, permitindo testar a lógica da Caixa de Mensagens 
    sem precisar criar vínculos complexos de usuário-empresa no banco em memória.
    """
    with patch("app.routers.message_router.verify_company_access") as mock_verify:
        yield mock_verify

# Helper: cria a empresa direto no banco
def create_test_company(db_session):
    company = Company(
        cnpj="00000000000100",
        razao_social="Empresa Teste SA"
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    return company

# --- 1. TESTE: CRIAR UM NOVO TICKET ---
def test_create_new_ticket(admin_client, db_session):
    company = create_test_company(db_session)
    
    payload = {
        "content": "Cliente relatou um erro na CND Federal.",
        "message_type": "action_required",
        "subject": "Erro na CND",
        "related_document_id": "doc-123-uuid"
    }
    
    response = admin_client.post(
        f"/messages/{company.id}",
        json=payload
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == payload["content"]
    assert data["subject"] == payload["subject"]
    assert data["message_type"] == "action_required"
    assert data["parent_id"] is None
    assert data["is_resolved"] is False
    
    db_msg = db_session.query(Message).filter(Message.id == data["id"]).first()
    assert db_msg is not None

# --- 2. TESTE: RESPONDER A UM TICKET (THREAD) ---
def test_reply_to_ticket(admin_client, db_session):
    company = create_test_company(db_session)
    
    parent_msg = Message(company_id=company.id, content="Mensagem Original")
    db_session.add(parent_msg)
    db_session.commit()
    
    payload = {
        "content": "Estamos a verificar a situação.",
        "message_type": "chat",
        "parent_id": parent_msg.id
    }
    
    response = admin_client.post(
        f"/messages/{company.id}",
        json=payload
    )
    
    assert response.status_code == 201
    assert response.json()["parent_id"] == parent_msg.id

# --- 3. TESTE: LISTAR MENSAGENS ---
def test_list_messages(admin_client, db_session):
    company = create_test_company(db_session)
    
    msg1 = Message(company_id=company.id, content="Aviso 1", message_type="system")
    msg2 = Message(company_id=company.id, content="Aviso 2", message_type="chat")
    db_session.add_all([msg1, msg2])
    db_session.commit()
    
    response = admin_client.get(f"/messages/{company.id}")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert any(m["content"] == "Aviso 1" and m["sender_name"] == "Aviso do Sistema" for m in data)

# --- 4. TESTE: MARCAR COMO LIDO ---
def test_mark_as_read(admin_client, db_session):
    company = create_test_company(db_session)
    
    msg = Message(company_id=company.id, content="Teste de Leitura", is_read=False)
    db_session.add(msg)
    db_session.commit()
    
    response = admin_client.patch(f"/messages/{msg.id}/read")
    
    assert response.status_code == 200
    
    db_session.refresh(msg)
    assert msg.is_read is True

# --- 5. TESTE: RESOLVER TICKET ---
def test_resolve_ticket(admin_client, db_session):
    company = create_test_company(db_session)
    
    msg = Message(company_id=company.id, content="Pendência", is_resolved=False)
    db_session.add(msg)
    db_session.commit()
    
    response = admin_client.patch(f"/messages/{msg.id}/resolve")
    
    assert response.status_code == 200
    
    db_session.refresh(msg)
    assert msg.is_resolved is True
import pytest
import uuid
from app.models.message_model import Message
from app.models.company_model import Company
from app.models.user_model import User

@pytest.fixture
def message_setup(db_session):
    uid = uuid.uuid4().hex[:6]
    company = Company(cnpj=f"11221122{uid}", razao_social="Empresa Mensagens")
    user = User(email=f"sender_{uid}@example.com", password_hash="123")
    db_session.add(company)
    db_session.add(user)
    db_session.commit()
    return company, user

def test_create_message_happy_path(db_session, message_setup):
    company, user = message_setup
    msg = Message(
        company_id=company.id,
        sender_id=user.id,
        subject="Dúvida Técnica",
        content="Como faço para subir o contrato?",
        message_type="chat"
    )
    db_session.add(msg)
    db_session.commit()
    
    assert msg.id is not None
    assert msg.company.id == company.id
    assert msg.sender.id == user.id
    assert msg.is_read is False

def test_message_reply_thread(db_session, message_setup):
    company, user = message_setup
    
    # Mensagem Original (Ticket)
    parent = Message(
        company_id=company.id,
        sender_id=user.id,
        content="Ticket Original",
        subject="Ticket #1"
    )
    db_session.add(parent)
    db_session.commit()
    
    # Resposta
    reply = Message(
        company_id=company.id,
        sender_id=None,  # Sistema/Admin
        content="Resposta Automática",
        parent_id=parent.id
    )
    db_session.add(reply)
    db_session.commit()
    
    assert reply.parent.id == parent.id
    assert len(parent.replies) == 1
    assert parent.replies[0].content == "Resposta Automática"

def test_system_message_no_sender(db_session, message_setup):
    company, _ = message_setup
    msg = Message(
        company_id=company.id,
        sender_id=None,
        content="Alerta de Vencimento",
        message_type="system"
    )
    db_session.add(msg)
    db_session.commit()
    
    assert msg.sender is None
    assert msg.message_type == "system"

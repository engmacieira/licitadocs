import pytest
from sqlalchemy.orm import Session
from app.repositories.message_repository import MessageRepository
from app.schemas.message_schemas import MessageCreate
from app.models.message_model import Message

def test_message_happy_path(db_session: Session, test_company, test_user):
    """Valida o envio e leitura de mensagens."""
    message_in = MessageCreate(
        content="Olá, preciso de ajuda com minha CND.",
        message_type="chat",
        subject="Dúvida CND"
    )
    message = MessageRepository.create(
        db_session, test_company.id, test_user.id, message_in
    )
    
    assert message.id is not None
    assert message.content == "Olá, preciso de ajuda com minha CND."
    assert message.is_read is False

def test_message_mark_as_read_and_resolve(db_session: Session, test_company, test_user):
    """Valida a atualização de status de leitura e resolução de tickets."""
    message_in = MessageCreate(content="Teste", message_type="chat")
    message = MessageRepository.create(db_session, test_company.id, test_user.id, message_in)
    
    # Marca como lida
    MessageRepository.mark_as_read(db_session, message.id)
    assert message.is_read is True
    
    # Resolve ticket
    MessageRepository.resolve_ticket(db_session, message.id)
    assert message.is_resolved is True

def test_message_threads(db_session: Session, test_company, test_user):
    """Valida o relacionamento de threads (parent/replies)."""
    # Mensagem pai
    parent_in = MessageCreate(content="Pergunta", message_type="chat")
    parent = MessageRepository.create(db_session, test_company.id, test_user.id, parent_in)
    
    # Resposta
    reply_in = MessageCreate(content="Resposta", message_type="chat", parent_id=parent.id)
    reply = MessageRepository.create(db_session, test_company.id, test_user.id, reply_in)
    
    db_session.refresh(parent)
    assert len(parent.replies) == 1
    assert parent.replies[0].id == reply.id
    assert reply.parent_id == parent.id

def test_message_soft_delete(db_session: Session, test_company, test_user):
    """Valida o protocolo de Soft Delete para mensagens."""
    message_in = MessageCreate(content="Para deletar", message_type="chat")
    message = MessageRepository.create(db_session, test_company.id, test_user.id, message_in)
    message_id = message.id
    
    # Soft delete
    MessageRepository.soft_delete(db_session, message_id)
    
    # Verifica se sumiu da listagem da empresa
    history = MessageRepository.get_by_company(db_session, test_company.id)
    assert not any(m.id == message_id for m in history)
    
    # Verifica get_by_id
    assert MessageRepository.get_by_id(db_session, message_id) is None
def test_message_repository_admin_view(db_session: Session, test_company, test_user):
    """Valida a visão do administrador para tickets."""
    message_in = MessageCreate(content="Ticket Admin", message_type="ticket")
    MessageRepository.create(db_session, test_company.id, test_user.id, message_in)
    
    tickets = MessageRepository.get_all_tickets_admin(db_session)
    assert len(tickets) >= 1
    assert any(t.content == "Ticket Admin" for t in tickets)

def test_message_repository_database_errors(db_session: Session, monkeypatch):
    """Testa tratamento de DatabaseError no MessageRepository via mock."""
    from sqlalchemy.exc import DatabaseError
    from fastapi import HTTPException
    
    def mock_error(*args, **kwargs):
        raise DatabaseError("statement", "params", "orig")

    from sqlalchemy.orm import Query
    monkeypatch.setattr(Query, "all", mock_error)
    # create usa db.commit() which causes the error
    monkeypatch.setattr(db_session, "commit", mock_error)
    
    with pytest.raises(HTTPException) as exc:
        MessageRepository.create(db_session, "any", "any", MessageCreate(content="error", message_type="chat"))
    assert exc.value.status_code == 500

    with pytest.raises(HTTPException) as exc:
        MessageRepository.get_by_company(db_session, "any")
    assert exc.value.status_code == 500

    with pytest.raises(HTTPException) as exc:
        MessageRepository.get_all_tickets_admin(db_session)
    assert exc.value.status_code == 500

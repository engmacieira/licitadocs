import pytest
from app.schemas.message_schemas import MessageCreate, MessageBroadcast, MessageResponse
from app.models.message_model import Message
from sqlalchemy.orm import Session

# --- Caminho Feliz ---

def test_message_create_happy_path():
    """Valida criação de mensagem simples."""
    data = {
        "content": "Olá, preciso de ajuda com a CND da Receita.",
        "message_type": "chat",
        "subject": "Dúvida Técnica"
    }
    msg_in = MessageCreate(**data)
    assert msg_in.content == data["content"]
    assert msg_in.message_type == "chat"

def test_message_broadcast_validation():
    """Valida o schema de envio em massa pelo Admin."""
    data = {
        "subject": "Manutenção do Sistema",
        "content": "O sistema ficará offline por 2 horas.",
        "send_to_all": True
    }
    broadcast = MessageBroadcast(**data)
    assert broadcast.send_to_all is True

from app.models.company_model import Company

def test_message_persistence(db_session: Session, cnpj_valido, schema_tester):
    """Verifica persistência de mensagem no banco (DRY)."""
    # 1. Necessário empresa para o FK company_id
    company = Company(cnpj=cnpj_valido, razao_social="Context Corp")
    db_session.add(company)
    db_session.commit()

    msg_in = MessageCreate(
        content="Mensagem de teste para banco",
        message_type="system"
    )
    # Passamos o company_id explicitamente para satisfazer o FK
    msg_model = schema_tester.persist_and_verify(
        db_session, Message, msg_in, extra_fields={"company_id": company.id}
    )
    
    assert msg_model.id is not None
    assert msg_model.content == "Mensagem de teste para banco"

# --- Casos de Borda ---

def test_message_with_empty_broadcast_list():
    """Valida que uma lista vazia de IDs é aceita no broadcast se send_to_all=True."""
    broadcast = MessageBroadcast(
        subject="Global", content="Msg", send_to_all=True, company_ids=[]
    )
    assert broadcast.company_ids == []

# --- Tratamento de Erros ---

def test_message_empty_content(schema_tester):
    """Verifica se conteúdo vazio é rejeitado (dependendo da regra do Field)."""
    # Se ... for usado, é obrigatório. Pydantic 2 valida nulidade por padrão se não houver Optional.
    schema_tester.assert_validation_error(
        MessageCreate, 
        {"message_type": "chat"}, # falta content
        "content"
    )

import pytest
from fastapi import status
from unittest.mock import patch
from app.models.message_model import Message
from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.core.security import create_access_token
import os

@pytest.fixture
def admin_user(db_session):
    """Cria um usuário administrador para testes."""
    from app.repositories.user_repository import UserRepository
    from app.schemas.user_schemas import UserCreate
    from app.tests.conftest import generate_valid_cpf
    
    email = f"admin_{os.urandom(4).hex()}@example.com"
    user_in = UserCreate(
        email=email,
        password="password123",
        is_active=True,
        cpf=generate_valid_cpf(),
        rg="7654321",
        celular="11888888888",
        genero="M"
    )
    user = UserRepository.create_user(db_session, user_in)
    user.role = UserRole.ADMIN.value
    db_session.commit()
    return user

@pytest.fixture
def admin_headers(admin_user):
    """Fixture que fornece cabeçalhos de autenticação para o admin_user."""
    access_token = create_access_token(data={"sub": admin_user.email})
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture
def other_company(db_session):
    """Cria uma outra empresa para testes de IDOR."""
    from app.repositories.company_repository import CompanyRepository
    from app.schemas.company_schemas import CompanyCreate
    from app.tests.conftest import generate_valid_cnpj
    
    company_in = CompanyCreate(
        razao_social="Other Company S.A.",
        cnpj=generate_valid_cnpj()
    )
    return CompanyRepository.create(db_session, company_in)

def test_spoofing_prevention(client, auth_headers, test_company):
    """
    Missão 1: Prevenir Spoofing de Alertas.
    Valida que um cliente comum tentando enviar message_type="system" 
    tem seu tipo forçado para "chat".
    """
    payload = {
        "content": "Aviso falso do sistema",
        "message_type": "system",
        "subject": "Urgente"
    }
    response = client.post(f"/messages/{test_company.id}", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["message_type"] == "chat"

def test_idor_thread_hijacking_prevention(client, auth_headers, test_company, other_company, db_session):
    """
    Missão 2: Blindar o Sequestro de Threads / IDOR.
    Valida que um cliente não pode vincular uma mensagem a um parent_id de outra empresa.
    """
    # 1. Cria uma mensagem na 'other_company'
    other_msg = Message(
        company_id=other_company.id,
        content="Mensagem da outra empresa",
        message_type="chat"
    )
    db_session.add(other_msg)
    db_session.commit()

    # 2. Tenta responder a essa mensagem usando a 'test_company' na URL
    payload = {
        "content": "Tentativa de sequestro de thread",
        "parent_id": str(other_msg.id),
        "message_type": "chat"
    }
    response = client.post(f"/messages/{test_company.id}", json=payload, headers=auth_headers)
    
    # Deve retornar 403 Forbidden
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Acesso negado" in response.json()["detail"]

def test_broadcast_bulk_performance(client, admin_headers, db_session, test_company, other_company):
    """
    Missão 3: Resolver o DoS do Broadcast (Bulk Create).
    Valida que o db.commit() é chamado apenas 1 vez durante o broadcast.
    """
    payload = {
        "subject": "Aviso Massivo",
        "content": "Conteúdo para todos",
        "send_to_all": False,
        "company_ids": [str(test_company.id), str(other_company.id)]
    }

    # Mockamos o commit do SQLAlchemy
    with patch("sqlalchemy.orm.Session.commit") as mock_commit:
        response = client.post("/messages/admin/broadcast", json=payload, headers=admin_headers)
        assert response.status_code == status.HTTP_201_CREATED
        
        # O commit deve ser chamado exatamente uma vez (no final do create_bulk)
        assert mock_commit.call_count == 1

def test_repository_decoupling_error_handling(client, auth_headers, test_company):
    """
    Missão 4: Limpar a Arquitetura do Repositório.
    Valida que os erros do repositório são tratados no router retornando HTTPException.
    """
    # Simulamos um erro no Repositório ao criar mensagem
    with patch("app.repositories.message_repository.MessageRepository.create", side_effect=Exception("DB Error")):
        payload = {"content": "Teste erro repo", "message_type": "chat"}
        response = client.post(f"/messages/{test_company.id}", json=payload, headers=auth_headers)
        
        # O router deve capturar a exceção e retornar 500 (conforme implementado)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Erro interno" in response.json()["detail"]

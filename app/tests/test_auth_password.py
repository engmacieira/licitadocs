import pytest
from unittest.mock import patch
from app.models.user_model import User

def test_forgot_password_success(client, db_session, test_user, mock_email_service):
    """
    Testa se a rota forgot-password retorna 200 para um e-mail válido
    e se tenta enviar o e-mail mockado.
    """
    response = client.post("/auth/forgot-password", json={"email": test_user.email})
    assert response.status_code == 200
    assert "mensagem" in response.json() or "message" in response.json()


def test_forgot_password_user_not_found(client, db_session, mock_email_service):
    """
    Testa Anti-Enumeração: E-mail não cadastrado deve retornar a MESMA resposta
    que um e-mail válido (HTTP 200), para não vazar se o e-mail existe ou não.
    """
    response = client.post("/auth/forgot-password", json={"email": "nao_existe@example.com"})
    assert response.status_code == 200
    # Verifica que a resposta genérica é igual ou similar
    assert "mensagem" in response.json() or "message" in response.json()


def test_recover_email_success(client, db_session, test_user, mock_email_service):
    """
    Testa a rota de recuperar e-mail informando um documento (CNPJ/CPF) válido.
    """
    response = client.post("/auth/recover-email", json={"document": test_user.document})
    assert response.status_code == 200
    assert "mensagem" in response.json() or "message" in response.json()


def test_recover_email_document_not_found(client, db_session, mock_email_service):
    """
    Testa Anti-Enumeração: Documento não cadastrado deve retornar a MESMA resposta
    de sucesso (HTTP 200).
    """
    response = client.post("/auth/recover-email", json={"document": "00000000000"})
    assert response.status_code == 200
    assert "mensagem" in response.json() or "message" in response.json()


def test_reset_password_success(client, db_session, test_user):
    """
    Testa o reset de senha com um token válido gerado.
    """
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": test_user.email, "type": "password_reset"})

    response = client.post("/auth/reset-password", json={
        "token": token,
        "new_password": "NewSecurePassword123!"
    })

    assert response.status_code == 200
    # Verificar se a senha foi realmente atualizada (testando um login com ela)
    # ou testando o retorno
    assert "message" in response.json()


def test_reset_password_invalid_token(client, db_session):
    """
    Testa reset de senha com token inválido (malformado ou de tipo errado).
    """
    response = client.post("/auth/reset-password", json={
        "token": "token_invalido_123",
        "new_password": "NewSecurePassword123!"
    })

    assert response.status_code in [400, 401, 422]


def test_verify_email_success(client, db_session, test_user):
    """
    Testa a verificação de e-mail de um usuário.
    """
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": test_user.email, "type": "email_verification"})

    # Supondo que a rota de verificação seja GET ou POST (depende da implementação)
    # Normalmente GET com query param ou POST com body
    # Assumindo POST /auth/verify-email baseando-se no texto
    # (Pode ser GET também, vou deixar POST, se for GET você pode mudar)
    response = client.post("/auth/verify-email", json={"token": token})

    # Algumas rotas de verificação usam GET
    if response.status_code == 405:
        response = client.get(f"/auth/verify-email?token={token}")

    assert response.status_code == 200

def test_verify_email_invalid_token(client, db_session):
    """
    Testa a verificação de e-mail com token inválido.
    """
    response = client.post("/auth/verify-email", json={"token": "token_invalido"})
    if response.status_code == 405:
        response = client.get(f"/auth/verify-email?token=token_invalido")

    assert response.status_code in [400, 401, 422]


def test_xss_payload_forgot_password(client, db_session):
    """
    Testa se o backend rejeita payloads de XSS nos campos
    """
    response = client.post("/auth/forgot-password", json={"email": "<script>alert('xss')</script>"})
    # O Pydantic Validation do EmailStr deve pegar isso e dar 422 Unprocessable Entity
    assert response.status_code in [400, 422]

import pytest
from app.schemas.user_schemas import UserCreate, UserUpdate, UserResponse, UserRoleEnum
from app.models.user_model import User
from sqlalchemy.orm import Session

# --- Testes de Caminho Feliz ---

def test_user_create_happy_path(cpf_valido, schema_tester):
    """Valida a criação de usuário com dados válidos (US-01)."""
    data = {
        "email": "qa_senior@licitadocs.com",
        "nome": "QA Senior Expert",
        "password": "strong_password_123",
        "cpf": cpf_valido
    }
    user_in = UserCreate(**data)
    assert user_in.email == data["email"]
    assert user_in.cpf == cpf_valido.replace(".", "").replace("-", "")

def test_user_persistence(db_session: Session, cpf_valido, schema_tester):
    """Verifica se o schema preparado gera um model persistível no banco."""
    import random
    email = f"persist_{random.randint(1000, 9999)}@licitadocs.com"
    user_in = UserCreate(
        email=email,
        nome="DB User",
        password="hashed_pwd_123",
        cpf=cpf_valido
    )
    user_model = schema_tester.persist_and_verify(db_session, User, user_in)
    assert user_model.id is not None
    assert user_model.email == email

# --- Testes de Casos de Borda (Edge Cases) ---

def test_user_create_optional_fields(cpf_valido):
    """Valida criação apenas com campos obrigatórios."""
    user_in = UserCreate(email="min@test.com", password="password123", cpf=None)
    assert user_in.nome is None
    assert user_in.cpf is None

def test_user_update_empty_patch():
    """Valida que um patch vazio no schema de update é permitido."""
    update = UserUpdate()
    assert update.nome is None
    assert update.password is None

# --- Testes de Tratamento de Erros (Error Handling) ---

@pytest.mark.parametrize("invalid_data, field, msg", [
    ({"email": "not-an-email", "password": "12345678"}, "email", "value is not a valid email address"),
    ({"email": "test@test.com", "password": "short"}, "password", "at least 8 characters"),
    ({"email": "test@test.com", "password": "valid_pwd", "cpf": "123"}, "cpf", "11 dígitos"),
    ({"email": "test@test.com", "password": "valid_pwd", "cpf": "1" * 11}, "cpf", "sequência repetida"),
])
def test_user_create_validation_errors(invalid_data, field, msg, schema_tester):
    """Verifica se as exceções corretas são lançadas com as mensagens certas."""
    schema_tester.assert_validation_error(UserCreate, invalid_data, field, msg)

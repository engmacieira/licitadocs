import pytest
from app.schemas.company_schemas import CompanyBase, CompanyCreate, CompanyUpdate, CompanyResponse
from app.models.company_model import Company
from sqlalchemy.orm import Session

# --- Caminho Feliz ---

def test_company_create_happy_path(cnpj_valido):
    """Valida criação de empresa com CNPJ real válido (US-2601)."""
    data = {
        "cnpj": cnpj_valido,
        "razao_social": "LicitaDocs Enterprise LTDA",
        "nome_fantasia": "LicitaDocs",
        "email_corporativo": "contato@licitadocs.com",
        "estado": "SP"
    }
    company_in = CompanyCreate(**data)
    assert company_in.cnpj == cnpj_valido
    assert company_in.name == data["razao_social"]

def test_company_persistence(db_session: Session, cnpj_valido, schema_tester):
    """Verifica persistência da empresa no banco via schema."""
    company_in = CompanyCreate(
        cnpj=cnpj_valido,
        razao_social="Persistence Corp",
        estado="RJ"
    )
    company_model = schema_tester.persist_and_verify(db_session, Company, company_in)
    assert company_model.id is not None
    assert company_model.cnpj == cnpj_valido

# --- Casos de Borda ---

def test_company_update_partial():
    """Valida atualização parcial de campos não obrigatórios."""
    update = CompanyUpdate(nome_fantasia="Novo Nome", is_payment_active=True)
    assert update.nome_fantasia == "Novo Nome"
    assert update.name is None

def test_company_state_length(cnpj_valido, schema_tester):
    """Valida que o estado deve ter exatamente 2 caracteres."""
    schema_tester.assert_validation_error(
        CompanyCreate, 
        {"cnpj": cnpj_valido, "razao_social": "Test", "estado": "SAO"}, 
        "estado"
    )

# --- Tratamento de Erros ---

@pytest.mark.parametrize("invalid_cnpj, msg", [
    ("123", "14 dígitos"),
    ("1" * 14, "sequência repetida"),
    ("12.345.678/0001-90", "falhou"),
])
def test_company_invalid_cnpj(invalid_cnpj, msg, schema_tester):
    data = {"cnpj": invalid_cnpj, "razao_social": "Fail Corp"}
    schema_tester.assert_validation_error(CompanyBase, data, "cnpj", msg)

import pytest
from datetime import date
from app.schemas.emission_request_schemas import EmissionRequestCreate, EmissionRequestUpdate
from app.schemas.emission_rule_schemas import EmissionRuleCreate, EmissionRuleUpdate
from app.models.emission_request_model import EmissionRequest
from app.models.emission_rule_model import EmissionRule
from sqlalchemy.orm import Session

# --- Emission Requests ---

def test_emission_request_create():
    """Valida criação de solicitação de certidão."""
    data = {"company_id": "comp-uuid-123"}
    req_in = EmissionRequestCreate(**data)
    assert req_in.company_id == "comp-uuid-123"

def test_emission_request_update():
    """Valida atualização de status e previsão."""
    data = {"status": "processing", "estimated_date": date(2023, 12, 31)}
    update = EmissionRequestUpdate(**data)
    assert update.status == "processing"
    assert update.estimated_date == date(2023, 12, 31)

from app.models.company_model import Company
from app.models.user_model import User
from app.models.emission_rule_model import EmissionRule

def test_emission_request_persistence(db_session: Session, cnpj_valido, cpf_valido, schema_tester):
    """Verifica persistência de solicitação no banco (Fila de Trabalho)."""
    # 1. Dependências: Empresa, Usuário e Regra
    company = Company(cnpj=cnpj_valido, razao_social="Workforce Corp")
    db_session.add(company)
    
    user = User(email=f"req_{cnpj_valido}@test.com", password_hash="hash", nome="Requester")
    db_session.add(user)
    
    cat = DocumentCategory(name="Core", slug="core")
    db_session.add(cat)
    db_session.commit() # Salva para ter IDs
    
    doc_type = DocumentType(name="Cert", slug="cert", category_id=cat.id)
    db_session.add(doc_type)
    db_session.commit()
    
    rule = EmissionRule(document_type_id=doc_type.id, state="SP")
    db_session.add(rule)
    db_session.commit()

    # 2. Schema e Persistência
    req_in = EmissionRequestCreate(company_id=company.id)
    req_model = EmissionRequest(
        company_id=req_in.company_id,
        emission_rule_id=rule.id,
        requested_by_id=user.id,
        status="pending"
    )
    db_session.add(req_model)
    db_session.commit()
    db_session.refresh(req_model)
    assert req_model.id is not None

# --- Emission Rules ---

def test_emission_rule_create(schema_tester):
    """Valida regra de emissão (Bússola Técnica)."""
    data = {
        "document_type_id": "type-123",
        "state": "SP",
        "city": "São Paulo",
        "emission_link": "https://prefeitura.sp.gov.br",
        "contact_email": "fiscal@sp.gov.br"
    }
    rule_in = EmissionRuleCreate(**data)
    assert rule_in.state == "SP"
    assert rule_in.contact_email == "fiscal@sp.gov.br"

def test_emission_rule_invalid_state(schema_tester):
    """Verifica erro no estado (sigla maior que 2)."""
    schema_tester.assert_validation_error(
        EmissionRuleCreate, 
        {"document_type_id": "1", "state": "SAO_PAULO"}, 
        "state"
    )

from app.models.document_type_model import DocumentType
from app.models.document_category_model import DocumentCategory

def test_emission_rule_persistence(db_session: Session, schema_tester):
    """Verifica persistência de regra no banco (FK dependente)."""
    # 1. Criar dependências: Categoria -> Tipo
    cat = DocumentCategory(name="Regras", slug="regras")
    db_session.add(cat)
    db_session.commit()
    
    doc_type = DocumentType(name="Certidão Teste", slug="cert_teste", category_id=cat.id)
    db_session.add(doc_type)
    db_session.commit()

    rule_in = EmissionRuleCreate(document_type_id=doc_type.id, state="RJ")
    rule_model = schema_tester.persist_and_verify(db_session, EmissionRule, rule_in)
    assert rule_model.id is not None
    assert rule_model.state == "RJ"

import pytest
import uuid
from app.models.document_automation_model import DocumentAutomationConfig
from app.models.emission_rule_model import EmissionRule
from app.models.emission_request_model import EmissionRequest
from app.models.company_model import Company
from app.models.document_type_model import DocumentType
from app.models.user_model import User
from app.models.document_category_model import DocumentCategory

@pytest.fixture
def base_setup(db_session):
    uid = uuid.uuid4().hex[:6]
    company = Company(cnpj=f"99887766{uid}", razao_social="Empresa Automação")
    user = User(email=f"req_user_{uid}@example.com", password_hash="123")
    cat = DocumentCategory(name=f"Fiscal_{uid}", slug=f"fiscal_{uid}")
    db_session.add(company)
    db_session.add(user)
    db_session.add(cat)
    db_session.commit()
    
    doc_type = DocumentType(name=f"FGTS_{uid}", slug=f"fgts_{uid}", category_id=cat.id)
    db_session.add(doc_type)
    db_session.commit()
    return company, doc_type, user, uid

def test_document_automation_happy_path(db_session, base_setup):
    company, doc_type, _, uid = base_setup
    automation = DocumentAutomationConfig(
        document_type_id=doc_type.id,
        is_automatable=True,
        strategy_name="FGTS_STRATEGY"
    )
    db_session.add(automation)
    db_session.commit()
    
    assert automation.id is not None
    assert automation.document_type.name == f"FGTS_{uid}"

def test_emission_rule_creation(db_session, base_setup):
    _, doc_type, _, uid = base_setup
    rule = EmissionRule(
        document_type_id=doc_type.id,
        state="SP",
        emission_link="http://link.com"
    )
    db_session.add(rule)
    db_session.commit()
    
    assert rule.id is not None
    assert rule.document_type.name == f"FGTS_{uid}"

def test_emission_request_happy_path(db_session, base_setup):
    company, doc_type, user, uid = base_setup
    
    # Criar Regra primeiro (FK obrigatória)
    rule = EmissionRule(document_type_id=doc_type.id, state="RJ")
    db_session.add(rule)
    db_session.commit()

    request = EmissionRequest(
        company_id=company.id,
        emission_rule_id=rule.id,
        requested_by_id=user.id,
        status="pending"
    )
    db_session.add(request)
    db_session.commit()
    
    assert request.id is not None
    assert request.status == "pending"
    assert request.company_id == company.id

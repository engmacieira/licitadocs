import pytest
from sqlalchemy.orm import Session
from app.repositories.emission_request_repository import EmissionRequestRepository
from app.schemas.emission_request_schemas import EmissionRequestCreate, EmissionRequestUpdate
from app.models.emission_request_model import EmissionRequest

def test_emission_request_happy_path(db_session: Session, test_emission_rule, test_company, test_user):
    """Valida a criação e leitura de uma solicitação de emissão."""
    payload = EmissionRequestCreate(company_id=test_company.id)
    request = EmissionRequestRepository.create(
        db_session, test_emission_rule.id, test_user.id, payload
    )
    
    assert request["id"] is not None
    assert request["companyId"] == test_company.id
    assert request["status"] == "pending"
    
    # Busca por regra e empresa
    history = EmissionRequestRepository.get_by_rule_and_company(
        db_session, test_emission_rule.id, test_company.id
    )
    assert len(history) >= 1
    assert history[0]["id"] == request["id"]

def test_emission_request_update(db_session: Session, test_emission_rule, test_company, test_user):
    """Valida a atualização de status de uma solicitação."""
    payload = EmissionRequestCreate(company_id=test_company.id)
    request_data = EmissionRequestRepository.create(
        db_session, test_emission_rule.id, test_user.id, payload
    )
    
    update_payload = EmissionRequestUpdate(status="processing")
    updated_request = EmissionRequestRepository.update(
        db_session, request_data["id"], update_payload
    )
    
    assert updated_request.status == "processing"

def test_emission_request_soft_delete(db_session: Session, test_emission_rule, test_company, test_user):
    """Valida o protocolo de Soft Delete para solicitações."""
    payload = EmissionRequestCreate(company_id=test_company.id)
    request_data = EmissionRequestRepository.create(
        db_session, test_emission_rule.id, test_user.id, payload
    )
    request_id = request_data["id"]
    
    # Soft delete
    EmissionRequestRepository.soft_delete(db_session, request_id)
    
    # Verifica se sumiu do histórico
    history = EmissionRequestRepository.get_by_rule_and_company(
        db_session, test_emission_rule.id, test_company.id
    )
    assert not any(r["id"] == request_id for r in history)
    
    # Verifica se sumiu do get_by_id
    assert EmissionRequestRepository.get_by_id(db_session, request_id) is None

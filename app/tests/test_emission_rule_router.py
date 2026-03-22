import pytest
from fastapi import status
from app.models.emission_rule_model import EmissionRule

def test_list_emission_rules(client, auth_headers):
    """Valida listagem de regras de emissão."""
    response = client.get("/emission-rules/", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_create_emission_rule_admin_only(client, auth_headers, test_doc_type):
    """Valida restrição: apenas Admin pode criar regras."""
    payload = {
        "document_type_id": str(test_doc_type.id),
        "state": "RJ",
        "city": "Rio de Janeiro",
        "emission_link": "http://auto.rj.gov.br"
    }
    response = client.post("/emission-rules/", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_get_emission_rule_by_id(client, auth_headers, test_emission_rule):
    """Valida obtenção de regra por ID."""
    response = client.get(f"/emission-rules/{test_emission_rule.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == str(test_emission_rule.id)

def test_delete_emission_rule_soft_delete(client, auth_headers, test_emission_rule, db_session):
    """Valida soft delete de regra de emissão (se aplicável via repo/base)."""
    # 1. Verifica no banco antes
    rule_id = test_emission_rule.id
    
    # 2. Deleta via repositório (Protocolo Soft Delete)
    from app.repositories.emission_rule_repository import EmissionRuleRepository
    EmissionRuleRepository.soft_delete(db_session, rule_id)
    
    # 3. Valida no DB
    db_session.expire_all()
    deleted_rule = db_session.query(EmissionRule).filter_by(id=rule_id).first()
    assert deleted_rule is not None
    assert deleted_rule.deleted_at is not None

    # 4. Valida que o router não a encontra mais
    response = client.get(f"/emission-rules/{rule_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_emission_request_history_and_update(client, auth_headers, test_emission_rule, test_company):
    """Testa o histórico de solicitações e atualização na fila."""
    rule_id = test_emission_rule.id
    
    # 1. Cria uma solicitação (Schema espera apenas company_id)
    payload = {"company_id": str(test_company.id)}
    response = client.post(f"/emission-rules/{rule_id}/requests", headers=auth_headers, json=payload)
    assert response.status_code == 201
    
    # 2. Lista histórico
    response = client.get(f"/emission-rules/{rule_id}/requests?company_id={test_company.id}", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1
    request_id = response.json()[0]["id"]
    
    # 3. Atualiza solicitação (Schema usa estimated_date)
    update_payload = {"status": "completed", "estimated_date": "2026-05-01"}
    response = client.patch(f"/emission-rules/requests/{request_id}", headers=auth_headers, json=update_payload)
    assert response.status_code == 200
    assert "sucesso" in response.json()["message"]

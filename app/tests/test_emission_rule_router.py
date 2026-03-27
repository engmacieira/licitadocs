import pytest
import os
from fastapi import status
from app.main import app
from app.core.database import get_db
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

def test_delete_emission_rule_soft_delete(client, auth_headers, admin_headers, test_emission_rule, db_session):
    """Valida soft delete de regra de emissão."""
    rule_id = test_emission_rule.id
    from app.repositories.emission_rule_repository import EmissionRuleRepository
    
    # 1. Verifica no banco antes
    # 2. Deleta via API
    response = client.delete(f"/emission-rules/{rule_id}", headers=admin_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # 3. Valida no DB
    db_session.expire_all()
    deleted_rule = db_session.query(EmissionRule).filter_by(id=rule_id).first()
    assert deleted_rule is not None
    assert deleted_rule.deleted_at is not None

    # 4. Valida que o router não a encontra mais
    response = client.get(f"/emission-rules/{rule_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_emission_request_security_and_validation(client, auth_headers, admin_headers, test_emission_rule, test_company, db_session):
    """Testa a segurança (IDOR/RBAC) e validação (Enum) das solicitações."""
    rule_id = test_emission_rule.id
    
    # --- 1. IDOR: Cliente tentando criar solicitação para empresa que NÃO é dele ---
    from app.models.company_model import Company
    other_company = Company(razao_social="Outra Empresa", cnpj=f"1234567800010{os.urandom(1).hex()[:1]}")
    db_session.add(other_company)
    db_session.commit()
    
    payload_wrong_company = {"company_id": str(other_company.id)}
    response = client.post(f"/emission-rules/{rule_id}/requests", headers=auth_headers, json=payload_wrong_company)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Acesso negado" in response.json()["detail"]

    # --- 2. IDOR: Cliente tentando listar solicitações de empresa que NÃO é dele ---
    response = client.get(f"/emission-rules/{rule_id}/requests?company_id={other_company.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # --- 3. RBAC: Cliente tentando atualizar (PATCH) uma solicitação (DEVE FALHAR 403) ---
    valid_payload = {"company_id": str(test_company.id)}
    resp_create = client.post(f"/emission-rules/{rule_id}/requests", headers=auth_headers, json=valid_payload)
    assert resp_create.status_code == 201
    request_id = resp_create.json()["id"]
    
    update_payload = {"status": "completed"}
    response = client.patch(f"/emission-rules/requests/{request_id}", headers=auth_headers, json=update_payload)
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # --- 4. ADMIN: Atualizando validamente ---
    response = client.patch(f"/emission-rules/requests/{request_id}", headers=admin_headers, json=update_payload)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "completed"

    # --- 5. VALIDAÇÃO: Status INVÁLIDO (Enum) ---
    invalid_payload = {"status": "invalido_total"}
    response = client.patch(f"/emission-rules/requests/{request_id}", headers=admin_headers, json=invalid_payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

def test_repository_exception_handling(client, admin_headers, db_session):
    """Testa se o router trata corretamente ValueError do repositório."""
    # Tenta atualizar uma regra inexistente (Gera KeyError/ValueError no repo)
    fake_id = "00000000-0000-0000-0000-000000000000"
    update_payload = {"city": "Nova Cidade"}
    response = client.put(f"/emission-rules/{fake_id}", headers=admin_headers, json=update_payload)
    
    # O router deve capturar o erro e devolver 404 (KeyError)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_resolve_emission_link_success(client, auth_headers, test_doc_type, test_company, test_emission_rule, db_session):
    """Valida a resolução mágica de link de emissão."""
    from app.models.document_type_model import DocumentScope
    
    test_company.estado = "SP"
    test_company.cidade = "São Paulo"
    # O test_doc_type da fixture é NATIONAL por padrão. Vamos mudar para MUNICIPAL para testar a busca exata.
    test_doc_type.scope = "MUNICIPAL"
    
    db_session.add(test_company)
    db_session.add(test_doc_type)
    db_session.commit()

    url = f"/emission-rules/resolve?document_type_id={test_doc_type.id}&company_id={test_company.id}"
    response = client.get(url, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == str(test_emission_rule.id)

def test_create_emission_rule_error_handling(client, admin_headers, test_doc_type):
    """Valida tratamento de erro (ValueError/IntegrityError) no cadastro."""
    from unittest.mock import patch
    with patch("app.repositories.emission_rule_repository.EmissionRuleRepository.create", side_effect=ValueError("Erro customizado")):
        payload = {
            "document_type_id": str(test_doc_type.id),
            "state": "SP",
            "city": "São Paulo",
            "emission_link": "http://example.com"
        }
        response = client.post("/emission-rules/", json=payload, headers=admin_headers)
        assert response.status_code == 400
        assert "Erro customizado" in response.json()["detail"]

def test_update_emission_rule_value_error(client, admin_headers, test_emission_rule):
    """Valida tratamento de ValueError no update."""
    from unittest.mock import patch
    with patch("app.repositories.emission_rule_repository.EmissionRuleRepository.update", side_effect=ValueError("Valor inválido")):
        payload = {"emission_link": "http://new.com"}
        response = client.put(f"/emission-rules/{test_emission_rule.id}", json=payload, headers=admin_headers)
        assert response.status_code == 400
        assert "Valor inválido" in response.json()["detail"]

def test_delete_emission_rule_errors(client, admin_headers):
    """Valida tratamento de erros no delete (KeyError e ValueError)."""
    from unittest.mock import patch
    rule_id = "00000000-0000-0000-0000-000000000000"
    
    # Caso 1: KeyError (404)
    with patch("app.repositories.emission_rule_repository.EmissionRuleRepository.delete", side_effect=KeyError("Não encontrado")):
        response = client.delete(f"/emission-rules/{rule_id}", headers=admin_headers)
        assert response.status_code == 404

    # Caso 2: ValueError (400)
    with patch("app.repositories.emission_rule_repository.EmissionRuleRepository.delete", side_effect=ValueError("Erro de negócio")):
        response = client.delete(f"/emission-rules/{rule_id}", headers=admin_headers)
        assert response.status_code == 400

def test_list_emission_requests_success(client, auth_headers, test_emission_rule, test_company):
    """Valida listagem de solicitações com sucesso."""
    url = f"/emission-rules/{test_emission_rule.id}/requests?company_id={test_company.id}"
    response = client.get(url, headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_update_emission_request_not_found(client, admin_headers):
    """Valida 404 ao atualizar solicitação inexistente."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    payload = {"status": "completed"}
    response = client.patch(f"/emission-rules/requests/{fake_id}", json=payload, headers=admin_headers)
    assert response.status_code == 404

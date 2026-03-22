import pytest
from sqlalchemy.orm import Session
from app.repositories.emission_rule_repository import EmissionRuleRepository
from app.schemas.emission_rule_schemas import EmissionRuleCreate, EmissionRuleUpdate
from app.models.emission_rule_model import EmissionRule
from app.models.document_type_model import DocumentType

def test_emission_rule_happy_path(db_session: Session, test_doc_type):
    """Valida a criação de uma regra de emissão."""
    rule_in = EmissionRuleCreate(
        document_type_id=test_doc_type.id,
        state="RJ",
        city="Rio de Janeiro",
        emission_link="http://rj.gov.br",
        operation_notes="Notas de teste"
    )
    rule = EmissionRuleRepository.create(db_session, rule_in)
    
    assert rule.id is not None
    assert rule.state == "RJ"
    assert rule.city == "Rio de Janeiro"
    assert rule.document_type_id == test_doc_type.id

def test_emission_rule_resolution_national(db_session: Session, test_company, test_doc_type):
    """Valida a resolução de regra de emissão para escopo Nacional."""
    # Redefine o tipo para Nacional
    test_doc_type.scope = "NATIONAL"
    db_session.commit()
    
    # Cria regra nacional (sem estado e cidade)
    rule_in = EmissionRuleCreate(
        document_type_id=test_doc_type.id,
        state=None,
        city=None
    )
    rule = EmissionRuleRepository.create(db_session, rule_in)
    
    # Resolve
    resolved = EmissionRuleRepository.resolve_rule_for_company(
        db_session, test_doc_type.id, test_company.id
    )
    assert resolved.id == rule.id

def test_emission_rule_resolution_state(db_session: Session, test_company, test_doc_type):
    """Valida a resolução de regra de emissão para escopo Estadual."""
    # Empresa em SP
    test_company.estado = "SP"
    db_session.commit()
    
    # Tipo Estadual
    from app.models.document_type_model import DocumentScope
    test_doc_type.scope = DocumentScope.STATE.value
    db_session.commit()
    
    # Cria regra estadual SP
    rule_in = EmissionRuleCreate(
        document_type_id=test_doc_type.id,
        state="SP",
        city=None
    )
    rule = EmissionRuleRepository.create(db_session, rule_in)
    
    # Resolve
    resolved = EmissionRuleRepository.resolve_rule_for_company(
        db_session, test_doc_type.id, test_company.id
    )
    assert resolved.id == rule.id

def test_emission_rule_soft_delete(db_session: Session, test_emission_rule: EmissionRule):
    """Valida o protocolo de Soft Delete para regras de emissão."""
    rule_id = test_emission_rule.id
    
    # Soft delete
    EmissionRuleRepository.delete(db_session, rule_id)
    
    # Verifica
    assert EmissionRuleRepository.get_by_id(db_session, rule_id) is None
    
    deleted_rule = db_session.query(EmissionRule).filter(EmissionRule.id == rule_id).first()
    assert deleted_rule.deleted_at is not None

def test_emission_rule_update(db_session: Session, test_emission_rule: EmissionRule):
    """Valida a atualização de uma regra de emissão."""
    rule_id = test_emission_rule.id
    update_in = EmissionRuleUpdate(
        state="MG",
        city="Belo Horizonte",
        operation_notes="Notas atualizadas"
    )
    updated = EmissionRuleRepository.update(db_session, rule_id, update_in)
    
    assert updated.state == "MG"
    assert updated.city == "Belo Horizonte"
    assert updated.operation_notes == "Notas atualizadas"

def test_emission_rule_resolution_municipal(db_session: Session, test_company, test_doc_type):
    """Valida a resolução de regra de emissão para escopo Municipal."""
    # Empresa em Curitiba, PR
    test_company.estado = "PR"
    test_company.cidade = "Curitiba"
    db_session.commit()
    
    # Tipo Municipal
    from app.models.document_type_model import DocumentScope
    test_doc_type.scope = DocumentScope.MUNICIPAL.value
    db_session.commit()
    
    # Cria regra municipal Curitiba
    rule_in = EmissionRuleCreate(
        document_type_id=test_doc_type.id,
        state="PR",
        city="Curitiba"
    )
    rule = EmissionRuleRepository.create(db_session, rule_in)
    
    # Resolve
    resolved = EmissionRuleRepository.resolve_rule_for_company(
        db_session, test_doc_type.id, test_company.id
    )
    assert resolved.id == rule.id

def test_emission_rule_errors(db_session: Session):
    """Testa casos de erro (Não encontrado) no repositório."""
    from fastapi import HTTPException
    
    # Update não encontrado
    with pytest.raises(HTTPException) as exc:
        EmissionRuleRepository.update(db_session, "non_existent", EmissionRuleUpdate())
    assert exc.value.status_code == 404
    
    # Delete não encontrado
    with pytest.raises(HTTPException) as exc:
        EmissionRuleRepository.delete(db_session, "non_existent")
    assert exc.value.status_code == 404

def test_emission_rule_database_errors(db_session: Session, monkeypatch):
    """Testa tratamento de DatabaseError em métodos do repositório via mock."""
    from sqlalchemy.exc import DatabaseError
    from fastapi import HTTPException
    
    def mock_error(*args, **kwargs):
        raise DatabaseError("statement", "params", "orig")

    # Mock dynamic query ou methods se possível
    # Como os métodos usam cls.get_active_query, vamos mockar o comportamento do query
    from sqlalchemy.orm import Query
    monkeypatch.setattr(Query, "all", mock_error)
    monkeypatch.setattr(Query, "first", mock_error)
    
    with pytest.raises(HTTPException) as exc:
        EmissionRuleRepository.get_all(db_session)
    assert exc.value.status_code == 500

    with pytest.raises(HTTPException) as exc:
        EmissionRuleRepository.get_by_id(db_session, "any")
    assert exc.value.status_code == 500

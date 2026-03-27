import pytest
from datetime import date
from unittest.mock import MagicMock, patch
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.repositories.ai_quota_repository import AIQuotaRepository
from app.models.ai_usage_model import AIUsage

def test_get_daily_usage_not_found(db_session, test_company):
    usage = AIQuotaRepository.get_daily_usage(db_session, test_company.id, date.today())
    assert usage == 0

def test_get_daily_usage_success(db_session, test_company):
    today = date.today()
    record = AIUsage(company_id=test_company.id, usage_date=today, tokens_consumed=500)
    db_session.add(record)
    db_session.commit()
    
    usage = AIQuotaRepository.get_daily_usage(db_session, test_company.id, today)
    assert usage == 500

def test_get_daily_usage_exception(db_session):
    mock_db = MagicMock()
    mock_db.query.side_effect = Exception("DB Error")
    
    usage = AIQuotaRepository.get_daily_usage(mock_db, "any_id", date.today())
    assert usage == 0

def test_add_usage_new_record(db_session, test_company):
    today = date.today()
    AIQuotaRepository.add_usage(db_session, test_company.id, 1000, today)
    
    record = db_session.query(AIUsage).filter_by(company_id=test_company.id, usage_date=today).first()
    assert record is not None
    assert record.tokens_consumed == 1000

def test_add_usage_update_existing(db_session, test_company):
    today = date.today()
    record = AIUsage(company_id=test_company.id, usage_date=today, tokens_consumed=500)
    db_session.add(record)
    db_session.commit()
    
    AIQuotaRepository.add_usage(db_session, test_company.id, 1000, today)
    
    db_session.refresh(record)
    assert record.tokens_consumed == 1500

def test_add_usage_integrity_error_fallback(db_session):
    today = date.today()
    company_id = "comp_race"
    
    # Simular cenário onde:
    # 1. Update retorna rowcount=0 (não existe)
    # 2. Insert (db.add) falha com IntegrityError (alguém inseriu entre os passos)
    # 3. Fallback executa o Update novamente e commit
    
    mock_db = MagicMock()
    mock_result = MagicMock()
    mock_result.rowcount = 0
    
    # Primeira chamada do execute (Update): retorna 0
    # Segunda chamada do execute (Update no fallback): sucesso
    mock_db.execute.side_effect = [mock_result, MagicMock()]
    
    # db.commit() falha na primeira vez (IntegrityError no Insert)
    mock_db.commit.side_effect = [Exception("IntegrityError pseudo"), None] 
    # Usei Exception geral pq o código dá catch em Exception no retry do Insert
    
    AIQuotaRepository.add_usage(mock_db, company_id, 500, today)
    
    assert mock_db.execute.call_count == 2
    assert mock_db.rollback.call_count == 1
    assert mock_db.commit.call_count == 2

def test_add_usage_critical_error(db_session):
    mock_db = MagicMock()
    mock_db.execute.side_effect = Exception("Critical Error")
    
    with pytest.raises(Exception) as excinfo:
        AIQuotaRepository.add_usage(mock_db, "comp_1", 500, date.today())
    
    assert "Critical Error" in str(excinfo.value)
    assert mock_db.rollback.call_count == 1

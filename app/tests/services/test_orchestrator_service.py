import pytest
import uuid
from datetime import datetime, date
from unittest.mock import MagicMock, patch, mock_open
from app.services.orchestrator_service import OrchestratorService
from app.models.document_automation_model import DocumentAutomationConfig
from app.models.company_model import Company
from app.models.certificate_model import Certificate
from app.models.document_type_model import DocumentType

@pytest.fixture
def mock_db():
    return MagicMock()

@patch("app.services.orchestrator_service.SessionLocal")
@patch("app.services.orchestrator_service.CrawlerFactory.get_crawler")
@patch("app.services.orchestrator_service.DocumentRepository.create_certificate")
def test_run_daily_scan_happy_path(mock_create_cert, mock_get_crawler, mock_session_local, mock_db):
    # Setup
    mock_session_local.return_value = mock_db
    
    # 1. Active Config
    mock_config = MagicMock(spec=DocumentAutomationConfig)
    mock_config.strategy_name = "TEST_STRA"
    mock_config.document_type.name = "Test Doc"
    mock_config.document_type_id = "type-123"
    mock_db.query.return_value.filter.return_value.all.side_effect = [
        [mock_config], # active_configs
        [MagicMock(spec=Company, id="comp-1", cnpj="123", razao_social="C1")] # companies
    ]
    
    # 2. No last doc (force trigger)
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
    
    # 3. Crawler Result
    mock_crawler = MagicMock()
    mock_crawler.fetch.return_value = {
        "success": True,
        "file_metadata": {"filename": "test.pdf", "expiration_date": date(2025, 1, 1)},
        "file_content": b"content"
    }
    mock_get_crawler.return_value = mock_crawler
    
    # 4. Mock file write
    m_open = mock_open()
    with patch("app.services.orchestrator_service.open", m_open):
        OrchestratorService.run_daily_scan()
    
    # Verifications
    mock_get_crawler.assert_called_once()
    mock_create_cert.assert_called_once()
    assert m_open.called

@patch("app.services.orchestrator_service.SessionLocal")
def test_run_daily_scan_no_configs(mock_session_local, mock_db):
    mock_session_local.return_value = mock_db
    mock_db.query.return_value.filter.return_value.all.return_value = []
    
    OrchestratorService.run_daily_scan()
    
    # Should exit early
    assert mock_db.query.call_count == 1

@patch("app.services.orchestrator_service.SessionLocal")
@patch("app.services.orchestrator_service.CrawlerFactory.get_crawler")
def test_run_daily_scan_crawler_error(mock_get_crawler, mock_session_local, mock_db):
    mock_session_local.return_value = mock_db
    
    mock_config = MagicMock(spec=DocumentAutomationConfig)
    mock_config.strategy_name = "TEST_STRA"
    mock_config.document_type.name = "Test Doc"
    
    mock_db.query.return_value.filter.return_value.all.side_effect = [
        [mock_config],
        [MagicMock(spec=Company, id="comp-1", cnpj="123")]
    ]
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
    
    # Crawler fails
    mock_crawler = MagicMock()
    mock_crawler.fetch.side_effect = Exception("Crawler crashed")
    mock_get_crawler.return_value = mock_crawler
    
    # Should not crash the main loop
    OrchestratorService.run_daily_scan()
    
    assert mock_get_crawler.called

@patch("app.services.orchestrator_service.SessionLocal")
def test_run_daily_scan_doc_not_expiring(mock_session_local, mock_db):
    mock_session_local.return_value = mock_db
    
    mock_config = MagicMock(spec=DocumentAutomationConfig)
    mock_config.strategy_name = "TEST_STRA"
    mock_db.query.return_value.filter.return_value.all.side_effect = [
        [mock_config],
        [MagicMock(spec=Company, id="comp-1", cnpj="123")]
    ]
    
    # Last doc expires in 10 days (threshold is 5)
    mock_last_doc = MagicMock(spec=Certificate)
    mock_last_doc.expiration_date = date.today().replace(day=date.today().day + 10) if date.today().day < 20 else date.today() # dirty fix for end of month
    # Actually just mock the timedelta logic
    from datetime import timedelta
    mock_last_doc.expiration_date = date.today() + timedelta(days=10)
    
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = mock_last_doc
    
    with patch("app.services.orchestrator_service.CrawlerFactory.get_crawler") as mock_get:
        OrchestratorService.run_daily_scan()
        mock_get.assert_not_called()

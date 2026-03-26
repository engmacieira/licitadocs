import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock, patch
from sqlalchemy.orm import Session
from app.services.ai_service import AIService
from app.models.user_model import User, UserCompanyLink
from app.repositories.document_repository import DocumentRepository

@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    link = MagicMock(spec=UserCompanyLink)
    link.company_id = "test-company-id"
    user.company_links = [link]
    return user

@pytest.fixture
def mock_quota():
    with patch("app.services.ai_service.AIQuotaRepository.get_daily_usage", return_value=0) as m1, \
         patch("app.services.ai_service.AIQuotaRepository.add_usage", return_value=None) as m2:
        yield m1, m2

@patch("app.services.ai_service.AIClient")
@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
def test_generate_concierge_response_happy_path(mock_get_docs, mock_ai_client_class, db_session: Session, mock_user, mock_quota):
    # Setup
    mock_get_docs.return_value = [
        {"title": "Certidão Negativa", "category_name": "Fiscal", "status": "valid", "expiration_date": None}
    ]
    
    mock_ai_instance = mock_ai_client_class.return_value
    mock_ai_instance.generate_chat_response.return_value = ("Olá! Sua Certidão Negativa está válida.", 100)
    
    # Execute
    response = AIService.generate_concierge_response(db_session, mock_user, "test-company-id", "Como estão meus documentos?")
    
    # Verify
    assert "Olá!" in response
    mock_get_docs.assert_called_once_with(db_session, "test-company-id")
    mock_ai_instance.generate_chat_response.assert_called_once()
    
    # Check if context contains doc info
    args, kwargs = mock_ai_instance.generate_chat_response.call_args
    assert "Certidão Negativa" in kwargs["context"]
    assert "✅ Válido (Regular)" in kwargs["context"]

@patch("app.services.ai_service.AIQuotaRepository.get_daily_usage", return_value=0)
def test_generate_concierge_response_no_company(mock_quota_get, db_session: Session):
    # Setup user with no companies
    user = MagicMock(spec=User)
    user.company_links = []
    
    # Execute
    response = AIService.generate_concierge_response(db_session, user, None, "Oi")
    
    # Verify
    assert "Não consegui identificar a sua empresa" in response

@patch("app.services.ai_service.AIClient")
@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
def test_generate_concierge_response_db_error(mock_get_docs, mock_ai_client_class, db_session: Session, mock_user, mock_quota):
    from fastapi import HTTPException
    import pytest

    # Setup DB error: Simulamos a falha do banco [cite: 20]
    mock_get_docs.side_effect = Exception("DB connection failed")
    
    mock_ai_instance = mock_ai_client_class.return_value
    mock_ai_instance.generate_chat_response.return_value = ("Resposta com erro de contexto.", 50)
    
    # Execute e valide: Avisamos ao pytest que ESPERAMOS uma explosão aqui!
    with pytest.raises(HTTPException) as exc_info:
        AIService.generate_concierge_response(db_session, mock_user, "test-company-id", "Oi")
        
    # Asserts do QA Sênior: Garantindo que a rede de segurança funcionou perfeitamente
    assert exc_info.value.status_code == 500
    assert "Erro técnico ao acessar o cofre de documentos" in exc_info.value.detail
    
@patch("app.services.ai_service.AIClient")
@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
def test_generate_concierge_response_ai_error(mock_get_docs, mock_ai_client_class, db_session: Session, mock_user, mock_quota):
    # Setup
    mock_get_docs.return_value = []
    
    mock_ai_instance = mock_ai_client_class.return_value
    mock_ai_instance.generate_chat_response.side_effect = Exception("LLM Timeout")
    
    # Execute
    response = AIService.generate_concierge_response(db_session, mock_user, "test-company-id", "Oi")
    
    # Verify
    assert "está instável" in response

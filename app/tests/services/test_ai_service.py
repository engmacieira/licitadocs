import pytest
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

@patch("app.services.ai_service.AIClient")
@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
def test_generate_concierge_response_happy_path(mock_get_docs, mock_ai_client_class, db_session: Session, mock_user):
    # Setup
    mock_get_docs.return_value = [
        {"title": "Certidão Negativa", "category_name": "Fiscal", "status": "valid", "expiration_date": None}
    ]
    
    mock_ai_instance = mock_ai_client_class.return_value
    mock_ai_instance.generate_chat_response.return_value = "Olá! Sua Certidão Negativa está válida."
    
    # Execute
    response = AIService.generate_concierge_response(db_session, mock_user, "Como estão meus documentos?")
    
    # Verify
    assert "Olá!" in response
    mock_get_docs.assert_called_once_with(db_session, "test-company-id")
    mock_ai_instance.generate_chat_response.assert_called_once()
    
    # Check if context contains doc info
    args, kwargs = mock_ai_instance.generate_chat_response.call_args
    assert "Certidão Negativa" in kwargs["context"]
    assert "✅ Válido (Regular)" in kwargs["context"]

def test_generate_concierge_response_no_company(db_session: Session):
    # Setup user with no companies
    user = MagicMock(spec=User)
    user.company_links = []
    
    # Execute
    response = AIService.generate_concierge_response(db_session, user, "Oi")
    
    # Verify
    assert "Não consegui identificar a sua empresa" in response

@patch("app.services.ai_service.AIClient")
@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
def test_generate_concierge_response_db_error(mock_get_docs, mock_ai_client_class, db_session: Session, mock_user):
    # Setup DB error
    mock_get_docs.side_effect = Exception("DB connection failed")
    
    mock_ai_instance = mock_ai_client_class.return_value
    mock_ai_instance.generate_chat_response.return_value = "Resposta com erro de contexto."
    
    # Execute
    response = AIService.generate_concierge_response(db_session, mock_user, "Oi")
    
    # Verify
    assert "Resposta com erro de contexto." in response
    # Check if error message was passed in context
    args, kwargs = mock_ai_instance.generate_chat_response.call_args
    assert "Erro técnico ao acessar o cofre." in kwargs["context"]

@patch("app.services.ai_service.AIClient")
@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
def test_generate_concierge_response_ai_error(mock_get_docs, mock_ai_client_class, db_session: Session, mock_user):
    # Setup
    mock_get_docs.return_value = []
    
    mock_ai_instance = mock_ai_client_class.return_value
    mock_ai_instance.generate_chat_response.side_effect = Exception("LLM Timeout")
    
    # Execute
    response = AIService.generate_concierge_response(db_session, mock_user, "Oi")
    
    # Verify
    assert "está instável" in response

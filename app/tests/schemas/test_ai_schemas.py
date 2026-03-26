import pytest
from app.schemas.ai_schemas import ChatRequest, ChatResponse

# --- Caminho Feliz ---

def test_chat_request_validation():
    """Valida contrato de entrada para a IA."""
    message = "O que é uma CND?"
    company_id = "test-company-123"
    req = ChatRequest(message=message, company_id=company_id)
    assert req.message == message
    assert req.company_id == company_id

def test_chat_response_validation():
    """Valida contrato de saída da IA."""
    response = "A **Certidão Negativa de Débitos** é..."
    res = ChatResponse(response=response)
    assert res.response == response

# --- Casos de Borda ---

def test_chat_request_empty():
    """Pydantic valida se a string é obrigatória (...)."""
    # Em ChatRequest, 'message: str = Field(...)' torna obrigatório
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        ChatRequest(message=None, company_id="test-company-123")

# --- Tratamento de Erros ---

def test_chat_request_missing_field(schema_tester):
    """Verifica erro ao omitir a mensagem."""
    # O Pydantic deve reclamar de 'message' estar faltando
    schema_tester.assert_validation_error(ChatRequest, {"company_id": "123"}, "message")

def test_chat_request_missing_company_id(schema_tester):
    """Verifica erro ao omitir o ID da empresa."""
    schema_tester.assert_validation_error(ChatRequest, {"message": "Dúvida"}, "company_id")

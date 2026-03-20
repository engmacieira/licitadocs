import pytest
from app.schemas.ai_schemas import ChatRequest, ChatResponse

# --- Caminho Feliz ---

def test_chat_request_validation():
    """Valida contrato de entrada para a IA."""
    message = "O que é uma CND?"
    req = ChatRequest(message=message)
    assert req.message == message

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
        ChatRequest(message=None)

# --- Tratamento de Erros ---

def test_chat_request_missing_field(schema_tester):
    """Verifica erro ao omitir a mensagem."""
    schema_tester.assert_validation_error(ChatRequest, {}, "message")

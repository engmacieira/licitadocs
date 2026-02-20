"""
Testes Unitários: Serviço de IA (AIService).
Foco em garantir que o contexto (RAG) é montado corretamente
e que falhas na API do Gemini são tratadas graciosamente.
"""
from unittest.mock import patch, MagicMock

from app.services.ai_service import AIService

# ==========================================
# 🤖 TESTES DE LÓGICA DO CONCIERGE (RAG)
# ==========================================

def test_generate_response_no_company():
    """
    Cenário QA [Edge Case]: Usuário sem vínculos de empresa tenta usar a IA.
    Resultado Esperado: Mensagem amigável de erro sem tentar bater no banco.
    """
    # 1. Setup: Um "dublê" de usuário com a lista de links vazia
    mock_user = MagicMock()
    mock_user.company_links = []
    mock_db = MagicMock()
    
    # 2. Ação
    response = AIService.generate_concierge_response(mock_db, mock_user, "Olá!")
    
    # 3. Validação
    assert "Não consegui identificar sua empresa" in response

@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
@patch("app.services.ai_service.AIClient.generate_chat_response")
def test_generate_response_with_documents(mock_ai_client, mock_get_docs):
    """
    Cenário: Usuário válido faz pergunta e possui documentos no Cofre.
    Resultado Esperado: O prompt é montado com os docs e enviado à IA.
    """
    # 1. Setup do Usuário
    mock_link = MagicMock()
    mock_link.company_id = "empresa_123"
    mock_user = MagicMock()
    mock_user.company_links = [mock_link]
    mock_db = MagicMock()

    # 2. Setup dos Documentos (Simulando o retorno do Banco)
    mock_doc1 = MagicMock()
    mock_doc1.filename = "contrato.pdf"
    mock_doc1.status = "valid"
    mock_get_docs.return_value = [mock_doc1]

    # 3. Setup do Google Gemini (Simulando a resposta da IA)
    mock_ai_client.return_value = "O contrato.pdf está válido!"

    # 4. Ação
    response = AIService.generate_concierge_response(mock_db, mock_user, "Como estão meus docs?")

    # 5. Validação
    assert response == "O contrato.pdf está válido!"
    
    # QA Bônus: Garante que o nome do documento entrou no prompt 'system_instruction' que foi pra IA!
    mock_ai_client.assert_called_once()
    args, kwargs = mock_ai_client.call_args
    prompt_enviado = kwargs.get("system_instruction")
    assert "contrato.pdf (Status: valid)" in prompt_enviado

@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
@patch("app.services.ai_service.AIClient.generate_chat_response")
def test_generate_response_no_documents(mock_ai_client, mock_get_docs):
    """
    Cenário: Usuário válido, mas o Cofre está vazio.
    Resultado Esperado: O prompt avisa a IA que não há documentos (Fallback de String).
    """
    # Setup
    mock_link = MagicMock()
    mock_link.company_id = "empresa_123"
    mock_user = MagicMock()
    mock_user.company_links = [mock_link]
    mock_db = MagicMock()

    # Cofre Vazio!
    mock_get_docs.return_value = []
    mock_ai_client.return_value = "Faça upload dos seus docs primeiro."

    # Ação
    response = AIService.generate_concierge_response(mock_db, mock_user, "Quais meus docs?")

    # Validação
    mock_ai_client.assert_called_once()
    args, kwargs = mock_ai_client.call_args
    prompt_enviado = kwargs.get("system_instruction")
    assert "Nenhum documento encontrado no sistema para esta empresa." in prompt_enviado

@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
@patch("app.services.ai_service.AIClient.generate_chat_response")
def test_generate_response_ai_failure(mock_ai_client, mock_get_docs):
    """
    Cenário QA [Resiliência]: A API do Gemini cai ou dá Timeout.
    Resultado Esperado: O bloco 'except' captura o erro e devolve uma mensagem limpa ao invés de um Erro 500.
    """
    # Setup
    mock_link = MagicMock()
    mock_link.company_id = "empresa_123"
    mock_user = MagicMock()
    mock_user.company_links = [mock_link]
    mock_db = MagicMock()
    mock_get_docs.return_value = []

    # A Magia de QA: Forçamos a função mockada a "Explodir" simulando um erro da internet
    mock_ai_client.side_effect = Exception("Google API Timeout 504")

    # Ação
    response = AIService.generate_concierge_response(mock_db, mock_user, "Tem alguém aí?")

    # Validação: A nossa aplicação sobreviveu ao erro!
    assert "meu cérebro digital está um pouco lento agora" in response
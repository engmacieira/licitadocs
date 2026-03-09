"""
Testes Unitários: Serviço de IA (AIService).
Foco em garantir que o contexto (RAG) é montado corretamente,
que as regras de blindagem (Prompt Shielding) são aplicadas
e que falhas na API do Gemini ou no Banco são tratadas graciosamente.
"""
import os
import pytest
from unittest.mock import patch, MagicMock

from app.services.ai_service import AIService
from app.core.ai_client import AIClient

# ==========================================
# 🤖 TESTES DE LÓGICA DO ASSISTENTE (RAG)
# ==========================================

def test_generate_response_no_company():
    """Cenário QA [Edge Case]: Utilizador sem vínculos de empresa tenta usar a IA."""
    mock_user = MagicMock()
    mock_user.company_links = []
    mock_db = MagicMock()
    
    response = AIService.generate_concierge_response(mock_db, mock_user, "Olá!")
    
    assert "Não consegui identificar sua empresa" in response

@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
@patch("app.services.ai_service.AIClient.generate_chat_response")
def test_generate_response_with_documents_and_shielding(mock_ai_client, mock_get_docs):
    """Cenário: Utilizador válido faz pergunta e possui documentos no Cofre."""
    mock_link = MagicMock()
    mock_link.company_id = "empresa_123"
    mock_user = MagicMock()
    mock_user.company_links = [mock_link]
    mock_db = MagicMock()

    mock_doc1 = MagicMock()
    mock_doc1.filename = "contrato.pdf"
    mock_doc1.status = "valid"
    mock_get_docs.return_value = [mock_doc1]

    mock_ai_client.return_value = "O contrato.pdf está válido!"

    response = AIService.generate_concierge_response(mock_db, mock_user, "Como estão meus docs?")

    assert response == "O contrato.pdf está válido!"
    
    mock_ai_client.assert_called_once()
    args, kwargs = mock_ai_client.call_args
    # Atualizado para ler o parâmetro 'context' do ai_client.py
    prompt_enviado = kwargs.get("context") 
    
    assert "contrato.pdf (Status: valid)" in prompt_enviado 
    assert "REGRAS DE BLINDAGEM" in prompt_enviado          
    assert "NÃO analise editais" in prompt_enviado          

@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
@patch("app.services.ai_service.AIClient.generate_chat_response")
def test_generate_response_no_documents(mock_ai_client, mock_get_docs):
    """Cenário: Utilizador válido, mas o Cofre está vazio."""
    mock_link = MagicMock()
    mock_link.company_id = "empresa_123"
    mock_user = MagicMock()
    mock_user.company_links = [mock_link]
    mock_db = MagicMock()

    mock_get_docs.return_value = []
    mock_ai_client.return_value = "Faça upload dos seus docs primeiro."

    response = AIService.generate_concierge_response(mock_db, mock_user, "Quais meus docs?")

    mock_ai_client.assert_called_once()
    args, kwargs = mock_ai_client.call_args
    prompt_enviado = kwargs.get("context") # Atualizado
    
    assert "Nenhum documento encontrado no Cofre para esta empresa no momento." in prompt_enviado

@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
@patch("app.services.ai_service.AIClient.generate_chat_response")
def test_generate_response_ai_failure(mock_ai_client, mock_get_docs):
    """Cenário QA [Resiliência]: A API do Gemini/OpenAI cai ou dá Timeout."""
    mock_link = MagicMock()
    mock_link.company_id = "empresa_123"
    mock_user = MagicMock()
    mock_user.company_links = [mock_link]
    mock_db = MagicMock()
    mock_get_docs.return_value = []

    mock_ai_client.side_effect = Exception("Google API Timeout 504")

    response = AIService.generate_concierge_response(mock_db, mock_user, "Tem alguém aí?")

    assert "o meu servidor de IA está com instabilidade no momento" in response

@patch("app.services.ai_service.DocumentRepository.get_unified_by_company")
@patch("app.services.ai_service.AIClient.generate_chat_response")
def test_generate_response_db_failure(mock_ai_client, mock_get_docs):
    """Cenário QA [Resiliência Banco]: O banco de dados falha ao buscar documentos."""
    mock_link = MagicMock()
    mock_link.company_id = "empresa_123"
    mock_user = MagicMock()
    mock_user.company_links = [mock_link]
    mock_db = MagicMock()
    
    mock_get_docs.side_effect = Exception("Database Connection Lost")
    mock_ai_client.return_value = "Respondo mesmo sem banco."

    response = AIService.generate_concierge_response(mock_db, mock_user, "Meus docs?")

    mock_ai_client.assert_called_once()
    args, kwargs = mock_ai_client.call_args
    prompt_enviado = kwargs.get("context") # Atualizado
    
    assert "Nenhum documento encontrado no Cofre para esta empresa no momento." in prompt_enviado

# ==========================================
# 🌐 TESTE DE INTEGRAÇÃO REAL (CONEXÃO API)
# ==========================================

@pytest.mark.skipif(
    not os.getenv("GOOGLE_API_KEY"), 
    reason="Chave de API não configurada no ambiente. Pulando teste de integração real."
)
def test_real_ai_connection_success():
    """
    Cenário de Integração (Smoke Test): Testa a comunicação real com a API do Google Gemini.
    Garante que a chave de API (GOOGLE_API_KEY) é válida e a rede permite tráfego de saída.
    """
    prompt_sistema = "Você é um bot de diagnóstico de rede. Responda EXATAMENTE E APENAS com a palavra 'CONECTADO'."
    mensagem_usuario = "Teste de Ping. Responda agora."

    try:
            # Correção: Criamos a instância da classe primeiro
            ai_instance = AIClient()
            resposta = ai_instance.generate_chat_response(
                message=mensagem_usuario,
                context=prompt_sistema
            )
    
            assert resposta is not None
            assert len(resposta) > 0
            assert "CONECTADO" in resposta.upper()
    
            print(f"\n[SUCESSO] API respondeu: {resposta}")
        
    except Exception as e:
        pytest.fail(f"A conexão real com a IA falhou. Detalhes do erro: {e}")
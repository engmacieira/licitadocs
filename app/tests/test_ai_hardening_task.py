import pytest
from fastapi import status
from unittest.mock import patch
from datetime import date
from app.models.ai_usage_model import AIUsage
from app.repositories.ai_quota_repository import AIQuotaRepository
from app.models.company_model import Company

def test_multi_tenant_access_control(client, test_user, auth_headers, test_company, db_session):
    """
    Missão 2: Valida se um usuário só acessa empresas às quais está vinculado.
    """
    # 1. Caso de Sucesso: Empresa A (vinculada via fixture test_company)
    payload = {
        "message": "Quais documentos eu tenho?",
        "company_id": test_company.id
    }
    
    with patch("app.services.ai_service.AIService.generate_concierge_response") as mock_service:
        mock_service.return_value = "Resposta da IA"
        response = client.post("/ai/chat", json=payload, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK

    # 2. Caso de Falha: Empresa B (NÃO vinculada)
    # Criamos outra empresa que NÃO está vinculada ao test_user
    company_b = Company(id=f"other_{date.today().isoformat()}", razao_social="Outra Empresa", cnpj="12345678000199")
    db_session.add(company_b)
    db_session.commit()
    
    payload_forbidden = {
        "message": "Quais documentos?",
        "company_id": company_b.id
    }
    
    response_forbidden = client.post("/ai/chat", json=payload_forbidden, headers=auth_headers)
    assert response_forbidden.status_code == status.HTTP_403_FORBIDDEN
    assert "permissão" in response_forbidden.json()["detail"].lower()

def test_rag_error_aborts_llm_call(client, test_company, auth_headers):
    """
    Missão 3: Valida se a falha no banco de dados aborta o fluxo antes da LLM.
    """
    payload = {
        "message": "Teste erro RAG",
        "company_id": test_company.id
    }
    
    # Mock do Repository para lançar exceção
    # Mock do AIClient para verificar se NUNCA é chamado
    with patch("app.repositories.document_repository.DocumentRepository.get_unified_by_company", side_effect=Exception("DB CONNECTION ERROR")), \
         patch("app.core.ai_client.AIClient.generate_chat_response") as mock_ai_client:
        
        response = client.post("/ai/chat", json=payload, headers=auth_headers)
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        # O PONTO CRÍTICO: AIClient NÃO deve ter sido chamado (evita desperdício financeiro)
        mock_ai_client.assert_not_called()

def test_atomic_quota_update_math(db_session, test_company):
    """
    Missão 1: Valida o Update Atômico e a soma matemática correta.
    Simula o comportamento do banco de dados com múltiplas adições.
    """
    company_id = test_company.id
    hoje = date.today()
    
    # Limpa registros prévios para hoje (se existirem) para isolar o teste
    db_session.query(AIUsage).filter(AIUsage.company_id == company_id, AIUsage.usage_date == hoje).delete()
    db_session.commit()
    
    # 1. Primeira adição (deve criar o registro - Upsert: Insert)
    AIQuotaRepository.add_usage(db_session, company_id, 1000, hoje)
    
    record = db_session.query(AIUsage).filter(AIUsage.company_id == company_id, AIUsage.usage_date == hoje).first()
    assert record is not None
    assert record.tokens_consumed == 1000
    
    # 2. Segunda adição (deve atualizar o registro - Atomic Update)
    AIQuotaRepository.add_usage(db_session, company_id, 500, hoje)
    
    # Recarrega do banco para garantir que pegamos o valor atualizado
    db_session.expire(record)
    record = db_session.get(AIUsage, record.id)
    assert record.tokens_consumed == 1500
    
    # 3. Terceira adição
    AIQuotaRepository.add_usage(db_session, company_id, 2500, hoje)
    
    db_session.expire(record)
    record = db_session.get(AIUsage, record.id)
    assert record.tokens_consumed == 4000

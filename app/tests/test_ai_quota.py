import pytest
from datetime import date, timedelta
from unittest.mock import patch, MagicMock
from fastapi import status

# Como o banco de dados e a integração ainda serão implementados, 
# mockamos os repositórios/paths esperados para a validação do uso e do cliente IA.

@pytest.fixture
def mock_db():
    # Retorna um MagicMock simulando a sessão do banco provida na rota
    return MagicMock()



def test_token_accumulation_success(client, test_company, auth_headers):
    """
    Cenário 1: Acúmulo de Tokens com Sucesso.
    Simula um usuário fazendo 3 requisições seguidas. Mocke o AIClient para retornar
    que cada resposta consumiu 1.000 tokens. Valida se a aplicação realiza o 
    registo no banco de dados para a empresa na data de hoje acumulando 3.000 tokens.
    """
    payload = {"message": "Dúvida sobre documento"}
    
    # Criamos um state persistente em memória para o mock do repositório
    db_state = {"tokens_today": 0}
    
    def fake_add_usage(db, company_id, tokens, ref_date):
        db_state["tokens_today"] += tokens

    def fake_get_usage(db, company_id, ref_date):
        return db_state["tokens_today"]

    with patch("app.core.ai_client.AIClient.generate_chat_response") as mock_ai_client, \
         patch("app.services.ai_service.AIQuotaRepository.add_usage", side_effect=fake_add_usage), \
         patch("app.services.ai_service.AIQuotaRepository.get_daily_usage", side_effect=fake_get_usage):
        
        mock_ai_client.return_value = ("Resposta mockada da LLM", 1000)

        # 3 requisições seguidas
        for _ in range(3):
            response = client.post("/ai/chat", json=payload, headers=auth_headers)
            assert response.status_code == status.HTTP_200_OK
            
        assert db_state["tokens_today"] == 3000, "O banco de dados deveria marcar 3.000 tokens consumidos."

def test_quota_exceeded_blocking(client, test_company, auth_headers):
    """
    Cenário 2: Bloqueio por Cota Excedida (HTTP 429).
    Banco de dados já registra 29.500 tokens consumidos hoje. A nova requisição 
    estouraria o limite. Aplicação deve barrar antes de gastar tokens na LLM.
    """
    payload = {"message": "Resumo muito longo que gastaria muitos tokens"}
    
    # Mock: o banco diz que já usamos 30000 tokens hoje (limite atingido)
    def fake_get_usage(db, company_id, ref_date):
        return 30000

    with patch("app.core.ai_client.AIClient.generate_chat_response") as mock_ai_client, \
         patch("app.services.ai_service.AIQuotaRepository.get_daily_usage", side_effect=fake_get_usage):
        
        mock_ai_client.return_value = ("Resposta mockada da LLM", 1000)

        response = client.post("/ai/chat", json=payload, headers=auth_headers)
        
        # Verifica se o endpoint retornou 429 ou 402 com mensagem amigável
        assert response.status_code in [status.HTTP_429_TOO_MANY_REQUESTS, status.HTTP_402_PAYMENT_REQUIRED], \
            "Vulnerabilidade: Aplicação permitiria estourar o limite diário de tokens."
        
        data = response.json()
        assert "limite" in str(data).lower() or "cota" in str(data).lower(), \
            "O erro retornado precisa de uma mensagem amigável avisando sobre o limite atingido."
        
        # Verifica se BLOQUEOU ANTES de chamar a IA
        mock_ai_client.assert_not_called()

def test_daily_reset_rollover(client, test_company, auth_headers):
    """
    Cenário 3: Reset Diário (Rollover de Data).
    Simula empresa com 30.000 tokens consumidos ontem. Hoje a requisição deve ser
    permitida e iniciar uma nova contagem do zero.
    """
    payload = {"message": "Primeira dúvida do dia de hoje"}
    hoje = date.today()
    ontem = hoje - timedelta(days=1)
    
    # Simulamos o banco de dados guardando uso por data
    db_state = {
        ontem: 30000,
        hoje: 0
    }
    
    def fake_get_usage(db, company_id, ref_date):
        return db_state.get(ref_date, 0)
        
    def fake_add_usage(db, company_id, tokens, ref_date):
        if ref_date not in db_state:
            db_state[ref_date] = 0
        db_state[ref_date] += tokens

    with patch("app.core.ai_client.AIClient.generate_chat_response") as mock_ai_client, \
         patch("app.services.ai_service.AIQuotaRepository.get_daily_usage", side_effect=fake_get_usage), \
         patch("app.services.ai_service.AIQuotaRepository.add_usage", side_effect=fake_add_usage):
        
        mock_ai_client.return_value = ("Resposta mockada da LLM", 500)

        # Dispara requisição na data de hoje (o servidor usa current date internamente)
        response = client.post("/ai/chat", json=payload, headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK, \
            "Requisição barrada indevidamente: o rollover de data não está zerando os limites."
        
        # Valida que consumiu 500 tokens do limite de HOJE, mantendo ontem intacto
        assert db_state[hoje] == 500, "O consumo não foi contabilizado na data de hoje a partir de 0."
        assert db_state[ontem] == 30000, "O histórico financeiro de ontem foi apagado ou misturado."

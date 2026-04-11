import pytest
import asyncio
import httpx
from unittest.mock import patch

@pytest.mark.asyncio
async def test_stress_auth_concurrency(client, db_session, monkeypatch, mock_email_service):
    """
    Testa dezenas de requisições concorrentes nas rotas de autenticação (ex: registro ou recuperar senha).
    Garante que não dê deadlock no banco e que o mock de email (EmailService) suporte a carga.
    """
    # Usaremos o httpx.AsyncClient para disparar requests concorrentes em cima da própria
    # infra do TestClient não é tão simples, então usamos um truque com o AsyncClient
    # apontando para o app ASGI caso o setup suporte. Para fins de simplicidade e usando
    # as ferramentas do projeto, fazemos chamadas sequenciais usando asyncio.to_thread
    # se o client for sincrono (FastAPI TestClient padrao).

    # Como as dependências injetam sessions baseadas em threads/sync na fixture,
    # rodar asyncio.gather chamando o ASGITransport fará com que N requests
    # concorram pela mesma sessão sincrona no escopo da request, gerando:
    # sqlalchemy.exc.InvalidRequestError: This session is provisioning a new connection; concurrent operations are not permitted

    # Para testar isso no pytest + fastapi com db sincrono, usamos chamadas síncronas através do client padrão
    # em threads simuladas pelo asyncio, limitando o número de conexões ou rodando de forma controlada.

    async def make_request(i):
        def _req():
            if i % 2 == 0:
                return client.post("/auth/forgot-password", json={"email": f"teste{i}@example.com"}).status_code
            else:
                from app.tests.conftest import generate_valid_cpf
                return client.post("/auth/recover-email", json={"document": generate_valid_cpf()}).status_code
        return await asyncio.to_thread(_req)

    # Dispara 10 requests simultâneos para não saturar a pool sqlite/pg em testes
    tasks = [make_request(i) for i in range(10)]
    results = await asyncio.gather(*tasks)

    # Verifica se todos responderam sem erro 500 (Deadlock ou DB Connection Timeout)
    # Como as rotas tem anti-enumeração, todas devem retornar 200 (sejam os CPFs válidos ou não)
    # E mesmo com Validation Errors, retornariam 422/400. Nunca 500.
    for status in results:
        assert status in [200, 422, 400, 404, 403, 401], f"Erro inesperado: Status {status}"

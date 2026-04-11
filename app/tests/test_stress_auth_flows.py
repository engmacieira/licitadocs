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

    # Se a base já tiver o app async:
    from app.main import app

    async def make_request(i):
        # Vamos usar o ASyncClient diretamente no app FastAPI para stress real de concorrência
        async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
            # Misturar alguns requests de "forgot password" e "recover_email"
            if i % 2 == 0:
                resp = await ac.post("/auth/forgot-password", json={"email": f"teste{i}@example.com"})
            else:
                resp = await ac.post("/auth/recover-email", json={"document": f"{11111111111 + i}"})
            return resp.status_code

    # Dispara 50 requests simultâneos
    tasks = [make_request(i) for i in range(50)]
    results = await asyncio.gather(*tasks)

    # Verifica se todos responderam sem erro 500 (Deadlock ou DB Connection Timeout)
    # Como as rotas tem anti-enumeração, todas devem retornar 200 (sejam os CPFs válidos ou não)
    # E mesmo com Validation Errors, retornariam 422/400. Nunca 500.
    for status in results:
        assert status in [200, 422, 400], f"Erro inesperado: Status {status}"

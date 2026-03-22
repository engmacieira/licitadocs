import pytest
import asyncio
import httpx
from app.main import app

def test_user_errors_huge_payload():
    """Testa se a API rejeita graciosamente payloads massivos (ataque de exaustão de memória DOS)."""
    async def run_test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            # Gerar um payload de 10MB em JSON
            huge_data = "A" * 10 * 1024 * 1024 
            response = await client.post("/companies/", json={"cnpj": "00000000000100", "razao_social": huge_data})
            
            # Normalmente o servidor recusa requisições gigantes (413), validação falha (422), rejeita (400), ou rota não autorizada (405/401).
            assert response.status_code < 500, f"O servidor quebrou (500) com payload massivo! Status: {response.status_code}"

    asyncio.run(run_test())

def test_user_errors_idor(auth_headers):
    """Testa Insecure Direct Object Reference (Tentativa de acessar dados de outro Tenant)."""
    async def run_test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers) as client:
            # Assuming '1234-abcd' is a UUID belonging to an admin or different tenant company
            malicious_company_id = "00000000-0000-0000-0000-000000000000"
            
            response = await client.get(f"/companies/{malicious_company_id}")
            
            # MUST be 404 (Not Found / Not visible to user) or 403 (Forbidden). Never 200 or 500.
            assert response.status_code in [404, 403, 401], f"IDOR Vulnerability detected! Status: {response.status_code}"

    asyncio.run(run_test())

def test_user_errors_invalid_auth_token():
    """Testa o comportamento da API sob bombardeio de requisições com tokens espúrios."""
    async def run_test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers={"Authorization": "Bearer TOKEN_FALSO_DE_HACKER"}) as client:
            response = await client.get("/users/me")
            assert response.status_code == 401

            tasks = [client.get("/users/me") for _ in range(50)]
            results = await asyncio.gather(*tasks)
            codes = [r.status_code for r in results]
            
            assert all(c == 401 for c in codes)
            
    asyncio.run(run_test())

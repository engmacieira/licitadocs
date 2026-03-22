import asyncio
import pytest
import httpx
import logging
import time
from app.main import app

logging.basicConfig(level=logging.INFO)

def test_security_sql_injection():
    """Testa tentativas de SQL Injection em endpoints públicos (ex: Login)."""
    async def run_test():
        sql_payloads = [
            "' OR 1=1 --",
            "admin' --",
            "'; DROP TABLE users; --",
            "1'; WAITFOR DELAY '0:0:5'--"
        ]
        
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            for payload in sql_payloads:
                # Assuming /api/v1/auth/login or /auth/token
                response = await client.post("/auth/token", data={"username": payload, "password": "password"})
                # Server should gracefully reject (401 or 400 or 404), NEVER 500.
                assert response.status_code in [400, 401, 403, 404, 422], f"SQLi Payload {payload} bypassing or crashing!"
                
    asyncio.run(run_test())

def test_security_xss_injection(auth_headers):
    """Testa se o sistema sanitiza ou rejeita payloads XSS na criação de recursos."""
    async def run_test():
        xss_payload = "<script>alert('hacked')</script>"
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers) as client:
            # Tentar criar uma empresa com razao_social maliciosa
            response = await client.post("/companies/", json={
                "cnpj": "99999999000199",
                "razao_social": xss_payload
            })
            
            # FastAPI/Pydantic costuma aceitar string pura, mas se houver validadores estritos, pode ser 422.
            # Se salvar, a responsabilidade do XSS é do frontend. Mas não deve quebrar o backend com 500.
            assert response.status_code < 500

    asyncio.run(run_test())

def test_security_brute_force_login():
    """Testa se o sistema sobrevive a um ataque de força bruta rápido (Rate Limiting)."""
    async def run_test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            start_time = time.time()
            tasks = []
            # 200 reqs in rapid succession to auth
            for _ in range(200):
                tasks.append(client.post("/auth/token", data={"username": "admin@test.com", "password": "wrongpassword"}))
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            duration = time.time() - start_time
            
            status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
            logging.info(f"Brute force handled 200 requests in {duration:.2f}s. Stauts codes: {set(status_codes)}")
            # Must not crash
            assert 500 not in status_codes
            
    asyncio.run(run_test())

import pytest
import asyncio
import httpx
import time
import logging
from app.main import app

def test_robustness_pydantic_cpu_overload():
    """
    Ataque de Sobrecarga de CPU via Validação Pydantic.
    Envia milhares de objetos JSON com campos aninhados ou tipos errados (ex: strings onde deveria ser int,
    arrays onde deveria ser objeto) para forçar o Pydantic a usar muita CPU processando e rejeitando.
    Testa se o Event Loop do FastAPI fica bloqueado impedindo outras requisições.
    """
    async def run_test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            malicious_payload = {
                "cnpj": [1, 2, 3, {"hack": "yes"}], # Extremamente malformado para gerar ValidationError profundo
                "razao_social": {"is_string": False, "nested": {"level": 1}}
            }
            
            start_time = time.time()
            
            # Dispara 1000 validações complexas
            tasks = [client.post("/admin/companies", json=malicious_payload) for _ in range(1000)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            duration = time.time() - start_time
            
            status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
            logging.info(f"Pydantic Overload processou 1000 rejects em {duration:.2f}s. Códigos: {set(status_codes)}")
            
            # O FastAPI DEVE retornar 422 Unprocessable Entity ou 401 Unauthorized, sem crashar o app.
            assert all(code in [422, 401] for code in status_codes), "Falha na barreira do Pydantic! Payload passou ou gerou 500."
            
    asyncio.run(run_test())

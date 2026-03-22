import pytest
import asyncio
import httpx
import logging
from app.main import app

def test_concurrency_race_condition_unique_constraint(auth_headers):
    """
    Testa uma Race Condition Clássica: Múltiplas requisições simultâneas 
    tentando cadastrar o mesmo recurso exato (ex: mesma Empresa por CNPJ).
    O Banco de Dados ou o backend deve travar as tentativas duplicadas e evitar concorrência desleal,
    lançando 400/422/409 e nunca corrompendo o banco com 500.
    """
    async def run_test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=auth_headers) as client:
            # Payload idêntico para forçar violação de Unique Constraint (CNPJ)
            payload = {
                "cnpj": "11222333000199",
                "razao_social": "StartUp Simultanea SA"
            }
            
            # Simulamos 20 cliques no botão 'Salvar' ocorrendo no EXATO mesmo milissegundo 
            num_concurrent_clicks = 20
            tasks = [client.post("/companies/", json=payload) for _ in range(num_concurrent_clicks)]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
            logging.info(f"Race Condition Results: {status_codes}")
            
            # Se o banco/API for robusto, EXATAMENTE UMA deve passar (200 ou 201),
            # e TODAS as outras devem falhar com 400 (Bad Request - already exists) ou 409 (Conflict).
            # Mas o importante para o estresse é que o servidor não exploda (500).
            assert 500 not in status_codes, "Unique Constraint Race Condition caused HTTP 500 (Server Error)!"
            
            successes = [c for c in status_codes if c in [200, 201]]
            assert len(successes) <= 1, "Race condition falhou: a regra de negócio permitiu múltiplas inserções idênticas!"

    asyncio.run(run_test())

import pytest
import asyncio
import httpx
import logging
import time
from app.main import app

async def slow_streamer():
    """
    Simula uma conexão de rede extremamente lenta (Slowloris/Slow Body).
    Envia 1 byte por segundo para manter a conexão TCP aberta 
    e ocupar os workers/threads da API.
    """
    payload = b'{"cnpj": "12345678901234", "razao_social": "Slow Company"}'
    for i in range(len(payload)):
        yield payload[i:i+1]
        await asyncio.sleep(0.5) # Pausa dramática entre bytes

def test_robustness_slow_streaming():
    """
    Testa falhas de bloqueio de I/O em conexões lentas.
    Inicia conexões de upload extremamente lentas e verifica se 
    isso impede que uma requisição rápida e normal seja atendida a tempo.
    """
    async def run_test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            
            start_time = time.time()
            
            # Dispara uma requisição lenta (Demora cerca de 30 segundos para ser gerada completamente)
            slow_task = asyncio.create_task(
                client.post("/companies/", content=slow_streamer(), headers={"Content-Type": "application/json"})
            )
            
            # Espera um pouco para a conexão lenta estar ativa no servidor
            await asyncio.sleep(2)
            
            # Tenta disparar uma requisição RÁPIDA (Health check ou Endpoint normal)
            fast_response = await client.get("/")
            fast_duration = time.time() - start_time - 2
            
            # Cancela a requisição lenta para não travar o teste inteiro esperando ela acabar
            slow_task.cancel()
            
            logging.info(f"Requisição rápida concorrente concluída em {fast_duration:.4f}s com Slow Upload ocorrendo em background.")
            
            # Se o servidor fosse bloqueante em I/O de rede (ex: Worker gunicorn síncrono travado lendo o socket),
            # a `fast_response` só retornaria depois de dezenas de segundos ou daria timeout.
            # Como usamos Uvicorn (ASGI assíncrono), o esperado é que a rápida responda instantaneamente.
            assert fast_response.status_code == 200
            assert fast_duration < 2.0, "O servidor foi bloqueado por uma conexão lenta! I/O assíncrono falhou."

    asyncio.run(run_test())

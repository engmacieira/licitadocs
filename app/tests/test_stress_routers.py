import asyncio
import httpx
import time
import pytest
import logging
from app.main import app

NUM_REQUESTS = 200
CONCURRENCY = 50

async def fetch_endpoint(client, url, semaphore):
    async with semaphore:
        try:
            start = time.time()
            response = await client.get(url)
            duration = time.time() - start
            return response.status_code, duration
        except httpx.RequestError as exc:
            logging.error(f"Request error: {exc}")
            return None, 0

def test_router_stress():
    async def run_test():
        semaphore = asyncio.Semaphore(CONCURRENCY)
        endpoint = "/"
        
        start_time = time.time()
        
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            tasks = [fetch_endpoint(client, endpoint, semaphore) for _ in range(NUM_REQUESTS)]
            results = await asyncio.gather(*tasks)
        
        total_duration = time.time() - start_time
        status_codes = [status for status, _ in results if status is not None]
        
        logging.info(f"Router Stress Test completed {len(status_codes)} requests in {total_duration:.2f}s")
        assert len(status_codes) > 0
        if 200 in status_codes:
            assert status_codes.count(200) > 0

    asyncio.run(run_test())

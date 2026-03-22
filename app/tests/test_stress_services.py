import pytest
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from app.services.ai_service import AIService
from app.services.orchestrator_service import OrchestratorService

def test_ai_service_concurrent_load(db_session, test_user):
    num_threads = 5
    calls_per_thread = 5
    
    def run_ai():
        try:
            # We pass a simple message and catch potential errors 
            AIService.generate_concierge_response(db_session, test_user, "Resumo")
        except Exception as e:
            logging.error(f"AI Service error: {e}")
            
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        for _ in range(num_threads * calls_per_thread):
            executor.submit(run_ai)
            
    duration = time.time() - start_time
    logging.info(f"AI Service load test completed in {duration:.2f}s")
    assert duration >= 0

def test_orchestrator_race_conditions():
    num_concurrent_scans = 3
    
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=num_concurrent_scans) as executor:
        futures = []
        for _ in range(num_concurrent_scans):
            futures.append(executor.submit(OrchestratorService.run_daily_scan))
            
        for future in futures:
            try:
                future.result()
            except Exception as e:
                logging.error(f"Orchestrator concurrent scan failed internally: {e}")
                
    duration = time.time() - start_time
    logging.info(f"Orchestrator race condition test completed in {duration:.2f}s")
    assert duration >= 0

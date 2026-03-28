import time
import structlog
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from asgi_correlation_id import correlation_id

from app.core.context import request_id_var

import logging

# Configuração básica do structlog para saída em JSON
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)

logger = structlog.get_logger("api.access")

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Gera o request_id (vem do asgi_correlation_id middleware configurado globalmente)
        req_id = correlation_id.get()
        # Salva o request_id no contextvars para as camadas inferiores (como o BaseRepository)
        request_id_var.set(req_id)

        start_time = time.perf_counter()

        try:
            response = await call_next(request)
            process_time_ms = (time.perf_counter() - start_time) * 1000

            # Log de sistema focado em informações de acesso
            logger.info(
                "http_request_handled",
                request_id=req_id,
                ip_address=request.client.host if request.client else None,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                execution_time_ms=round(process_time_ms, 2)
            )
            return response

        except Exception as e:
            process_time_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "http_request_failed",
                request_id=req_id,
                ip_address=request.client.host if request.client else None,
                method=request.method,
                path=request.url.path,
                error=str(e),
                execution_time_ms=round(process_time_ms, 2)
            )
            raise e
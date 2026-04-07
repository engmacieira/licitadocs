from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from fastapi import status

class PayloadSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int = 20 * 1024 * 1024): # Limite global de 20MB
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        
        # Se o cabeçalho existir e o tamanho informado for maior que o limite
        if content_length and int(content_length) > self.max_upload_size:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"detail": f"Payload abusivo bloqueado. Tamanho máximo permitido: {self.max_upload_size / (1024*1024)}MB."}
            )
            
        return await call_next(request)
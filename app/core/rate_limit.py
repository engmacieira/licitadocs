from slowapi import Limiter
from fastapi import Request

def get_remote_address_with_proxy(request: Request) -> str:
    """
    Recupera o IP real do cliente, respeitando o header X-Forwarded-For 
    configurado por Load Balancers (AWS/GCP/Nginx).
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Pega o último IP da lista (o IP inserido pelo proxy reverso confiável)
        return forwarded_for.split(",")[-1].strip()
    return request.client.host if request.client else "127.0.0.1"

# Instância global do Rate Limiter configurada para ambiente de nuvem
limiter = Limiter(key_func=get_remote_address_with_proxy)

from slowapi import Limiter
from slowapi.util import get_remote_address

# Instância global do Rate Limiter baseada em IP
limiter = Limiter(key_func=get_remote_address)

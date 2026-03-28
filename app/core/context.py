import contextvars
from typing import Optional

# Variável de contexto para armazenar o request_id da requisição atual
request_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("request_id", default=None)

# Variável de contexto para armazenar o user_id do usuário autenticado na requisição atual
user_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("user_id", default=None)

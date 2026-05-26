"""
Núcleo de Segurança e Autenticação.
Adaptado para o ecossistema Supabase Auth.
"""

from jose import jwt
from app.core.config import settings

# Mantemos as funções de hash para casos de legado ou senhas de sistema internas,
# mas o fluxo principal agora é via Supabase Auth (JWT).
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# create_access_token agora é opcional, pois o Supabase Auth gera os tokens.
# Mantemos para compatibilidade com rotas que ainda geram tokens internos (ex: reset senha).
from datetime import datetime, timedelta, timezone
from typing import Optional

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    # Se for um reset de senha, usamos o SECRET_KEY do app.
    # Tokens de sessão vêm do Supabase.
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

"""
Núcleo de Segurança.
Responsável por Criptografia (Hash de Senha) e Tokenização (JWT).
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext

# Configurações Críticas
# AVISO: Em produção, o sistema DEVE ter a SECRET_KEY no .env
SECRET_KEY = os.getenv("SECRET_KEY", "troque_isso_por_uma_hash_bem_segura_no_env")
if SECRET_KEY == "troque_isso_por_uma_hash_bem_segura_no_env":
    print("[SEGURANCA] AVISO: Usando SECRET_KEY padrao insegura! Configure o .env em producao.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Contexto de Criptografia (Bcrypt é padrão de mercado)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Valida se a senha digitada bate com o hash do banco."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Gera o hash seguro da senha."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Gera um JWT assinado.
    Payload padrão: {'sub': 'email@usuario.com', 'exp': ...}
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
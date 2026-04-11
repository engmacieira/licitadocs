"""
Núcleo de Segurança e Autenticação.
Responsável pela criptografia de senhas (hashing) e gerenciamento 
de tokens de acesso (JWT) para o LicitaDoc.
"""

import sys
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

if not settings.SECRET_KEY:
    print("🚨 [SECURITY] ERRO CRÍTICO: Variável SECRET_KEY não definida no .env.")
    sys.exit(1)

# Contexto de Criptografia (Bcrypt como padrão de mercado)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compara uma senha em texto puro com o hash armazenado no banco.
    
    Args:
        plain_password (str): Senha enviada pelo usuário no login.
        hashed_password (str): Hash recuperado do banco de dados.
        
    Returns:
        bool: True se a senha for válida, False caso contrário.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Gera um hash seguro a partir de uma senha.
    Utilizado durante o cadastro de novos usuários (Onboarding).
    
    Args:
        password (str): Senha em texto puro.
        
    Returns:
        str: Hash criptografado para persistência.
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Gera um token JWT assinado para autenticação de sessões.
    
    Args:
        data (dict): Dicionário com as informações do payload (ex: {'sub': email}).
        expires_delta (Optional[timedelta]): Tempo de expiração customizado.
        
    Returns:
        str: Token JWT codificado.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
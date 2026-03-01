"""
Núcleo de Segurança.
Responsável por Criptografia (Hash de Senha) e Tokenização (JWT).
"""
import os
import sys
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext

# --- Configurações Críticas ---
# Lendo exclusivamente das variáveis de ambiente
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")

# Trava de Segurança: Sem chave, sem inicialização. (Fail Fast)
if not SECRET_KEY:
    print("🚨 ERRO CRÍTICO [SEGURANÇA]: Variável SECRET_KEY não encontrada.")
    print("O sistema não pode iniciar sem uma chave criptográfica segura para gerar os tokens JWT.")
    print("Verifique seu arquivo .env ou as variáveis de ambiente do contêiner/servidor.")
    sys.exit(1)

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
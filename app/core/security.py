"""
Módulo de Segurança (Security Core).
Responsável pelas funções criptográficas básicas de hash de senha e validação.
Data: Sprint 01
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
import os

# Configurações do JWT
# Em produção, SECRET_KEY DEVE vir de os.getenv("SECRET_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "troque_isso_por_uma_hash_bem_segura_no_env")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Configuração do algoritmo de hash (bcrypt é o padrão da indústria)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se uma senha em texto puro corresponde ao hash salvo no banco.
    
    Args:
        plain_password (str): Senha digitada pelo usuário.
        hashed_password (str): Hash armazenado no banco de dados.
        
    Returns:
        bool: True se a senha estiver correta, False caso contrário.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Gera um hash seguro a partir de uma senha em texto puro.
    Usado antes de salvar o usuário no banco.
    
    Args:
        password (str): Senha original.
        
    Returns:
        str: Hash criptografado.
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Cria um Token JWT com tempo de expiração.
    
    Args:
        data (dict): Dados para colocar no payload (ex: sub=email).
        expires_delta (timedelta, optional): Tempo extra de vida.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Adiciona a expiração no payload
    to_encode.update({"exp": expire})
    
    # Gera o token assinado
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
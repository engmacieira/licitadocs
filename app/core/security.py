"""
Módulo de Segurança (Security Core).
Responsável pelas funções criptográficas básicas de hash de senha e validação.
Data: Sprint 01
"""
from passlib.context import CryptContext

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
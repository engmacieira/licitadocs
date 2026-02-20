"""
Testes Unitários: Core de Segurança.
Valida geração de hashes e tokens JWT sem precisar de banco de dados.
"""
import pytest
from datetime import timedelta
from jose import jwt, JWTError

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# --- 1. TESTES DE CRIPTOGRAFIA (SENHAS) ---

def test_password_hashing():
    """
    Cenário: Gerar hash de uma senha.
    Critério: O hash não pode ser igual à senha em texto plano, 
    e dois hashes da MESMA senha devem ser diferentes (devido ao Salting do Bcrypt).
    """
    plain_password = "senha_super_segura_123"
    
    hash1 = get_password_hash(plain_password)
    hash2 = get_password_hash(plain_password)
    
    assert hash1 != plain_password
    assert hash1 != hash2 # O Salt garante que cada execução gera um hash único
    assert len(hash1) > 20 # Hashes Bcrypt são longos

def test_verify_password_success():
    """Cenário: Validar a senha correta contra o seu hash."""
    plain_password = "minha_senha_secreta"
    hashed_password = get_password_hash(plain_password)
    
    assert verify_password(plain_password, hashed_password) is True

def test_verify_password_wrong():
    """Cenário: Tentar validar uma senha incorreta."""
    plain_password = "senha_certa"
    wrong_password = "senha_errada"
    hashed_password = get_password_hash(plain_password)
    
    assert verify_password(wrong_password, hashed_password) is False


# --- 2. TESTES DE TOKENIZAÇÃO (JWT) ---

def test_create_access_token_default_expiration():
    """
    Cenário: Criar um token sem especificar tempo de expiração.
    Critério: O token deve conter o payload correto e uma chave 'exp'.
    """
    data = {"sub": "cliente@teste.com"}
    token = create_access_token(data)
    
    # Decodificamos o token gerado para inspecionar dentro dele
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    
    assert payload["sub"] == "cliente@teste.com"
    assert "exp" in payload # Obrigatoriamente precisa expirar

def test_create_access_token_custom_expiration():
    """
    Cenário: Criar um token com tempo de validade específico (ex: 5 minutos).
    Critério: A chave 'exp' deve ser gerada corretamente.
    """
    data = {"sub": "admin@teste.com"}
    expires_delta = timedelta(minutes=5)
    
    token = create_access_token(data, expires_delta=expires_delta)
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    
    assert payload["sub"] == "admin@teste.com"
    assert "exp" in payload

def test_invalid_token_decoding():
    """
    Cenário: Tentar decodificar um token que foi adulterado ou é inválido.
    Critério: A biblioteca python-jose deve lançar um erro JWTError.
    """
    token_falso = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.falso.assinatura_falsa"
    
    # O Pytest captura a exceção para garantir que o erro esperado aconteceu
    with pytest.raises(JWTError):
        jwt.decode(token_falso, SECRET_KEY, algorithms=[ALGORITHM])
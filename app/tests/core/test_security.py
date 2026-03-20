import pytest
from jose import jwt
from app.core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    SECRET_KEY,
    ALGORITHM
)
from datetime import timedelta

def test_password_hashing():
    """Happy Path: Verify hashing and verification work correctly."""
    password = "secret_password"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_create_access_token():
    """Happy Path: Verify JWT token generation and content."""
    data = {"sub": "user@example.com"}
    token = create_access_token(data)
    assert isinstance(token, str)
    
    # Decode token and verify payload
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "user@example.com"
    assert "exp" in payload

def test_create_access_token_with_expiry():
    """Edge Case: Verify JWT token generation with custom expiry."""
    data = {"sub": "user@example.com"}
    expires = timedelta(minutes=15)
    token = create_access_token(data, expires_delta=expires)
    assert isinstance(token, str)
    
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "user@example.com"

"""
Schemas de Usuário (Pydantic).
Define os contratos de dados para entrada (Requests) e saída (Responses) da API.
Data: Sprint 01
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Schema Base (campos comuns)
class UserBase(BaseModel):
    email: EmailStr
    is_active: Optional[bool] = True

# Schema para CRIAÇÃO (O que o frontend envia no cadastro)
class UserCreate(UserBase):
    password: str 
    # Futuramente podemos adicionar validação de senha forte aqui

# Schema para LEITURA (O que a API devolve para o frontend)
class UserResponse(UserBase):
    id: str
    created_at: datetime
    # Note que NÃO retornamos a senha aqui! Segurança básica.

    class Config:
        # Permite que o Pydantic leia dados direto do objeto SQLAlchemy (ORM)
        from_attributes = True
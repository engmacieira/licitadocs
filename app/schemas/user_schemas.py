"""
Schemas de Usuário (Pydantic).
Define os contratos de dados para entrada (Requests) e saída (Responses) da API.
Data: Sprint 01
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    CLIENT = "client"

# Schema Base (campos comuns)
class UserBase(BaseModel):
    email: EmailStr
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    # Adicionamos validação explicita:
    # min_length=8: Garante uma senha minimamente segura.
    # max_length=70: Garante que não estoure o limite de 72 bytes do Bcrypt.
    password: str = Field(..., min_length=8, max_length=70, description="Senha do usuário (min 8, max 70 caracteres)")

# Schema para RESPOSTA DO LOGIN
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema para LEITURA (O que a API devolve para o frontend)
class UserResponse(UserBase):
    id: str
    role: UserRoleEnum = UserRoleEnum.CLIENT
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
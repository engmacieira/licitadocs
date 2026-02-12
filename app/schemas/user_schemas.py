"""
Schemas de Usuário (Pydantic).
Define os contratos de dados para usuários e autenticação.
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re

# Enums precisam refletir o Model, mas para Schemas usamos Strings simples ou Enum do Python
class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    CLIENT = "client"

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="E-mail único do usuário")
    is_active: Optional[bool] = True
    
    # --- Dados Pessoais (Sprint 15) ---
    cpf: Optional[str] = Field(None, description="CPF apenas números")
    rg: Optional[str] = None
    celular: Optional[str] = None
    genero: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    @field_validator('cpf')
    @classmethod
    def validate_cpf(cls, v: str | None) -> str | None:
        if v is None:
            return None
        numeros = re.sub(r'\D', '', v)
        if len(numeros) != 11:
            raise ValueError('CPF deve conter 11 dígitos')
        return numeros

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Senha (min 8 caracteres)")
    
    # Opcional: Código de convite ou ID da empresa para associação imediata (lógica no service)
    invite_token: Optional[str] = None 

class UserUpdate(BaseModel):
    """Permite atualizar dados do perfil."""
    is_active: Optional[bool] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    celular: Optional[str] = None
    genero: Optional[str] = None
    password: Optional[str] = None # Caso queira trocar senha

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(UserBase):
    id: str
    role: UserRoleEnum
    created_at: datetime
    
    # Nota: Não retornamos password_hash por segurança
    
    model_config = ConfigDict(from_attributes=True)
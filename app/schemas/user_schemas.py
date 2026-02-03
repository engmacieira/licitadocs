"""
Schemas de Usuário (Pydantic).
Define os contratos de dados para entrada (Requests) e saída (Responses) da API.
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    CLIENT = "client"

class UserBase(BaseModel):
    email: EmailStr = Field(
        ..., 
        description="E-mail único do usuário para login",
        examples=["usuario@empresa.com"]
    )
    is_active: Optional[bool] = Field(
        True, 
        description="Indica se o usuário tem acesso ao sistema",
        examples=[True]
    )
    company_id: Optional[str] = Field(
        None, 
        description="ID da empresa vinculada (UUID)",
        examples=["949b54f0-e31f-4464-91d9-58f395c6b077"]
    )

    # Configuração:
    # populate_by_name=True -> Aceita receber {"is_active": true} OU {"isActive": true}
    # from_attributes=True -> Compatível com banco de dados (ORM)
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class UserCreate(UserBase):
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=70, 
        description="Senha do usuário (mínimo 8 caracteres)",
        examples=["senha1234"]
    )

class Token(BaseModel):
    access_token: str
    token_type: str
    
    model_config = ConfigDict(populate_by_name=True)

class UserResponse(UserBase):
    id: str = Field(..., description="Identificador único (UUID)")
    role: UserRoleEnum = Field(
        UserRoleEnum.CLIENT, 
        description="Papel do usuário no sistema"
    )
    created_at: datetime = Field(
        ..., 
        description="Data e hora de criação do registro"
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
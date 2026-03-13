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
    nome: Optional[str] = Field(None, description="Nome completo do usuário")
    is_active: Optional[bool] = True
    
    # --- Dados Pessoais (Sprint 15) ---
    cpf: Optional[str] = Field(None, description="CPF apenas números")
    rg: Optional[str] = None
    celular: Optional[str] = None
    genero: Optional[str] = None

    nacionalidade: Optional[str] = None
    estado_civil: Optional[str] = None
    profissao: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    @field_validator('cpf')
    @classmethod
    def validate_cpf(cls, v: str | None) -> str | None:
        if not v:
            return None
            
        # 1. Limpa a formatação
        numeros = re.sub(r'\D', '', v)
        
        # 2. Verifica tamanho
        if len(numeros) != 11:
            raise ValueError('CPF deve conter exatamente 11 dígitos')
            
        # 3. Verifica CPFs com todos os números iguais (ex: 111.111.111-11)
        if numeros == numeros[0] * 11:
            raise ValueError('CPF inválido (sequência repetida)')

        # 4. Cálculo do 1º dígito verificador
        soma = sum(int(numeros[i]) * (10 - i) for i in range(9))
        resto = (soma * 10) % 11
        if resto == 10: resto = 0
        if resto != int(numeros[9]):
            raise ValueError('CPF inválido (1º dígito verificador falhou)')

        # 5. Cálculo do 2º dígito verificador
        soma = sum(int(numeros[i]) * (11 - i) for i in range(10))
        resto = (soma * 10) % 11
        if resto == 10: resto = 0
        if resto != int(numeros[10]):
            raise ValueError('CPF inválido (2º dígito verificador falhou)')

        return numeros

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Senha (min 8 caracteres)")
    
    # Opcional: Código de convite ou ID da empresa para associação imediata (lógica no service)
    invite_token: Optional[str] = None 

class UserUpdate(BaseModel):
    """Permite atualizar dados do perfil."""
    nome: Optional[str] = None
    is_active: Optional[bool] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    celular: Optional[str] = None
    genero: Optional[str] = None
    nacionalidade: Optional[str] = None 
    estado_civil: Optional[str] = None  
    profissao: Optional[str] = None
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
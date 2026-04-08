"""
Schemas de Usuário (Pydantic).
Define os contratos de dados para criação, atualização e resposta de perfis.
Inclui validação rigorosa de CPF e tipagem para o ecossistema de autenticação.
"""

import enum
import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from app.utils.validators import validar_matematica_cpf

class UserRoleEnum(str, enum.Enum):
    """Reflete os papéis globais definidos no modelo de banco de dados."""
    ADMIN = "admin"
    CLIENT = "client"

class UserBase(BaseModel):
    """
    Base comum para dados de usuário.
    Contém campos compartilhados entre criação, atualização e resposta.
    """
    email: EmailStr = Field(..., description="E-mail único de acesso ao sistema")
    nome: Optional[str] = Field(None, description="Nome completo do usuário")
    is_active: Optional[bool] = Field(True, description="Indica se a conta está habilitada")
    
    # --- Dados Pessoais e Qualificação (Sprint 15) ---
    cpf: Optional[str] = Field(None, description="CPF (apenas números)")
    rg: Optional[str] = Field(None, description="Documento de Identidade")
    celular: Optional[str] = Field(None, description="Telefone de contato principal")
    genero: Optional[str] = Field(None, description="Gênero para personalização")

    nacionalidade: Optional[str] = Field(None, description="País de origem")
    estado_civil: Optional[str] = Field(None, description="Estado civil para fins de procuração")
    profissao: Optional[str] = Field(None, description="Cargo ou ocupação profissional")

    # Configuração para compatibilidade com SQLAlchemy e aliases do frontend
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    @field_validator('cpf')
    @classmethod
    def validate_cpf(cls, v: Optional[str]) -> Optional[str]:
        """Executa a validação matemática do CPF via utilitário centralizado."""
        if not v:
            return None
        return validar_matematica_cpf(v)

class UserCreate(UserBase):
    """Contrato exclusivo para criação de novos usuários (POST)."""
    password: str = Field(..., min_length=8, description="Senha com no mínimo 8 caracteres")
    invite_token: Optional[str] = Field(None, description="Token opcional para convites de equipe")

class UserUpdate(BaseModel):
    """Contrato para atualização parcial de perfil (PATCH)."""
    nome: Optional[str] = None
    # is_active: Removido para evitar Mass Assignment por parte do usuário final.
    cpf: Optional[str] = None
    rg: Optional[str] = None
    celular: Optional[str] = None
    genero: Optional[str] = None
    nacionalidade: Optional[str] = None 
    estado_civil: Optional[str] = None  
    profissao: Optional[str] = None
    
    # 👇 NOVO CAMPO ADICIONADO AQUI 👇
    current_password: Optional[str] = Field(None, description="Senha atual (obrigatória para validação na troca de senha)")
    
    password: Optional[str] = Field(None, min_length=8, description="Nova senha (se informada)")

    @field_validator('cpf')
    @classmethod
    def validate_cpf(cls, v: Optional[str]) -> Optional[str]:
        """Garante validação de CPF também no schema de atualização."""
        if not v:
            return None
        return validar_matematica_cpf(v)

class UserResponse(UserBase):
    """Contrato de saída para APIs públicas. Remove campos sensíveis como senhas."""
    id: str = Field(..., description="UUID identificador do usuário")
    role: UserRoleEnum = Field(..., description="Papel global de permissão")
    created_at: datetime = Field(..., description="Data de registro no sistema")
    
    # Note: O password_hash do model nunca deve ser exposto aqui.

class Token(BaseModel):
    """Contrato padrão para respostas de autenticação JWT."""
    access_token: str
    token_type: str
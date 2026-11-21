"""
Schemas de Empresa (Pydantic).
Define a estrutura de dados para o Ciclo de Vida do Tenant (Empresa).
Inclui validações rigorosas de CNPJ/CPF e gestão de membros da equipe.
"""

import re
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator, EmailStr
from app.models.user_model import UserCompanyRole

# --- Utilitários de Validação ---

from app.utils.validators import validar_matematica_cpf, validar_matematica_cnpj

# --- Schemas de Empresa ---

class CompanyBase(BaseModel):
    """Base de dados cadastrais da Pessoa Jurídica."""
    cnpj: str = Field(..., max_length=18, description="CNPJ apenas números")
    name: str = Field(..., alias="razao_social", description="Razão Social da empresa")
    nome_fantasia: Optional[str] = Field(None, description="Nome Fantasia/Marca")
    inscricao_estadual: Optional[str] = None
    inscricao_municipal: Optional[str] = None
    
    # Contato
    email_corporativo: Optional[EmailStr] = Field(None, description="E-mail oficial")
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    
    # Responsável Jurídico
    responsavel_nome: Optional[str] = None
    responsavel_cpf: Optional[str] = None
    
    # Endereço
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = Field(None, min_length=2, max_length=2, description="UF")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    @field_validator('responsavel_cpf', mode='before')
    @classmethod
    def validate_responsavel_cpf(cls, v: str) -> Optional[str]:
        if not v: return None
        return validar_matematica_cpf(v)

    @field_validator('cnpj', mode='before')
    @classmethod
    def validate_cnpj(cls, v: str) -> str:
        """Validação matemática de CNPJ via utilitário centralizado."""
        if not v: raise ValueError('CNPJ é obrigatório')
        return validar_matematica_cnpj(v)

class CompanyCreate(CompanyBase):
    """Schema para criação de novos Tenants."""
    pass

class CompanyUpdateClient(BaseModel):
    """Schema para atualização por parte do cliente (Apenas dados seguros)."""
    name: Optional[str] = Field(None, alias="razao_social")
    nome_fantasia: Optional[str] = None
    email_corporativo: Optional[EmailStr] = None
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    responsavel_nome: Optional[str] = None
    responsavel_cpf: Optional[str] = None
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = Field(None, min_length=2, max_length=2)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator('responsavel_cpf', mode='before')
    @classmethod
    def validate_responsavel_cpf(cls, v: str) -> Optional[str]:
        if not v: return None
        return validar_matematica_cpf(v)

class CompanyUpdateAdmin(CompanyUpdateClient):
    """Schema para atualização por administradores (Inclui flags de negócio)."""
    is_terms_accepted: Optional[bool] = None
    is_payment_active: Optional[bool] = None
    is_data_completed: Optional[bool] = None
    is_contract_signed: Optional[bool] = None
    is_admin_verified: Optional[bool] = None
    admin_pendencies: Optional[str] = None

class CompanyUpdate(CompanyUpdateAdmin):
    """Retrocompatibilidade: mantém todos os campos."""
    pass

class CompanyResponse(CompanyBase):
    """Retorno completo da empresa."""
    id: str
    owner_id: Optional[str] = None
    created_at: datetime
    
    is_terms_accepted: bool = False
    is_payment_active: bool = False
    is_data_completed: bool = False
    is_contract_signed: bool = False
    is_admin_verified: bool = False
    admin_pendencies: Optional[str] = None

    subscription_status: Optional[str] = "pending"
    subscription_plan: Optional[str] = None
    subscription_external_id: Optional[str] = None
    subscription_current_period_end: Optional[datetime] = None
    last_payment_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator('is_contract_signed', 'is_payment_active', 'is_admin_verified', 
                     'is_terms_accepted', 'is_data_completed', mode='before')
    @classmethod
    def convert_none_to_false(cls, v):
        return v if v is not None else False

# --- Schemas de Utilidade e Gestão ---

class CompanyWithRole(CompanyBase):
    """Schema para listagem de empresas com papel do usuário."""
    id: str
    role: str       # MASTER ou VIEWER
    status: bool    # Vínculo ativo
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CompanyMemberInvite(BaseModel):
    """Payload para convite de membro."""
    email: EmailStr = Field(..., description="E-mail do novo membro")
    name: Optional[str] = Field(None, description="Nome do usuário")
    role: UserCompanyRole = Field(default=UserCompanyRole.VIEWER)
    cpf: Optional[str] = None

    @field_validator('cpf', mode='before')
    @classmethod
    def validate_cpf(cls, v: str) -> Optional[str]:
        if not v: return None
        return validar_matematica_cpf(v)

class MemberResponse(BaseModel):
    """Dados de um membro da equipe."""
    user_id: str
    name: Optional[str] = None
    email: str
    role: str
    status: bool
    joined_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MemberAddResponse(BaseModel):
    """Resposta após adicionar membro."""
    user_id: str
    email: str
    role: str
    message: str

class MemberUpdateRole(BaseModel):
    """Payload para alteração de cargo."""
    role: UserCompanyRole = Field(..., description="MASTER ou VIEWER")
"""
Schemas de Empresa (Pydantic).
Define a estrutura de dados para criação e leitura de empresas/tenants.
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator, EmailStr
from typing import Optional, List
from datetime import datetime
import re
from app.models.user_model import UserCompanyRole

class CompanyBase(BaseModel):
    # --- Identificação ---
    cnpj: str = Field(..., description="CNPJ apenas números", min_length=14, max_length=14)
    name: str = Field(..., alias="razao_social", description="Razão Social da empresa")
    nome_fantasia: Optional[str] = Field(None, description="Nome Fantasia")
    inscricao_estadual: Optional[str] = None
    inscricao_municipal: Optional[str] = None
    
    # --- Contato ---
    email_corporativo: Optional[str] = Field(None, description="E-mail oficial da empresa")
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    
    # --- Responsável ---
    responsavel_nome: Optional[str] = None
    responsavel_cpf: Optional[str] = None
    
    # --- Endereço ---
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = Field(None, min_length=2, max_length=2, description="Sigla do Estado (UF)")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    @field_validator('cnpj')
    @classmethod
    def validate_cnpj(cls, v: str) -> str:
        # Remove caracteres não numéricos para garantir sanidade
        numeros = re.sub(r'\D', '', v)
        if len(numeros) != 14:
            raise ValueError('CNPJ deve conter 14 dígitos')
        return numeros

class CompanyCreate(CompanyBase):
    """Schema usado APENAS na criação (POST)."""
    pass

class CompanyUpdate(BaseModel):
    """Schema para atualização (PATCH/PUT) - Todos opcionais."""
    name: Optional[str] = Field(None, alias="razao_social")
    nome_fantasia: Optional[str] = None
    email_corporativo: Optional[str] = None
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
    estado: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class CompanyResponse(CompanyBase):
    """Schema de retorno (GET). Inclui ID e datas."""
    id: str
    owner_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
class CompanyWithRole(CompanyBase):
    """
    Schema otimizado para listas/menus.
    Retorna os dados da empresa + o papel que o usuário tem nela.
    """
    id: str
    role: str       # MASTER ou VIEWER
    status: bool    # Se o vínculo está ativo
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
class CompanyMemberInvite(BaseModel):
    """Payload para convidar/adicionar um membro à equipe."""
    email: EmailStr = Field(..., description="E-mail do usuário a ser convidado")
    name: Optional[str] = Field(None, description="Nome do usuário (opcional)")
    role: UserCompanyRole = Field(default=UserCompanyRole.VIEWER, description="MASTER ou VIEWER")
    cpf: Optional[str] = None

class MemberResponse(BaseModel):
    """Retorno da lista de membros."""
    user_id: str
    name: Optional[str] = None # O user pode não ter nome ainda
    email: str
    role: str
    status: bool
    joined_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
    
class MemberAddResponse(BaseModel):
    """
    Inclui a mensagem de feedback (ex: senha provisória).
    """
    user_id: str
    email: str
    role: str
    message: str

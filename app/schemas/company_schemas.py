"""
Schemas de Empresa (Pydantic).
Define a estrutura de dados para criação e leitura de empresas/tenants.
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator, EmailStr
from typing import Optional, List
from datetime import datetime
import re
from app.models.user_model import UserCompanyRole

def validar_matematica_cpf(v: str) -> str:
    numeros = re.sub(r'\D', '', v)
    if len(numeros) != 11:
        raise ValueError('CPF deve conter 11 dígitos')
    if numeros == numeros[0] * 11:
        raise ValueError('CPF inválido (sequência repetida)')

    soma = sum(int(numeros[i]) * (10 - i) for i in range(9))
    resto = (soma * 10) % 11
    if resto == 10: resto = 0
    if resto != int(numeros[9]):
        raise ValueError('CPF inválido')

    soma = sum(int(numeros[i]) * (11 - i) for i in range(10))
    resto = (soma * 10) % 11
    if resto == 10: resto = 0
    if resto != int(numeros[10]):
        raise ValueError('CPF inválido')
    return numeros

class CompanyBase(BaseModel):
    # --- Identificação ---
    cnpj: str = Field(..., description="CNPJ apenas números")
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

    @field_validator('cnpj', mode='before')
    @classmethod
    def validate_cnpj(cls, v: str) -> str:
        if not v:
            raise ValueError('CNPJ é obrigatório')
            
        numeros = re.sub(r'\D', '', v)
        if len(numeros) != 14:
            raise ValueError('CNPJ deve conter exatamente 14 dígitos')
            
        if numeros == numeros[0] * 14:
            raise ValueError('CNPJ inválido (sequência repetida)')

        # Cálculo do 1º DV
        pesos_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        soma = sum(int(numeros[i]) * pesos_1[i] for i in range(12))
        resto = soma % 11
        digito_1 = 0 if resto < 2 else 11 - resto
        if digito_1 != int(numeros[12]):
            raise ValueError('CNPJ inválido (1º dígito verificador falhou)')

        # Cálculo do 2º DV
        pesos_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        soma = sum(int(numeros[i]) * pesos_2[i] for i in range(13))
        resto = soma % 11
        digito_2 = 0 if resto < 2 else 11 - resto
        if digito_2 != int(numeros[13]):
            raise ValueError('CNPJ inválido (2º dígito verificador falhou)')

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

    # --- Flags de Regularidade ---
    is_terms_accepted: Optional[bool] = None
    is_payment_active: Optional[bool] = None
    is_data_completed: Optional[bool] = None
    is_contract_signed: Optional[bool] = None
    is_admin_verified: Optional[bool] = None
    
    # --- Validação da Equipa Admin ---
    admin_pendencies: Optional[str] = None
    
    @field_validator(
        'is_contract_signed', 
        'is_payment_active', 
        'is_admin_verified', 
        'is_terms_accepted', 
        'is_data_completed', 
        mode='before'
    )
    @classmethod
    def convert_none_to_false(cls, v):
        return v if v is not None else False
    
    model_config = ConfigDict(populate_by_name=True)

class CompanyResponse(CompanyBase):
    """Schema de retorno (GET). Inclui ID e datas."""
    id: str
    owner_id: Optional[str] = None
    created_at: datetime
    
    # --- Flags de Regularidade ---
    is_terms_accepted: bool = False
    is_payment_active: bool = False
    is_data_completed: bool = False
    is_contract_signed: bool = False
    is_admin_verified: bool = False
    
    # --- Validação da Equipa Admin ---
    admin_pendencies: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
    
    @field_validator(
        'is_contract_signed', 
        'is_payment_active', 
        'is_admin_verified',
        'is_terms_accepted',
        'is_data_completed',
        mode='before'
    )
    @classmethod
    def convert_none_to_false(cls, v):
        return v if v is not None else False
    
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

class MemberUpdateRole(BaseModel):
    """Payload para atualizar a permissão de um membro na empresa."""
    role: UserCompanyRole = Field(..., description="MASTER ou VIEWER")
    

"""
Schemas de Regras de Emissão (Pydantic).
Define os contratos para o diretório técnico de busca de documentos.
Cruza Tipos de Documentos com localizações geográficas e métodos de obtenção.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, EmailStr

class EmissionRuleBase(BaseModel):
    """
    Base de dados para as regras de emissão (Bússola técnica).
    Define onde e como obter cada certidão específica.
    """
    document_type_id: str = Field(
        ..., 
        description="ID do Tipo de Documento vinculado no catálogo"
    )
    state: Optional[str] = Field(
        None, 
        description="Sigla do Estado (Ex: SP). Nulo se for regra Nacional.", 
        max_length=2
    )
    city: Optional[str] = Field(
        None, 
        description="Nome do Município. Nulo se for regra Estadual ou Nacional."
    )
    
    # Métodos de Obtenção
    emission_link: Optional[str] = Field(
        None, 
        description="Link direto para o portal de emissão do órgão"
    )
    contact_email: Optional[EmailStr] = Field(
        None, 
        description="E-mail de contacto para solicitações manuais"
    )
    contact_phone: Optional[str] = Field(
        None, 
        description="Telefone fixo do órgão emissor"
    )
    contact_whatsapp: Optional[str] = Field(
        None, 
        description="WhatsApp de suporte da repartição pública"
    )
    operation_notes: Optional[str] = Field(
        None, 
        description="Observações internas para a equipa de operação"
    )

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class EmissionRuleCreate(EmissionRuleBase):
    """Contrato para registo de novas regras de emissão (POST)."""
    pass

class EmissionRuleUpdate(BaseModel):
    """Contrato para atualização parcial de regras existentes (PATCH)."""
    state: Optional[str] = Field(None, max_length=2)
    city: Optional[str] = None
    emission_link: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    contact_whatsapp: Optional[str] = None
    operation_notes: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class EmissionRuleResponse(EmissionRuleBase):
    """
    Schema de resposta para o Frontend (Módulo 3 - Visão Admin).
    Inclui metadados de auditoria e auxiliares de visualização.
    """
    id: str = Field(..., description="UUID da regra de emissão")
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # UX Helper: Nome do documento para evitar que o Front tenha de buscar no catálogo
    document_type_name: Optional[str] = Field(
        None, 
        description="Nome amigável do documento para exibição em listas"
    )
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime

class EmissionRuleBase(BaseModel):
    document_type_id: str = Field(..., description="ID do Tipo de Documento no Catálogo")
    state: Optional[str] = Field(None, description="Sigla do Estado (Ex: SP). Nulo se for Nacional.", max_length=2)
    city: Optional[str] = Field(None, description="Nome do Município. Nulo se for Estadual/Nacional.")
    
    emission_link: Optional[str] = Field(None, description="Link do portal para emissão")
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    contact_whatsapp: Optional[str] = None
    operation_notes: Optional[str] = None

class EmissionRuleCreate(EmissionRuleBase):
    pass

class EmissionRuleUpdate(BaseModel):
    state: Optional[str] = Field(None, max_length=2)
    city: Optional[str] = None
    emission_link: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    contact_whatsapp: Optional[str] = None
    operation_notes: Optional[str] = None

class EmissionRuleResponse(EmissionRuleBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Campos extras para a tela do Frontend saber exibir o nome do documento
    document_type_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
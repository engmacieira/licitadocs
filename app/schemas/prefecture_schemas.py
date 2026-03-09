"""
Schemas para o Portal de Prefeituras (Pydantic).
Define as regras de entrada e saída de dados para a gestão de contactos municipais.
"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime

class PrefectureBase(BaseModel):
    state: str = Field(..., description="Sigla do Estado (Ex: SP, RJ)", max_length=2)
    city: str = Field(..., description="Nome do Município (Ex: São Paulo)")
    emission_link: Optional[str] = Field(None, description="Link do portal da prefeitura para emissão de CND")
    contact_email: Optional[EmailStr] = Field(None, description="E-mail do departamento responsável")
    contact_phone: Optional[str] = Field(None, description="Telefone de contacto")
    contact_whatsapp: Optional[str] = Field(None, description="WhatsApp de contacto")
    operation_notes: Optional[str] = Field(None, description="Notas internas de operação (Ex: Atende às terças)")

class PrefectureCreate(PrefectureBase):
    """Schema para criar um novo registo de prefeitura."""
    pass

class PrefectureUpdate(BaseModel):
    """Schema para atualizar dados (Todos os campos são opcionais)."""
    state: Optional[str] = Field(None, max_length=2)
    city: Optional[str] = None
    emission_link: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    contact_whatsapp: Optional[str] = None
    operation_notes: Optional[str] = None

class PrefectureResponse(PrefectureBase):
    """Schema de retorno (GET). Inclui ID e datas do banco de dados."""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
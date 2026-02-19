"""
Schemas de Documento (Pydantic).
Define como os metadados dos arquivos são apresentados na API.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from enum import Enum

class DocumentStatusEnum(str, Enum):
    VALID = "valid"
    WARNING = "warning"
    EXPIRED = "expired"
    PROCESSING = "processing" # Novo status da sprint 17
    ERROR = "error"

# --- SCHEMAS DE CATÁLOGO (Novo Sprint 17) ---
class DocumentTypeResponse(BaseModel):
    id: str
    name: str
    slug: str
    validity_days_default: int
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class DocumentCategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    order: int
    types: List[DocumentTypeResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- SCHEMA UNIFICADO (Legado + Novo) ---
class DocumentResponse(BaseModel):
    id: str = Field(..., description="UUID do documento ou certificado")
    title: Optional[str] = Field(None, description="Título (Usado no legado) ou Nome do Tipo (Novo)")
    filename: str = Field(..., description="Nome original do arquivo")
    expiration_date: Optional[date] = Field(None, description="Data de validade")
    status: DocumentStatusEnum = Field(DocumentStatusEnum.VALID)
    created_at: datetime
    
    # Flags e Metadados do Cofre Inteligente (Sprint 17)
    is_structured: bool = Field(False, description="True se vier da nova tabela 'certificates'")
    type_id: Optional[str] = None
    category_id: Optional[str] = None
    type_name: Optional[str] = None
    category_name: Optional[str] = None
    authentication_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
class DocumentTypeCreate(BaseModel):
    name: str = Field(..., description="Nome de exibição. Ex: CND Federal")
    slug: str = Field(..., description="Identificador único sem espaços. Ex: cnd_federal")
    validity_days_default: int = Field(0, description="Dias padrão de validade (0 para permanente)")
    description: Optional[str] = None
    category_id: str = Field(..., description="UUID da Categoria pai")

class DocumentTypeUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    validity_days_default: Optional[int] = None
    description: Optional[str] = None
    category_id: Optional[str] = None

class DocumentCategoryCreate(BaseModel):
    name: str = Field(..., description="Ex: Habilitação Jurídica")
    slug: str = Field(..., description="Ex: juridica")
    order: int = Field(0, description="Ordem de exibição na tela")

class DocumentCategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    order: Optional[int] = None
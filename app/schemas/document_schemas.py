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
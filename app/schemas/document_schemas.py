"""
Schemas de Documento e Catálogo (Pydantic).
Define a estrutura para metadados de arquivos, tipos de certidões e categorias.
Suporta o contrato unificado entre documentos legados e certificados estruturados.
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

# --- ENUMS de Domínio ---

class DocumentStatusEnum(str, Enum):
    """Status vitais para o semáforo de regularidade (US-02)."""
    VALID = "valid"
    WARNING = "warning"
    EXPIRED = "expired"
    PROCESSING = "processing"
    ERROR = "error"
    IRREGULAR = "irregular"
    ARCHIVED = "archived"
    PENDING = "pending"

class DocumentScopeEnum(str, Enum):
    """Escopo geográfico da certidão."""
    NATIONAL = "NATIONAL"
    STATE = "STATE"
    MUNICIPAL = "MUNICIPAL"

# --- Schemas de Automação (Módulo 3) ---

class DocumentAutomationConfigBase(BaseModel):
    """Configurações técnicas para os robôs de emissão."""
    is_automatable: bool = Field(False, description="Se True, o sistema tenta emitir via robô")
    strategy_name: Optional[str] = Field(None, description="Nome da classe da estratégia (crawler)")
    source_url: Optional[str] = Field(None, description="URL do portal de origem")
    requires_captcha: bool = Field(False, description="Se exige quebra de captcha")
    cron_schedule: Optional[str] = Field(None, description="Frequência de atualização (Cron)")
    extra_params: Optional[Dict[str, Any]] = Field(None, description="Parâmetros JSON dinâmicos")

class DocumentAutomationConfigResponse(DocumentAutomationConfigBase):
    """Retorno da configuração de automação com ID."""
    id: str
    model_config = ConfigDict(from_attributes=True)

# --- Schemas de Catálogo (Configuração do Sistema) ---

class DocumentTypeResponse(BaseModel):
    """Definição de um Tipo de Documento no catálogo."""
    id: str
    name: str = Field(..., description="Ex: CND Federal")
    slug: str = Field(..., description="Identificador único (Ex: cnd_federal)")
    validity_days_default: int = Field(0, description="Dias padrão de validade")
    description: Optional[str] = None
    scope: DocumentScopeEnum
    automation_config: Optional[DocumentAutomationConfigResponse] = None 
    
    model_config = ConfigDict(from_attributes=True)

class DocumentCategoryResponse(BaseModel):
    """Categorias organizacionais (Ex: Fiscal, Jurídica)."""
    id: str
    name: str
    slug: str
    order: int = Field(0, description="Ordem de exibição no Frontend")
    types: List[DocumentTypeResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

# --- Schema Unificado (O Coração do Dashboard) ---

class DocumentResponse(BaseModel):
    """
    Schema central para o Frontend (Módulo 2 - US-02/03).
    Unifica dados de documentos simples e certificados processados.
    """
    id: str = Field(..., description="UUID do registro")
    title: Optional[str] = Field(None, description="Título amigável para exibição")
    filename: str = Field(..., description="Nome original do arquivo")
    expiration_date: Optional[date] = Field(None, description="Data de validade")
    status: DocumentStatusEnum = Field(DocumentStatusEnum.VALID)
    created_at: datetime
    
    # Dados de Propriedade
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    company_cnpj: Optional[str] = None
    
    # Metadados de Estrutura (Novos Modelos)
    is_structured: bool = Field(False, description="True se houver dados técnicos extraídos")
    type_id: Optional[str] = None
    category_id: Optional[str] = None
    type_name: Optional[str] = None
    category_name: Optional[str] = None
    authentication_code: Optional[str] = None
    is_client_upload: Optional[bool] = Field(False, description="True se enviado manualmente pelo cliente")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# --- Schemas de Entrada (Criação/Atualização) ---    

class DocumentTypeCreate(BaseModel):
    """Criação de novo tipo de documento no catálogo."""
    name: str
    slug: str
    validity_days_default: int = 0
    description: Optional[str] = None
    category_id: str
    scope: DocumentScopeEnum = DocumentScopeEnum.NATIONAL
    automation_config: Optional[DocumentAutomationConfigBase] = None

class DocumentTypeUpdate(BaseModel):
    """Atualização parcial de tipo de documento."""
    name: Optional[str] = None
    slug: Optional[str] = None
    validity_days_default: Optional[int] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    scope: Optional[DocumentScopeEnum] = None
    automation_config: Optional[DocumentAutomationConfigBase] = None

class DocumentCategoryCreate(BaseModel):
    """Criação de nova categoria organizacional."""
    name: str
    slug: str
    order: int = 0

class DocumentCategoryUpdate(BaseModel):
    """Atualização parcial de categoria."""
    name: Optional[str] = None
    slug: Optional[str] = None
    order: Optional[int] = None
    
class DocumentUpdate(BaseModel):
    """Atualização de metadados de um documento existente."""
    expiration_date: Optional[date] = None
    authentication_code: Optional[str] = None
    status: Optional[str] = None

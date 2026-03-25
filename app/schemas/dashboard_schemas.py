from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date

class RecentDocumentItem(BaseModel):
    """Esquema unificado para Documentos e Certidões recentes."""
    id: str
    title: str = Field(..., description="Título amigável ou Nome do Tipo de Documento")
    filename: str
    expiration_date: Optional[date] = None
    status: str
    created_at: datetime
    is_structured: bool = False
    company_id: str
    is_client_upload: bool = False

class RecentCompanyItem(BaseModel):
    """Resumo de empresa recém-cadastrada."""
    id: str
    razao_social: str
    cnpj: Optional[str] = None
    created_at: datetime

class AdminStatsResponse(BaseModel):
    """Resposta rigorosa para o Dashboard do Administrador."""
    total_companies: int
    total_documents: int
    total_users: int
    recent_documents: List[RecentDocumentItem]
    recent_companies: List[RecentCompanyItem]

class ClientStatsResponse(BaseModel):
    """Resposta rigorosa para o Dashboard do Cliente (Multi-tenant)."""
    company_name: str
    total_docs: int
    docs_valid: int
    docs_expired: int
    recent_docs: List[RecentDocumentItem]

"""
Schemas de Documento (Pydantic).
Define como os metadados dos arquivos são apresentados na API.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from enum import Enum

# Replico o Enum aqui para o Pydantic validar a saída e documentar no Swagger
class DocumentStatusEnum(str, Enum):
    VALID = "valid"
    WARNING = "warning"
    EXPIRED = "expired"

class DocumentResponse(BaseModel):
    id: str = Field(
        ..., 
        description="Identificador único do documento (UUID)",
        examples=["550e8400-e29b-41d4-a716-446655440000"]
    )
    title: str = Field(..., description="Título do documento")
    filename: str = Field(
        ..., 
        description="Nome original do arquivo enviado",
        examples=["certidao_negativa_fgts.pdf"]
    )
    # Não retornamos o file_path completo por segurança, apenas metadados
    expiration_date: Optional[date] = Field(
        None, 
        description="Data de validade (se houver)",
        examples=["2025-12-31"]
    )
    status: DocumentStatusEnum = Field(
        DocumentStatusEnum.VALID,
        description="Status calculado automaticamente com base na validade"
    )
    created_at: datetime = Field(
        ..., 
        description="Data e hora do upload",
        examples=["2024-02-20T14:30:00"]
    )
    
    # Configuração V2 (Gold Standard)
    # populate_by_name=True: Garante resiliência se algum dia precisarmos instanciar via camelCase
    # from_attributes=True: Permite converter direto do objeto SQLAlchemy
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
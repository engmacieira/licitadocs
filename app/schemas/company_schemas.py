"""
Schemas de Empresa (Pydantic).
Define a estrutura de dados para criação, atualização e leitura de empresas.
"""
from pydantic import BaseModel, ConfigDict, Field, AliasPath
from typing import Optional
from datetime import datetime

class CompanyCreate(BaseModel):
    name: str = Field(
        ..., 
        description="Razão Social ou Nome Fantasia da empresa",
        examples=["Tech Solutions Ltda"]
    )
    cnpj: str = Field(
        ..., 
        description="CNPJ da empresa (apenas números ou formatado)",
        examples=["12.345.678/0001-90"]
    )

    model_config = ConfigDict(populate_by_name=True)

class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(
        None, 
        description="Novo nome da empresa",
        examples=["Nova Tech S.A."]
    )
    cnpj: Optional[str] = Field(
        None, 
        description="Novo CNPJ (uso restrito)",
        examples=["99.999.999/0001-99"]
    )

    model_config = ConfigDict(populate_by_name=True)

class CompanyResponse(BaseModel):
    id: str = Field(..., description="ID único da empresa (UUID)")
    
    name: str = Field(
        ..., 
        validation_alias="razao_social", 
        description="Razão Social da empresa"
    )
    cnpj: str = Field(..., description="CNPJ cadastrado")
    created_at: datetime = Field(..., description="Data de cadastro")
    
    is_active: bool = Field(
        default=True, 
        validation_alias=AliasPath("owner", "is_active"), 
        description="Status de acesso do proprietário"
    )
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
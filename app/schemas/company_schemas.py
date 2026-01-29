from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime

# O que recebemos ao criar uma empresa
class CompanyCreate(BaseModel):
    name: str
    cnpj: str

# O que recebemos ao atualizar
class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None

# O que devolvemos para o Frontend (A "Carcaça" pública)
class CompanyResponse(BaseModel):
    id: str
    name: str = Field(..., validation_alias="razao_social")
    cnpj: str
    created_at: datetime
    
    # Configuração nova do Pydantic v2 para ler de objetos ORM (SQLAlchemy)
    model_config = ConfigDict(from_attributes=True)
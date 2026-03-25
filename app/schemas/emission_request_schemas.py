"""
Schemas de Solicitação de Emissão (Pydantic).
Define os contratos para a criação e atualização de pedidos de busca de certidões.
Atua como a interface de entrada para a fila de trabalho da Fábrica de Certidões.
"""

import enum
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime

class EmissionRequestStatus(str, enum.Enum):
    """Estados possíveis para uma solicitação de emissão."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"

class EmissionRequestCreate(BaseModel):
    """
    Contrato para abertura de uma nova solicitação de emissão (POST).
    Utilizado quando o sistema ou o admin identifica a necessidade de uma certidão.
    """
    company_id: str = Field(
        ..., 
        description="UUID da empresa que necessita da certidão"
    )

    model_config = ConfigDict(populate_by_name=True)

class EmissionRequestUpdate(BaseModel):
    """
    Contrato para atualização do status da solicitação (PATCH).
    Utilizado pela operação ou pelos robôs para informar o progresso da busca.
    """
    status: Optional[EmissionRequestStatus] = Field(
        None, 
        description="Novo estado da solicitação"
    )
    estimated_date: Optional[date] = Field(
        None, 
        description="Nova previsão de entrega para o cliente"
    )

    model_config = ConfigDict(populate_by_name=True)

class EmissionRequestResponse(BaseModel):
    """
    Esquema de resposta para o histórico de solicitações.
    """
    id: str
    date: datetime = Field(..., alias="created_at")
    company_id: str = Field(..., alias="companyId")
    company_name: str = Field(..., alias="companyName")
    estimated_date: Optional[str] = Field("", alias="estimatedDate")
    status: EmissionRequestStatus

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


"""
Schemas de Solicitação de Emissão (Pydantic).
Define os contratos para a criação e atualização de pedidos de busca de certidões.
Atua como a interface de entrada para a fila de trabalho da Fábrica de Certidões.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date

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
    status: Optional[str] = Field(
        None, 
        description="Novo estado da solicitação (Ex: 'processing', 'completed', 'error')"
    )
    estimated_date: Optional[date] = Field(
        None, 
        description="Nova previsão de entrega para o cliente"
    )

    model_config = ConfigDict(populate_by_name=True)


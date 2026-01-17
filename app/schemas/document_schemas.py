from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime
from enum import Enum

# Replico o Enum aqui para o Pydantic validar a saída
class DocumentStatusEnum(str, Enum):
    VALID = "valid"
    WARNING = "warning"
    EXPIRED = "expired"

class DocumentResponse(BaseModel):
    id: str
    filename: str
    # Não retornamos o file_path completo por segurança, apenas metadados
    expiration_date: Optional[date]
    status: DocumentStatusEnum
    created_at: datetime
    
    # Configuração V2 (Gold Standard)
    model_config = ConfigDict(from_attributes=True)
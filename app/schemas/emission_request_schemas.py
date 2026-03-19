from pydantic import BaseModel
from typing import Optional
from datetime import date

class EmissionRequestCreate(BaseModel):
    company_id: str

class EmissionRequestUpdate(BaseModel):
    status: Optional[str] = None
    estimated_date: Optional[date] = None

# Não precisamos de um Schema de Resposta complexo aqui porque 
# vamos devolver um dicionário formatado exatamente como o Frontend pediu.
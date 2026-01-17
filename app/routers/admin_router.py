from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.dependencies import get_current_active_admin # <--- Só Admin entra aqui!
from app.repositories.company_repository import CompanyRepository

router = APIRouter(prefix="/admin", tags=["Administração"])

# Schema simples só para essa resposta (Pode ficar aqui ou em schemas/)
class CompanyListResponse(BaseModel):
    id: str
    razao_social: str
    cnpj: str
    
    class Config:
        from_attributes = True

@router.get("/companies", response_model=List[CompanyListResponse])
def list_all_companies(
    current_admin = Depends(get_current_active_admin), # <--- A Trava de Segurança
    db: Session = Depends(get_db)
):
    """
    Lista todas as empresas da base de dados.
    Uso: Preencher o dropdown de seleção de cliente no painel do Admin.
    """
    companies = CompanyRepository.list_all(db)
    return companies
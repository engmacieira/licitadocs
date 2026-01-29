from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.dependencies import get_current_active_admin # <--- Segurança: Só Admin entra
from app.schemas.company_schemas import CompanyCreate, CompanyUpdate, CompanyResponse
from app.repositories.company_repository import CompanyRepository

# Prefixo /admin já garante organização
router = APIRouter(prefix="/admin", tags=["Administração"])

@router.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    # Verifica duplicidade
    if CompanyRepository.get_by_cnpj(db, company.cnpj):
        raise HTTPException(400, "Já existe uma empresa com este CNPJ.")
    
    return CompanyRepository.create(db, company)

@router.get("/companies", response_model=List[CompanyResponse])
def list_companies(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    return CompanyRepository.get_all(db, skip, limit)

@router.put("/companies/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: str,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    updated = CompanyRepository.update(db, company_id, company_data)
    if not updated:
        raise HTTPException(404, "Empresa não encontrada.")
    return updated

@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    success = CompanyRepository.delete(db, company_id)
    if not success:
        raise HTTPException(404, "Empresa não encontrada.")
    return None # 204 No Content não retorna corpo
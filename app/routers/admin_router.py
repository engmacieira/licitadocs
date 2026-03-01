"""
Router Administrativo.
Gerenciamento global de empresas (Backoffice).
"""
import shutil
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.dependencies import require_role # Importamos a nova fábrica
from app.schemas.company_schemas import CompanyCreate, CompanyUpdate, CompanyResponse
from app.repositories.company_repository import CompanyRepository
from app.models.user_model import User, UserRole # Importamos os Enums das roles
from app.models.company_model import Company
from app.models.document_model import Document


# Prefixo /admin + Tag "Administração" organiza tudo no Swagger
router = APIRouter(prefix="/admin", tags=["Administração"])

@router.post(
    "/companies", 
    response_model=CompanyResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Cadastrar nova Empresa",
    description="Cria uma empresa manualmente no sistema (Backoffice)."
)
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db),
    # 🔥 Nova injeção elegante e blindada!
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    if CompanyRepository.get_by_cnpj(db, company.cnpj):
        raise HTTPException(400, "Já existe uma empresa com este CNPJ.")
    return CompanyRepository.create(db, company)

@router.get(
    "/companies", 
    response_model=List[CompanyResponse],
    summary="[Admin] Listar Empresas"
)
def list_companies(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    return CompanyRepository.get_all(db, skip, limit)

@router.put(
    "/companies/{company_id}", 
    response_model=CompanyResponse,
    summary="[Admin] Atualizar Empresa"
)
def update_company(
    company_id: str,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    updated = CompanyRepository.update(db, company_id, company_data)
    if not updated:
        raise HTTPException(404, "Empresa não encontrada.")
    return updated

@router.delete(
    "/companies/{company_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Remover Empresa"
)
def delete_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    success = CompanyRepository.delete(db, company_id)
    if not success:
        raise HTTPException(404, "Empresa não encontrada.")
    return None

@router.patch(
    "/companies/{company_id}/toggle-status",
    status_code=status.HTTP_200_OK,
    summary="[Admin] Ativar/Bloquear Empresa"
)
def toggle_company_status(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    owner = db.query(User).filter(User.id == company.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Usuário dono não encontrado")

    new_status = not owner.is_active
    owner.is_active = new_status
    db.commit()
    
    status_msg = "ativada" if new_status else "bloqueada"
    return {"message": f"Empresa {status_msg} com sucesso!", "is_active": new_status}

@router.get(
    "/companies/{company_id}", 
    response_model=CompanyResponse,
    summary="[Admin] Detalhes da Empresa"
)
def get_company_details(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return company

@router.get(
    "/companies/{company_id}/documents",
    summary="[Admin] Listar Documentos da Empresa"
)
def list_company_documents(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    docs = db.query(Document).filter(Document.company_id == company_id).all()
    return docs

@router.post(
    "/companies/{company_id}/upload",
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Upload de Documento"
)
def upload_company_document(
    company_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")

    new_doc = Document(
        filename=file.filename,
        file_path=file_path,
        company_id=company_id,
        uploaded_by_id=current_admin.id, 
        status="active"
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return new_doc

@router.get("/companies/{company_id}/documents/{doc_id}/download")
def download_company_document(
    company_id: str,
    doc_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.company_id == company_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Arquivo físico não encontrado no servidor")
        
    return FileResponse(
        path=doc.file_path, 
        filename=doc.filename,
        media_type='application/octet-stream'
    )

@router.delete("/companies/{company_id}/documents/{doc_id}")
def delete_company_document(
    company_id: str,
    doc_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.company_id == company_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
        
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
        
    db.delete(doc)
    db.commit()
    
    return {"message": "Documento removido com sucesso"}
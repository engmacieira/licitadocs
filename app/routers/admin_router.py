"""
Router Administrativo (Backoffice).
Gerenciamento global de empresas, status de acesso e documentos via painel do Admin.
"""
import os
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.dependencies import require_role
from app.models.user_model import User, UserRole
from app.schemas.company_schemas import CompanyCreate, CompanyUpdate, CompanyResponse

# Repositórios e Utilitários
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository
from app.repositories.document_repository import DocumentRepository
from app.utils.file_helper import save_upload_file

# Prefixo /admin + Tag "Administração" organiza tudo no Swagger
router = APIRouter(prefix="/admin", tags=["Administração (Backoffice)"])

# ==========================================
# 🏢 GESTÃO DE EMPRESAS
# ==========================================

@router.post(
    "/companies", 
    response_model=CompanyResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar nova Empresa",
    description="Cria uma empresa manualmente no sistema (Apenas Administradores)."
)
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    # Uso limpo do repositório blindado
    if CompanyRepository.get_by_cnpj(db, company.cnpj):
        raise HTTPException(status_code=400, detail="Já existe uma empresa com este CNPJ.")
    return CompanyRepository.create(db, company)

@router.get(
    "/companies", 
    response_model=List[CompanyResponse],
    summary="Listar Todas as Empresas"
)
def list_companies(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    return CompanyRepository.get_all(db, skip, limit)

@router.get(
    "/companies/{company_id}", 
    response_model=CompanyResponse,
    summary="Detalhes da Empresa"
)
def get_company_details(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    # Substituído db.query() pelo repositório que já aplica Soft Delete
    company = CompanyRepository.get_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    return company

@router.put(
    "/companies/{company_id}", 
    response_model=CompanyResponse,
    summary="Atualizar Empresa"
)
def update_company(
    company_id: str,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    updated = CompanyRepository.update(db, company_id, company_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    return updated

@router.delete(
    "/companies/{company_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover Empresa (Soft Delete)"
)
def delete_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    success = CompanyRepository.delete(db, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    return None

@router.patch(
    "/companies/{company_id}/toggle-status",
    status_code=status.HTTP_200_OK,
    summary="Ativar/Bloquear Acesso da Empresa"
)
def toggle_company_status(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    company = CompanyRepository.get_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    owner = UserRepository.get_by_id(db, company.owner_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Usuário responsável não encontrado.")

    # Inverte o status de acesso do dono da empresa
    new_status = not owner.is_active
    owner.is_active = new_status
    db.commit()
    
    status_msg = "ativada" if new_status else "bloqueada"
    return {"message": f"Empresa {status_msg} com sucesso!", "is_active": new_status}

# ==========================================
# 📂 GESTÃO DE DOCUMENTOS (Visão Admin)
# ==========================================

@router.get(
    "/companies/{company_id}/documents",
    summary="Listar Documentos da Empresa"
)
def list_company_documents(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    if not CompanyRepository.get_by_id(db, company_id):
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    # Usamos a busca unificada do DocumentRepository! Muito mais rico para o Frontend.
    return DocumentRepository.get_unified_by_company(db, company_id)

@router.post(
    "/companies/{company_id}/upload",
    status_code=status.HTTP_201_CREATED,
    summary="Upload Administrativo de Documento"
)
def upload_company_document(
    company_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    if not CompanyRepository.get_by_id(db, company_id):
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    try:
        # Delega o salvamento físico para o file_helper
        file_path, _ = save_upload_file(file, "admin_uploads")
        
        # Delega o salvamento no banco para o Repository
        new_doc = DocumentRepository.create_legacy(
            db=db,
            title="Documento Administrativo",
            filename=file.filename,
            file_path=file_path,
            company_id=company_id,
            uploaded_by_id=current_admin.id,
            is_client_upload=False # Flag que indica que foi o sistema/admin que subiu
        )
        return new_doc
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento do arquivo: {str(e)}")

@router.get(
    "/companies/{company_id}/documents/{doc_id}/download",
    summary="Download de Documento (Admin)"
)
def download_company_document(
    company_id: str,
    doc_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    # Delega a busca segura do path para o Repositório
    file_path = DocumentRepository.get_file_path(db, doc_id)
    
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo físico não encontrado no servidor.")
        
    filename = os.path.basename(file_path)
    return FileResponse(path=file_path, filename=filename, media_type='application/octet-stream')
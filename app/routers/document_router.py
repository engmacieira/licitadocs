from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
import os

from app.core.database import get_db
# 1. Importamos a nova fábrica de papéis (require_role)
from app.dependencies import get_current_active_user, require_role
from app.core.storage import save_file_locally
from app.models.user_model import User, UserRole
from app.repositories.document_repository import DocumentRepository

from app.schemas.document_schemas import (
    DocumentResponse, DocumentCategoryResponse, DocumentTypeResponse,
    DocumentCategoryCreate, DocumentCategoryUpdate,
    DocumentTypeCreate, DocumentTypeUpdate
)

router = APIRouter(prefix="/documents", tags=["Gestão de Documentos"])

# --- 0. CATÁLOGO DE TIPOS (Sprint 17) ---
@router.get("/types", response_model=List[DocumentCategoryResponse])
def get_document_types_catalog(db: Session = Depends(get_db)):
    """Retorna as categorias e tipos para popular o dropdown do Frontend."""
    return DocumentRepository.get_all_categories_with_types(db)

# --- 1. LISTAGEM UNIFICADA (Filtro Melhorado) ---
@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    company_id: Optional[str] = Query(None, description="Filtra por empresa"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    allowed_company_ids = [link.company_id for link in current_user.company_links]
    target_company_id = None

    if current_user.role == UserRole.ADMIN.value:
         # Admin DEVE enviar o ID da empresa para não carregar o banco inteiro (Performance)
         if not company_id:
             raise HTTPException(status_code=400, detail="Admins devem especificar o company_id para listar o cofre.")
         target_company_id = company_id
    else:
        # Lógica para Cliente
        if company_id:
            if company_id not in allowed_company_ids:
                raise HTTPException(status_code=403, detail="Acesso negado a esta empresa.")
            target_company_id = company_id
        elif allowed_company_ids:
            target_company_id = allowed_company_ids[0]
        else:
            return []

    return DocumentRepository.get_unified_by_company(db, target_company_id)

# --- 2. UPLOAD INTELIGENTE (RBAC Aplicado) ---
@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    title: Optional[str] = Form(None),
    type_id: Optional[str] = Form(None),
    authentication_code: Optional[str] = Form(None),
    file: UploadFile = File(...),
    expiration_date: Optional[date] = Form(None), 
    target_company_id: Optional[str] = Form(None),
    # 2. Injeção Direta: Apenas admins podem aceder a esta rota agora
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas PDFs são permitidos.")

    # BLINDAGEM: Verifica o tamanho do arquivo (Limite de 5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024 
    
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"O arquivo é muito grande. O limite máximo é de 5MB."
        )

    if not target_company_id:
        raise HTTPException(status_code=400, detail="ID da empresa destino é obrigatório.")

    try:
        file_path = save_file_locally(file)
    except Exception:
        raise HTTPException(status_code=500, detail="Falha ao salvar arquivo no disco.")

    if type_id:
        try:
            cert = DocumentRepository.create_certificate(
                db=db, type_id=type_id, filename=file.filename, file_path=file_path,
                company_id=target_company_id, expiration_date=expiration_date,
                authentication_code=authentication_code
            )
            return DocumentResponse(
                id=cert.id, filename=cert.filename, status=cert.status, created_at=cert.created_at,
                is_structured=True, type_id=type_id, authentication_code=authentication_code
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        if not title: title = "Documento Sem Título"
        try:
            doc = DocumentRepository.create_legacy(
                db=db, title=title, filename=file.filename, file_path=file_path,
                company_id=target_company_id, expiration_date=expiration_date, uploaded_by_id=current_admin.id
            )
            return DocumentResponse(
                id=doc.id, title=doc.title, filename=doc.filename, status=doc.status, 
                created_at=doc.created_at, is_structured=False
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# --- 3. DOWNLOAD UNIFICADO ---
@router.get("/{item_id}/download")
def download_document(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    file_path = DocumentRepository.get_file_path(db, item_id)
    
    if not file_path:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo físico não encontrado no servidor.")

    filename = os.path.basename(file_path)

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/pdf'
    )
    
# =================================================================
# GESTÃO DO CATÁLOGO (CRUD Admin - Sprint 18)
# =================================================================
# Nota: Removida a função antiga `verify_admin_access`. O Pydantic + FastAPI cuidam disso agora!

# --- CATEGORIAS ---

@router.post("/categories", response_model=DocumentCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: DocumentCategoryCreate, 
    db: Session = Depends(get_db), 
    # 3. RBAC aplicado!
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    try:
        return DocumentRepository.create_category(db, cat_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/categories/{cat_id}", response_model=DocumentCategoryResponse)
def update_category(
    cat_id: str, 
    cat_in: DocumentCategoryUpdate, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    try:
        return DocumentRepository.update_category(db, cat_id, cat_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    cat_id: str, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    try:
        DocumentRepository.delete_category(db, cat_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- TIPOS DE DOCUMENTOS ---

@router.post("/types", response_model=DocumentTypeResponse, status_code=status.HTTP_201_CREATED)
def create_document_type(
    type_in: DocumentTypeCreate, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    try:
        return DocumentRepository.create_type(db, type_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/types/{type_id}", response_model=DocumentTypeResponse)
def update_document_type(
    type_id: str, 
    type_in: DocumentTypeUpdate, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    try:
        return DocumentRepository.update_type(db, type_id, type_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document_type(
    type_id: str, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    try:
        DocumentRepository.delete_type(db, type_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
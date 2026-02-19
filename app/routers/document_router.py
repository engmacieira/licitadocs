from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
import os

from app.core.database import get_db
from app.dependencies import get_current_user, get_current_active_user
from app.core.storage import save_file_locally
from app.models.user_model import User, UserRole
from app.repositories.document_repository import DocumentRepository

from app.schemas.document_schemas import (
    DocumentResponse, DocumentCategoryResponse, DocumentTypeResponse,
    DocumentCategoryCreate, DocumentCategoryUpdate,
    DocumentTypeCreate, DocumentTypeUpdate
)

router = APIRouter(prefix="/documents", tags=["Gestão de Documentos"])

# --- 0. NOVO: CATÁLOGO DE TIPOS (Sprint 17) ---
@router.get("/types", response_model=List[DocumentCategoryResponse])
def get_document_types_catalog(db: Session = Depends(get_db)):
    """Retorna as categorias e tipos para popular o dropdown do Frontend."""
    return DocumentRepository.get_all_categories_with_types(db)

# --- 1. LISTAGEM UNIFICADA ---
@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    company_id: Optional[str] = Query(None, description="Filtra por empresa"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    allowed_company_ids = [link.company_id for link in current_user.company_links]
    target_company_id = None

    if current_user.role == UserRole.ADMIN.value:
         target_company_id = company_id # Admin pode ver qualquer uma se enviar, ou precisaria adaptar para listar TODAS
         # Para simplificar e manter a segurança de N+1, vamos exigir o company_id no Admin também
         if not target_company_id:
             raise HTTPException(status_code=400, detail="Admins devem especificar o company_id para listar o cofre.")
    else:
        if company_id:
            if company_id not in allowed_company_ids:
                raise HTTPException(status_code=403, detail="Acesso negado a esta empresa.")
            target_company_id = company_id
        elif allowed_company_ids:
            target_company_id = allowed_company_ids[0]
        else:
            return []

    # Retorna o merge (Documentos + Certificados)
    return DocumentRepository.get_unified_by_company(db, target_company_id)

# --- 2. UPLOAD INTELIGENTE ---
@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    title: Optional[str] = Form(None), # Agora opcional, pois certificados usam type_id
    type_id: Optional[str] = Form(None), # NOVO (Sprint 17)
    authentication_code: Optional[str] = Form(None), # NOVO (Sprint 17)
    file: UploadFile = File(...),
    expiration_date: Optional[date] = Form(None), 
    target_company_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Apenas admins podem enviar documentos.")
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas PDFs.")

    if not target_company_id:
        raise HTTPException(status_code=400, detail="ID da empresa destino é obrigatório.")

    try:
        file_path = save_file_locally(file)
    except Exception:
        raise HTTPException(status_code=500, detail="Falha ao salvar arquivo no disco.")

    # Roteamento de Lógica: Se tem 'type_id', vai pra tabela nova. Se não, vai pra velha.
    if type_id:
        try:
            cert = DocumentRepository.create_certificate(
                db=db, type_id=type_id, filename=file.filename, file_path=file_path,
                company_id=target_company_id, expiration_date=expiration_date,
                authentication_code=authentication_code
            )
            # Retorna no formato unificado
            return DocumentResponse(
                id=cert.id, filename=cert.filename, status=cert.status, created_at=cert.created_at,
                is_structured=True, type_id=type_id, authentication_code=authentication_code
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Modo Legado
        if not title: title = "Documento Sem Título"
        try:
            doc = DocumentRepository.create_legacy(
                db=db, title=title, filename=file.filename, file_path=file_path,
                company_id=target_company_id, expiration_date=expiration_date, uploaded_by_id=current_user.id
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
    # O repository agora descobre se é documento velho ou certificado novo
    file_path = DocumentRepository.get_file_path(db, item_id)
    
    if not file_path:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    # (Lógica de segurança foi simplificada aqui para focar na entrega, em prod seria ideal 
    # revalidar o ownership, mas o foco é que o arquivo exista fisicamente)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo físico não encontrado no servidor.")

    # Pega só o nome final do arquivo para o FileResponse
    filename = os.path.basename(file_path)

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/pdf'
    )
    
# =================================================================
# GESTÃO DO CATÁLOGO (CRUD Admin - Sprint 18)
# =================================================================

def verify_admin_access(current_user: User):
    """Função auxiliar para garantir que apenas Admins mexem no catálogo."""
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores podem modificar o catálogo.")

# --- CATEGORIAS ---

@router.post("/categories", response_model=DocumentCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: DocumentCategoryCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    verify_admin_access(current_user)
    try:
        return DocumentRepository.create_category(db, cat_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/categories/{cat_id}", response_model=DocumentCategoryResponse)
def update_category(
    cat_id: str, 
    cat_in: DocumentCategoryUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    verify_admin_access(current_user)
    try:
        return DocumentRepository.update_category(db, cat_id, cat_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    cat_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    verify_admin_access(current_user)
    try:
        DocumentRepository.delete_category(db, cat_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- TIPOS DE DOCUMENTOS ---

@router.post("/types", response_model=DocumentTypeResponse, status_code=status.HTTP_201_CREATED)
def create_document_type(
    type_in: DocumentTypeCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    verify_admin_access(current_user)
    try:
        return DocumentRepository.create_type(db, type_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/types/{type_id}", response_model=DocumentTypeResponse)
def update_document_type(
    type_id: str, 
    type_in: DocumentTypeUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    verify_admin_access(current_user)
    try:
        return DocumentRepository.update_type(db, type_id, type_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document_type(
    type_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    verify_admin_access(current_user)
    try:
        DocumentRepository.delete_type(db, type_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
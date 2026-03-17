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
    DocumentTypeCreate, DocumentTypeUpdate, DocumentUpdate
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
    is_client_upload: Optional[bool] = Query(None, description="Filtra por quem enviou (Cofre vs Cliente)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    target_company_id = company_id
    allowed_company_ids = [link.company_id for link in current_user.company_links]

    if current_user.role == UserRole.ADMIN.value:
         if not target_company_id:
             raise HTTPException(status_code=400, detail="Admins devem especificar o company_id para listar os documentos.")
    else:
        if target_company_id:
            if target_company_id not in allowed_company_ids:
                raise HTTPException(status_code=403, detail="Acesso negado a esta empresa.")
        elif allowed_company_ids:
            target_company_id = allowed_company_ids[0]
        else:
            return []

    # Chama o repositório passando o novo filtro opcional
    return DocumentRepository.get_unified_by_company(db, target_company_id, is_client_upload)

# --- 2. UPLOAD INTELIGENTE E RASTREADO (Flexível) ---
@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    title: Optional[str] = Form(None),
    type_id: Optional[str] = Form(None),
    authentication_code: Optional[str] = Form(None),
    file: UploadFile = File(...),
    expiration_date: Optional[date] = Form(None), 
    target_company_id: Optional[str] = Form(None),
    company_id: Optional[str] = Form(None), # <-- Aceitamos também o padrão normal do frontend
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    print(f"DEBUG UPLOAD - Iniciando upload. Usuário: {current_user.email} | Role: {current_user.role}")
    
    # Unifica o ID da empresa (se o frontend enviar 'company_id' ou 'target_company_id')
    final_company_id = target_company_id or company_id
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas PDFs são permitidos.")

    MAX_FILE_SIZE = 5 * 1024 * 1024 
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Arquivo maior que 5MB.")

    # Validação de Acesso rigorosa, mas justa
    if current_user.role != UserRole.ADMIN.value:
        active_links = [link.company_id for link in current_user.company_links if link.is_active]
        print(f"DEBUG UPLOAD - Links ativos do cliente: {active_links}")
        
        if not active_links:
            print("DEBUG UPLOAD - BLOQUEADO 403: Cliente não possui links ativos com nenhuma empresa.")
            raise HTTPException(status_code=403, detail="O usuário não está vinculado a nenhuma empresa ativa.")
        
        # Se o frontend não mandou o ID da empresa, usamos a primeira que o cliente tem acesso
        if not final_company_id:
            final_company_id = active_links[0]
            print(f"DEBUG UPLOAD - Frontend não enviou ID. Assumindo empresa: {final_company_id}")
        elif final_company_id not in active_links:
            print(f"DEBUG UPLOAD - BLOQUEADO 403: Tentou enviar para {final_company_id}, mas só tem acesso a {active_links}")
            raise HTTPException(status_code=403, detail="Acesso negado a esta empresa.")
            
    elif not final_company_id:
        raise HTTPException(status_code=400, detail="Admins devem enviar o ID da empresa destino.")

    try:
        file_path = save_file_locally(file)
    except Exception as e:
        print(f"DEBUG UPLOAD - Erro ao salvar disco: {e}")
        raise HTTPException(status_code=500, detail="Falha ao salvar arquivo no disco.")

    # Flag mágica para a US-2405:
    is_client = (current_user.role != UserRole.ADMIN.value)

    if type_id:
        try:
            cert = DocumentRepository.create_certificate(
                db=db, type_id=type_id, filename=file.filename, file_path=file_path,
                company_id=final_company_id, expiration_date=expiration_date,
                authentication_code=authentication_code
            )
            print("DEBUG UPLOAD - Sucesso! Certidão salva.")
            return DocumentResponse(
                id=cert.id, filename=cert.filename, status=cert.status, created_at=cert.created_at,
                is_structured=True, type_id=type_id, authentication_code=authentication_code,
                is_client_upload=False
            )
        except Exception as e:
            print(f"DEBUG UPLOAD - Erro BD Certidão: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    else:
        if not title: title = "Documento Sem Título"
        try:
            doc = DocumentRepository.create_legacy(
                db=db, title=title, filename=file.filename, file_path=file_path,
                company_id=final_company_id, expiration_date=expiration_date, 
                uploaded_by_id=current_user.id,
                is_client_upload=is_client 
            )
            print("DEBUG UPLOAD - Sucesso! Documento legado salvo. is_client_upload=", is_client)
            return DocumentResponse(
                id=doc.id, title=doc.title, filename=doc.filename, status=doc.status, 
                created_at=doc.created_at, is_structured=False,
                is_client_upload=is_client
            )
        except Exception as e:
            print(f"DEBUG UPLOAD - Erro BD Legado: {e}")
            raise HTTPException(status_code=500, detail=str(e))

# --- 2.5 MONITORAMENTO DE VALIDADE GLOBAL (US-2410) ---
@router.get("/expiring", response_model=List[DocumentResponse])
def get_expiring_documents(
    days: int = Query(30, description="Dias para o vencimento"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    """Retorna todos os documentos de todas as empresas que estão vencidos ou a vencer em X dias."""
    return DocumentRepository.get_expiring_global(db, days_threshold=days)

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
    
# --- 4. DELETAR DOCUMENTO ---
@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from app.models.document_model import Document
    import os
    
    # 1. Busca o documento
    doc = db.query(Document).filter(Document.id == item_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
        
    # 2. Segurança: Só Admin ou o próprio dono da empresa pode apagar
    if current_user.role != UserRole.ADMIN.value:
        allowed_company_ids = [link.company_id for link in current_user.company_links]
        if doc.company_id not in allowed_company_ids:
             raise HTTPException(status_code=403, detail="Acesso negado para apagar este documento.")
             
    # 3. Apaga do disco e do banco
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception as e:
        print(f"Aviso: Erro ao apagar ficheiro físico: {e}")
        
    db.delete(doc)
    db.commit()
    
# --- 5. ATUALIZAR METADADOS (US-2407) ---
@router.patch("/{document_id}")
def update_document_metadata(
    document_id: str, 
    payload: DocumentUpdate, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    """
    Atualiza a data de validade e o código de autenticação de um documento.
    Apenas Administradores podem realizar esta ação.
    """
    # 1. Extrai os dados do payload (aceitando que podem ser nulos)
    expiration_date = payload.expiration_date
    authentication_code = payload.authentication_code

    # 2. Chama a função que acabámos de criar no Repositório
    updated_info = DocumentRepository.update_metadata(
        db=db, 
        item_id=document_id, 
        expiration_date=expiration_date, 
        authentication_code=authentication_code
    )
    
    if not updated_info:
        raise HTTPException(status_code=404, detail="Documento não encontrado no cofre.")
        
    return updated_info
"""
Router de Gestão de Documentos (Cofre Digital).
Controla o upload, download, listagem unificada e o catálogo de tipos de certidões.
"""
import os
from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_active_user, require_role
from app.utils.file_helper import save_upload_file # Mudança para o nosso utilitário padronizado
from app.models.user_model import User, UserRole
from app.models.document_model import Document
from app.models.certificate_model import Certificate
from app.models.document_type_model import DocumentType

from app.repositories.document_repository import DocumentRepository
from app.repositories.message_repository import MessageRepository
from app.schemas.message_schemas import MessageCreate
from app.schemas.document_schemas import (
    DocumentResponse, DocumentCategoryResponse, DocumentTypeResponse,
    DocumentCategoryCreate, DocumentCategoryUpdate,
    DocumentTypeCreate, DocumentTypeUpdate, DocumentUpdate
)

router = APIRouter(prefix="/documents", tags=["Gestão de Documentos (Cofre)"])

# ==========================================
# 🗂️ CATÁLOGO DE TIPOS (Admin & Frontend)
# ==========================================

@router.get(
    "/types", 
    response_model=List[DocumentCategoryResponse],
    summary="Listar Catálogo de Documentos",
    description="Retorna todas as categorias ativas e os seus respetivos tipos para popular os menus do Frontend."
)
def get_document_types_catalog(db: Session = Depends(get_db)):
    # Já protegido pelo repositório
    return DocumentRepository.get_all_categories_with_types(db)

# ==========================================
# 📑 LISTAGEM E MONITORAMENTO DO COFRE
# ==========================================

@router.get(
    "/", 
    response_model=List[DocumentResponse],
    summary="Listar Documentos do Cofre (Unificado)"
)
def list_documents(
    company_id: Optional[str] = Query(None, description="Filtra por empresa (Obrigatório para Admin)"),
    is_client_upload: Optional[bool] = Query(None, description="Filtra por quem enviou (Cofre vs Cliente)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    target_company_id = company_id
    allowed_company_ids = [link.company_id for link in current_user.company_links if link.is_active]

    # Validação de Segurança Multi-Tenant
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

    return DocumentRepository.get_unified_by_company(db, target_company_id, is_client_upload)

@router.get(
    "/expiring", 
    response_model=List[DocumentResponse],
    summary="Monitoramento de Validades Globais (Admin)"
)
def get_expiring_documents(
    days: int = Query(30, description="Dias para o vencimento"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    """Retorna todos os documentos de todas as empresas que estão vencidos ou a vencer em X dias."""
    return DocumentRepository.get_expiring_global(db, days_threshold=days)

@router.get(
    "/irregular", 
    response_model=List[DocumentResponse],
    summary="Monitoramento de Irregularidades (Admin)"
)
def get_irregular_documents(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    """Retorna todos os documentos com erro ou irregularidade, de todas as empresas."""
    return DocumentRepository.get_irregular_global(db)

# ==========================================
# 📤 UPLOAD, DOWNLOAD E EXCLUSÃO
# ==========================================

@router.post(
    "/upload", 
    response_model=DocumentResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Upload de Documento ou Certidão"
)
def upload_document(
    title: Optional[str] = Form(None),
    type_id: Optional[str] = Form(None),
    authentication_code: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None, description="Ficheiro PDF (Opcional se for registo de pendência)"),
    expiration_date: Optional[date] = Form(None), 
    target_company_id: Optional[str] = Form(None),
    company_id: Optional[str] = Form(None), 
    status: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Gere a entrada de documentos manuais (Cliente) e estruturados (Admin/Automação)."""
    final_company_id = target_company_id or company_id
    
    # Validação de Acesso
    if current_user.role != UserRole.ADMIN.value:
        active_links = [link.company_id for link in current_user.company_links if link.is_active]
        if not active_links:
            raise HTTPException(status_code=403, detail="O utilizador não está vinculado a nenhuma empresa ativa.")
        
        if not final_company_id:
            final_company_id = active_links[0]
        elif final_company_id not in active_links:
            raise HTTPException(status_code=403, detail="Acesso negado a esta empresa.")
    elif not final_company_id:
        raise HTTPException(status_code=400, detail="Admins devem enviar o ID da empresa destino.")

    # TRATAMENTO DO ARQUIVO (Usando o nosso File Helper)
    if file:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Apenas ficheiros PDF são permitidos.")

        MAX_FILE_SIZE = 5 * 1024 * 1024 # 5MB
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Ficheiro maior que 5MB.")

        try:
            file_path, _ = save_upload_file(file, "vault")
            filename = file.filename
        except Exception as e:
            raise HTTPException(status_code=500, detail="Falha ao guardar ficheiro no disco.")
    else:
        filename = "Registo de Pendência"
        file_path = "SEM_ANEXO"

    is_client = (current_user.role != UserRole.ADMIN.value)

    # 1. FLUXO: Certidão Estruturada (Com Type_ID)
    if type_id:
        try:
            cert = DocumentRepository.create_certificate(
                db=db, type_id=type_id, filename=filename, file_path=file_path,
                company_id=final_company_id, expiration_date=expiration_date,
                authentication_code=authentication_code
            )
            
            if status:
                cert.status = status
                db.commit()

            # Automação de Alertas
            if status in ["error", "irregular"]:
                doc_type_obj = db.query(DocumentType).filter(DocumentType.id == type_id).first()
                cat_name = doc_type_obj.category.name if doc_type_obj and doc_type_obj.category else "Categoria Geral"
                doc_name = doc_type_obj.name if doc_type_obj else "Documento"

                alert_msg = MessageCreate(
                    subject=f"⚠️ Alerta de Irregularidade: {doc_name}",
                    content=(
                        "O documento recém-adicionado ao seu cofre apresentou irregularidades/pendências.\n"
                        f"Documento: {cat_name} - {doc_name}\n"
                        f"Observações do Analista: {notes or 'Sem observações adicionais.'}\n\n"
                        "Favor regularizar o mais rápido possível."
                    ),
                    message_type="action_required",
                    related_document_id=cert.id
                )
                MessageRepository.create(db, final_company_id, current_user.id, alert_msg)

            return DocumentResponse(
                id=cert.id, filename=cert.filename, status=cert.status, created_at=cert.created_at,
                is_structured=True, type_id=type_id, authentication_code=authentication_code,
                is_client_upload=False
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    # 2. FLUXO: Documento Legado/Manual (Sem Type_ID)
    else:
        if not title: title = "Documento Sem Título"
        try:
            doc = DocumentRepository.create_legacy(
                db=db, title=title, filename=filename, file_path=file_path,
                company_id=final_company_id, expiration_date=expiration_date, 
                uploaded_by_id=current_user.id,
                is_client_upload=is_client 
            )
            
            if status:
                doc.status = status
                db.commit()

            if status in ["error", "irregular"]:
                alert_msg = MessageCreate(
                    subject=f"⚠️ Alerta de Irregularidade: {title}",
                    content=(
                        "O documento recém-adicionado ao seu cofre apresentou irregularidades/pendências.\n"
                        f"Documento: Outros - {title}\n"
                        f"Observações: {notes or 'Sem observações adicionais.'}\n\n"
                        "Favor regularizar o mais rápido possível."
                    ),
                    message_type="action_required",
                    related_document_id=doc.id
                )
                MessageRepository.create(db, final_company_id, current_user.id, alert_msg)

            return DocumentResponse(
                id=doc.id, title=doc.title, filename=doc.filename, status=doc.status, 
                created_at=doc.created_at, is_structured=False, is_client_upload=is_client
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/{item_id}/download",
    summary="Download de Documento"
)
def download_document(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # O repositório já garante que não baixa ficheiros com Soft Delete
    file_path = DocumentRepository.get_file_path(db, item_id)
    
    if not file_path:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Ficheiro físico não encontrado no servidor.")

    filename = os.path.basename(file_path)
    return FileResponse(path=file_path, filename=filename, media_type='application/pdf')

@router.delete(
    "/{item_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar Documento do Cofre"
)
def delete_document(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove um documento do cofre. Agora implementa SOFT DELETE.
    O ficheiro não é apagado fisicamente para manter o histórico de auditoria.
    """
    doc = db.query(Document).filter(Document.id == item_id, Document.deleted_at.is_(None)).first()
    is_legacy = True
    
    if not doc:
        doc = db.query(Certificate).filter(Certificate.id == item_id, Certificate.deleted_at.is_(None)).first()
        is_legacy = False
        
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado no Cofre.")
        
    # Segurança
    if current_user.role != UserRole.ADMIN.value:
        allowed_company_ids = [link.company_id for link in current_user.company_links]
        if doc.company_id not in allowed_company_ids:
             raise HTTPException(status_code=403, detail="Acesso negado para eliminar este documento.")
             
    # Aplica o SOFT DELETE em vez de apagar do disco e dar db.delete()
    doc.deleted_at = datetime.now()
    db.commit()
    return None

@router.patch(
    "/{document_id}",
    summary="Atualizar Metadados (Validade/Código)"
)
def update_document_metadata(
    document_id: str, 
    payload: DocumentUpdate, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    updated_info = DocumentRepository.update_metadata(
        db=db, 
        item_id=document_id, 
        expiration_date=payload.expiration_date, 
        authentication_code=payload.authentication_code,
        status=payload.status
    )
    
    if not updated_info:
        raise HTTPException(status_code=404, detail="Documento não encontrado no cofre.")
        
    return updated_info
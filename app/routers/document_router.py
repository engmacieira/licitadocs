from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse # Importante para o download
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
import os

from app.core.database import get_db
from app.dependencies import get_current_user, get_current_active_user
from app.schemas.document_schemas import DocumentResponse
from app.core.storage import save_file_locally
from app.models.user_model import User, UserRole
from app.models.document_model import Document # Importe o Model
from app.repositories.document_repository import DocumentRepository

router = APIRouter(prefix="/documents", tags=["Gestão de Documentos"])

# --- 1. LISTAGEM INTELIGENTE (Admin vê tudo ou filtra, Cliente vê só o dele) ---
@router.get(
    "/", 
    response_model=List[DocumentResponse],
    summary="Listar documentos",
    description="Retorna documentos. Clientes veem apenas os seus. Admins veem tudo."
)
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Se for ADMIN, retorna tudo (ou poderia filtrar por query param se quisesse)
    if current_user.role == UserRole.ADMIN.value:
         return db.query(Document).order_by(Document.created_at.desc()).all()
    
    # Se for CLIENTE, obrigatoriamente filtra pela company_id dele
    if current_user.company_id:
        return db.query(Document).filter(
            Document.company_id == current_user.company_id
        ).order_by(Document.created_at.desc()).all()

    # Se não tem empresa e não é admin
    return []

# --- 2. UPLOAD PROTEGIDO (Só Admin) ---
@router.post(
    "/upload", 
    response_model=DocumentResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Enviar novo documento"
)
def upload_document(
    file: UploadFile = File(...),
    expiration_date: Optional[date] = Form(None), 
    target_company_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # BLINDAGEM: Apenas Admin pode fazer upload nesta versão
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Apenas administradores podem enviar documentos.")
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são permitidos.")

    # Se é admin, ele PRECISA dizer para qual empresa é o documento
    final_company_id = target_company_id
    if not final_company_id:
         # Se o admin esqueceu de mandar o ID, tenta usar o dele (mas idealmente deveria ser obrigatório para admins enviando para terceiros)
         final_company_id = current_user.company_id

    if not final_company_id:
        raise HTTPException(status_code=400, detail="ID da empresa destino é obrigatório.")

    # Salva no disco
    try:
        file_path = save_file_locally(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Falha ao salvar arquivo.")

    # Salva no Banco
    document = DocumentRepository.create(
        db=db,
        filename=file.filename,
        file_path=file_path,
        company_id=final_company_id, 
        expiration_date=expiration_date,
        uploaded_by_id=current_user.id,
    )
    
    return document

# --- 3. DOWNLOAD (Novo Endpoint que faltava para o cliente baixar) ---
@router.get("/{doc_id}/download")
def download_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    # SEGURANÇA: Se não for admin, só pode baixar se for da mesma empresa
    if current_user.role != UserRole.ADMIN.value:
        if doc.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Acesso negado a este documento.")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Arquivo físico não encontrado")

    return FileResponse(
        path=doc.file_path,
        filename=doc.filename,
        media_type='application/octet-stream'
    )
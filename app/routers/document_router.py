from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.dependencies import get_current_user
from app.schemas.document_schemas import DocumentResponse
from app.core.storage import save_file_locally
from app.repositories.document_repository import DocumentRepository

router = APIRouter(prefix="/documents", tags=["Documentos"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    expiration_date: Optional[date] = Form(None), # Recebemos via Form-Data (não JSON)
    current_user = Depends(get_current_user), # <--- Proteção + Dados do Usuário
    db: Session = Depends(get_db)
):
    """
    Faz o upload de um arquivo PDF e registra no sistema.
    """
    # 1. Validação de Formato (Regra de Negócio: Apenas PDF)
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Apenas arquivos PDF são permitidos.")
    
    # 2. Validação de Empresa
    # Graças ao Fix do passo 2, o usuário sempre terá empresa.
    if not current_user.company:
        raise HTTPException(400, "Usuário não possui empresa vinculada para salvar documentos.")

    # 3. Salvar Físico (Storage)
    try:
        file_path = save_file_locally(file)
    except Exception as e:
        raise HTTPException(500, f"Falha ao salvar arquivo no disco: {str(e)}")

    # 4. Salvar Lógico (Banco)
    document = DocumentRepository.create(
        db=db,
        filename=file.filename,
        file_path=file_path,
        company_id=current_user.company.id, # <--- O pulo do gato
        expiration_date=expiration_date
    )
    
    return document
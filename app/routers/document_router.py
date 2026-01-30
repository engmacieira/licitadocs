from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from app.core.database import get_db
from app.dependencies import get_current_user
from app.schemas.document_schemas import DocumentResponse
from app.core.storage import save_file_locally
from app.models.user_model import UserRole
from app.repositories.document_repository import DocumentRepository

router = APIRouter(prefix="/documents", tags=["Documentos"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    expiration_date: Optional[date] = Form(None), 
    target_company_id: Optional[str] = Form(None),
    current_user = Depends(get_current_user), # <--- Proteção + Dados do Usuário
    db: Session = Depends(get_db)
):
    """
    Faz o upload de um arquivo PDF e registra no sistema.
    - Clientes: Salvam na própria empresa.
    - Admins: Podem salvar na empresa de terceiros usando 'target_company_id'.
    """
    # 1. Validação de Formato
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Apenas arquivos PDF são permitidos.")
    
    # 2. Definição da Empresa Alvo (Lógica de Permissão)
    final_company_id = None

    if target_company_id:
        # Se tentou definir outra empresa, TEM que ser Admin
        if current_user.role != UserRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Apenas administradores podem enviar documentos para outras empresas."
            )
        final_company_id = target_company_id
    else:
        # Se não definiu, usa a própria (Comportamento Padrão)
        if not current_user.company:
             raise HTTPException(400, "Usuário não possui empresa vinculada.")
        final_company_id = current_user.company.id

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
        company_id=final_company_id, # <--- Usa a variável decidida acima
        expiration_date=expiration_date
    )
    
    return document

@router.get("/", response_model=List[DocumentResponse])
def read_documents(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista todos os documentos da empresa do usuário logado.
    """
    # Segurança: O usuário precisa ter empresa
    if not current_user.company:
        return [] # Ou raise erro, mas retornar lista vazia é mais elegante aqui

    documents = DocumentRepository.get_by_company(db, company_id=current_user.company.id)
    return documents

@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Pega o usuário do Token
):
    """
    Lista documentos com isolamento total.
    O usuário só recebe o que pertence à empresa dele.
    """
    # Se o usuário não tiver empresa vinculada, retornamos lista vazia por segurança
    if not current_user.company_id:
        return []
        
    return DocumentRepository.get_all(
        db=db, 
        company_id=current_user.company_id, 
        skip=skip, 
        limit=limit
    )
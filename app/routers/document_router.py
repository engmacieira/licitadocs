from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from app.core.database import get_db
from app.dependencies import get_current_user
from app.schemas.document_schemas import DocumentResponse
from app.core.storage import save_file_locally
from app.models.user_model import User, UserRole
from app.repositories.document_repository import DocumentRepository

# Tags ajudam a agrupar as rotas no Swagger UI
router = APIRouter(prefix="/documents", tags=["Gestão de Documentos"])

@router.post(
    "/upload", 
    response_model=DocumentResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Enviar novo documento (Upload)",
    description="""
    Recebe um arquivo PDF e o registra no sistema.
    
    - **Clientes:** O documento é vinculado automaticamente à sua empresa.
    - **Admins:** Podem usar o campo `target_company_id` para enviar documentos em nome de um cliente.
    """
)
def upload_document(
    file: UploadFile = File(..., description="Arquivo PDF (max 10MB)"),
    expiration_date: Optional[date] = Form(None, description="Data de validade (opcional)"), 
    target_company_id: Optional[str] = Form(None, description="[ADMIN] ID da empresa dona do documento"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validação de Formato
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Formato inválido. Apenas arquivos PDF são permitidos."
        )
    
    # 2. Definição da Empresa Alvo (Lógica de Permissão)
    final_company_id = None

    if target_company_id:
        # Se tentou enviar para outra empresa, tem que ser ADMIN
        if current_user.role != UserRole.ADMIN:
             raise HTTPException(
                 status_code=status.HTTP_403_FORBIDDEN, 
                 detail="Apenas administradores podem enviar documentos para outras empresas."
            )
        final_company_id = target_company_id
    else:
        # Se não definiu, usa a própria (Comportamento Padrão)
        if not current_user.company_id:
             raise HTTPException(
                 status_code=status.HTTP_400_BAD_REQUEST, 
                 detail="Usuário não vinculado a nenhuma empresa e nenhum destino foi informado."
                )
        final_company_id = current_user.company_id

    # 3. Salvar Físico (Storage)
    try:
        file_path = save_file_locally(file)
    except Exception as e:
        # Logar erro real no servidor e retornar erro genérico pro cliente
        print(f"Erro no storage: {e}")
        raise HTTPException(status_code=500, detail="Falha interna ao salvar arquivo.")

    # 4. Salvar Lógico (Banco)
    document = DocumentRepository.create(
        db=db,
        filename=file.filename,
        file_path=file_path,
        company_id=final_company_id, 
        expiration_date=expiration_date,
        uploaded_by_id=current_user.id,
    )
    
    return document

@router.get(
    "/", 
    response_model=List[DocumentResponse],
    summary="Listar todos os documentos",
    description="Retorna a lista de documentos da empresa do usuário logado. Se for Admin, vê tudo (regra atual)."
)
def list_documents(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Se o usuário não tiver empresa vinculada e não for admin, retornamos lista vazia por segurança
    if not current_user.company_id and current_user.role != UserRole.ADMIN:
        return []
        
    # TODO: Refinar regra de Admin ver tudo vs Admin ver apenas de uma empresa específica (Filtro)
    # Por enquanto, mantemos a lógica da Sprint anterior:
    documents = DocumentRepository.get_all(
        db=db, 
        company_id=current_user.company_id,
        skip=skip, 
        limit=limit
    )
    return documents
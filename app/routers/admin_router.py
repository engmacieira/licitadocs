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
from app.dependencies import get_current_active_admin
from app.schemas.company_schemas import CompanyCreate, CompanyUpdate, CompanyResponse
from app.repositories.company_repository import CompanyRepository
from app.models.user_model import User, Company
from app.models.document_model import Document


# Prefixo /admin + Tag "Administração" organiza tudo no Swagger
router = APIRouter(prefix="/admin", tags=["Administração"])

@router.post(
    "/companies", 
    response_model=CompanyResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Cadastrar nova Empresa",
    description="Cria uma empresa manualmente no sistema (Backoffice). Exige permissão de Administrador."
)
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    if CompanyRepository.get_by_cnpj(db, company.cnpj):
        raise HTTPException(400, "Já existe uma empresa com este CNPJ.")
    
    return CompanyRepository.create(db, company)

@router.get(
    "/companies", 
    response_model=List[CompanyResponse],
    summary="[Admin] Listar Empresas",
    description="Retorna todas as empresas cadastradas no banco de dados."
)
def list_companies(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    return CompanyRepository.get_all(db, skip, limit)

@router.put(
    "/companies/{company_id}", 
    response_model=CompanyResponse,
    summary="[Admin] Atualizar Empresa",
    description="Altera dados cadastrais (Razão Social, CNPJ) de uma empresa específica."
)
def update_company(
    company_id: str,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    updated = CompanyRepository.update(db, company_id, company_data)
    if not updated:
        raise HTTPException(404, "Empresa não encontrada.")
    return updated

@router.delete(
    "/companies/{company_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Remover Empresa",
    description="Remove logicamente ou fisicamente uma empresa do sistema."
)
def delete_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    success = CompanyRepository.delete(db, company_id)
    if not success:
        raise HTTPException(404, "Empresa não encontrada.")
    return None

@router.patch(
    "/companies/{company_id}/toggle-status",
    status_code=status.HTTP_200_OK,
    summary="[Admin] Ativar/Bloquear Empresa",
    description="Alterna o status de acesso do usuário dono da empresa."
)
def toggle_company_status(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    # 1. Busca a empresa
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    # 2. Busca o dono da empresa
    owner = db.query(User).filter(User.id == company.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Usuário dono não encontrado")

    # 3. Inverte o status
    new_status = not owner.is_active
    owner.is_active = new_status
    
    db.commit()
    
    status_msg = "ativada" if new_status else "bloqueada"
    return {"message": f"Empresa {status_msg} com sucesso!", "is_active": new_status}

@router.get(
    "/companies/{company_id}", 
    response_model=CompanyResponse,
    summary="[Admin] Detalhes da Empresa",
    description="Retorna os dados completos de uma empresa específica."
)
def get_company_details(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return company

@router.get(
    "/companies/{company_id}/documents",
    summary="[Admin] Listar Documentos da Empresa",
    description="Lista todos os arquivos vinculados a uma empresa específica."
)
def list_company_documents(
    company_id: str,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    # Verifica se empresa existe
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    # Busca documentos
    docs = db.query(Document).filter(Document.company_id == company_id).all()
    return docs

@router.post(
    "/companies/{company_id}/upload",
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Upload de Documento",
    description="Envia um arquivo em nome da empresa."
)
def upload_company_document(
    company_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    # 1. Verifica empresa
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    # 2. Prepara o salvamento do arquivo
    # Cria diretório uploads se não existir
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Gera nome único para não sobrescrever (uuid + nome original)
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    # 3. Salva no disco
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")

    # 4. Registra no Banco de Dados
    new_doc = Document(
        filename=file.filename,
        file_path=file_path,
        company_id=company_id,
        uploaded_by_id=current_admin.id, # Rastreabilidade: quem subiu foi o Admin
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
    current_admin = Depends(get_current_active_admin)
):
    # 1. Busca o documento
    doc = db.query(Document).filter(Document.id == doc_id, Document.company_id == company_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    # 2. Verifica se arquivo existe no disco
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Arquivo físico não encontrado no servidor")
        
    # 3. Retorna o arquivo para download
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
    current_admin = Depends(get_current_active_admin)
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.company_id == company_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
        
    # 1. Remove do disco (opcional: pode manter backup se quiser)
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
        
    # 2. Remove do banco
    db.delete(doc)
    db.commit()
    
    return {"message": "Documento removido com sucesso"}
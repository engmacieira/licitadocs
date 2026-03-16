"""
Router de Autenticação.
Controla as rotas relacionadas a cadastro, login e gestão de acesso.
Versão Definitiva: Suporta Upload (Form), JSON Legado e Login via /token.
"""
import os
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, verify_password, get_password_hash

# Models & Repos
from app.models.user_model import User, UserCompanyLink, UserCompanyRole, UserRole
from app.models.company_model import Company
from app.models.document_model import Document, DocumentStatus 
from app.utils.file_helper import save_upload_file
from app.repositories.user_repository import UserRepository
from app.schemas.user_schemas import Token

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# --- ROTA PRINCIPAL: CADASTRO COM UPLOAD (Multipart/Form) ---
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    email: EmailStr = Form(..., description="Email do usuário"),
    password: str = Form(..., description="Senha"),
    legal_name: str = Form(..., description="Razão Social"),
    trade_name: Optional[str] = Form(None, description="Nome Fantasia"),
    cnpj: str = Form(..., description="CNPJ"),
    responsible_name: str = Form(..., description="Nome do Responsável"),
    cpf: str = Form(..., description="CPF do Responsável"),
    social_contract: Optional[UploadFile] = File(None),
    cnpj_card: Optional[UploadFile] = File(None),
    responsible_doc: Optional[UploadFile] = File(None),
    proxy_doc: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # 1. Validação Inicial
    if UserRepository.get_by_email(db, email):
        raise HTTPException(status_code=400, detail="Email já cadastrado.")

    try:
        # 2. Cria Usuário
        new_user = User(
            email=email, 
            password_hash=get_password_hash(password),
            nome=responsible_name,
            role=UserRole.CLIENT.value,
            is_active=True, 
            cpf=cpf
        )
        db.add(new_user)
        db.flush() 
        
        # 3. Cria Empresa
        new_company = Company(
            cnpj=cnpj,
            razao_social=legal_name,
            nome_fantasia=trade_name,
            owner_id=new_user.id,
            responsavel_nome=responsible_name, 
            responsavel_cpf=cpf 
        )
        db.add(new_company)
        db.flush() 

        # 4. Cria Vínculo
        link = UserCompanyLink(
            user_id=new_user.id,
            company_id=new_company.id,
            role=UserCompanyRole.MASTER.value,
            is_active=True 
        )
        db.add(link)

        # 5. Processamento de Arquivos
        def process_file(upload_file: UploadFile, title: str):
            if not upload_file: 
                return
            
            try:
                path, size = save_upload_file(upload_file, "companies")
                
                doc = Document(
                    title=title,
                    filename=upload_file.filename,
                    file_path=path,
                    company_id=new_company.id,
                    uploaded_by_id=new_user.id,
                    status=DocumentStatus.VALID.value,
                    is_client_upload=True
                )
                db.add(doc)
            except Exception as e:
                print(f"Erro crítico no upload {title}: {e}")
                raise ValueError(f"Falha ao salvar {title}: {str(e)}")

        if social_contract: process_file(social_contract, "Contrato Social")
        if cnpj_card: process_file(cnpj_card, "Cartão CNPJ")
        if responsible_doc: process_file(responsible_doc, "Documento Identidade")
        if proxy_doc: process_file(proxy_doc, "Procuração")

        # 6. Finaliza a Transação Atômica
        db.commit()
        
        # 7. Auto-Login
        access_token = create_access_token(
            data={"sub": new_user.email, "role": new_user.role, "user_id": new_user.id},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "id": new_user.id,
                "email": new_user.email
            }
        }

    except Exception as e:
        db.rollback() 
        print(f"Erro no registro: {e}")
        if "Email já cadastrado" in str(e):
            raise HTTPException(status_code=400, detail="Email já cadastrado.")
        raise HTTPException(status_code=500, detail=f"Erro ao processar cadastro: {str(e)}")

# --- ROTA DE LOGIN ---
@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login padrão OAuth2. Retorna Access Token."""
    user = UserRepository.get_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuário inativo.")

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- ROTA LEGADA: REGISTRO SIMPLES (JSON) ---
class UserSimpleCreate(BaseModel):
    email: str
    password: str

@router.post("/register-simple", status_code=status.HTTP_201_CREATED)
def register_simple(user_in: UserSimpleCreate, db: Session = Depends(get_db)):
    """Cadastro simplificado (JSON) apenas para testes legados ou criação rápida de Admin."""
    if UserRepository.get_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        is_active=True,
        role=UserRole.CLIENT.value
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# --- ROTA AUXILIAR DE PAGAMENTO (BLINDADA) ---
class PaymentSimulationRequest(BaseModel):
    email: str

@router.post("/simulate-payment", status_code=status.HTTP_200_OK)
def simulate_payment(data: PaymentSimulationRequest, db: Session = Depends(get_db)):
    """
    Simula um webhook de pagamento ativando utilizadores instantaneamente.
    [SEGURANÇA]: Bloqueada em ambiente de produção (Feature Flag).
    """
    env = os.getenv("ENV", "development").lower()
    
    # Trava (Feature Flag) baseada no ambiente
    if env == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Operação não permitida em produção. Utilize o Webhook oficial do parceiro de pagamentos."
        )
        
    user = UserRepository.get_by_email(db, email=data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    user.is_active = True
    db.commit()
    return {"message": f"Pagamento simulado com sucesso em modo '{env}'! Utilizador {user.email} ativado."}
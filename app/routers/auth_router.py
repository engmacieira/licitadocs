"""
Router de Autenticação e Onboarding.
Controla as rotas de cadastro complexo (Multipart Form), login JWT e utilitários de acesso.
"""
import os
import contextlib
import asyncio
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, verify_password, get_password_hash
from app.core.rate_limit import limiter
from app.dependencies import require_role
from app.utils.validators import validar_matematica_cpf, validar_matematica_cnpj

# Models & Repos
from app.models.user_model import User, UserCompanyLink, UserCompanyRole, UserRole
from app.models.company_model import Company
from app.models.document_model import Document, DocumentStatus 
from app.utils.file_helper import save_upload_file
from app.repositories.user_repository import UserRepository
from app.schemas.user_schemas import Token

DUMMY_HASH = get_password_hash("dummy")

router = APIRouter(prefix="/auth", tags=["Autenticação e Onboarding"])

# ==========================================
# 🚀 ONBOARDING (CADASTRO COMPLETO)
# ==========================================

@router.post(
    "/register", 
    status_code=status.HTTP_201_CREATED,
    summary="Cadastro de Novo Cliente (Onboarding)",
    description=(
        "Executa uma transação atômica complexa que:\n"
        "1. Cria o Usuário Administrador da conta.\n"
        "2. Cria o Tenant (Empresa).\n"
        "3. Vincula o Usuário à Empresa com cargo MASTER.\n"
        "4. Faz upload de até 4 documentos iniciais para o Cofre.\n\n"
        "Se qualquer passo falhar, toda a operação é revertida (Rollback)."
    )
)
@limiter.limit("5/minute")
async def register(
    request: Request,
    email: EmailStr = Form(..., description="E-mail de acesso do usuário"),
    password: str = Form(..., description="Senha forte"),
    legal_name: str = Form(..., description="Razão Social da empresa"),
    trade_name: Optional[str] = Form(None, description="Nome Fantasia"),
    cnpj: str = Form(..., description="CNPJ (apenas números)"),
    responsible_name: str = Form(..., description="Nome do Responsável Legal"),
    cpf: str = Form(..., description="CPF do Responsável"),
    social_contract: Optional[UploadFile] = File(None, description="PDF do Contrato Social"),
    cnpj_card: Optional[UploadFile] = File(None, description="PDF do Cartão CNPJ"),
    responsible_doc: Optional[UploadFile] = File(None, description="PDF do Documento de Identidade"),
    proxy_doc: Optional[UploadFile] = File(None, description="PDF da Procuração"),
    db: Session = Depends(get_db)
):
    # 1. Validação Inicial (Matemática e Existência)
    try:
        if cpf:
            cpf = validar_matematica_cpf(cpf)
        if cnpj:
            cnpj = validar_matematica_cnpj(cnpj)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if UserRepository.get_by_email(db, email):
        raise HTTPException(status_code=400, detail="E-mail já cadastrado no sistema.")

    if cpf and UserRepository.get_by_cpf(db, cpf):
        raise HTTPException(status_code=400, detail="CPF já cadastrado no sistema.")

    from app.repositories.company_repository import CompanyRepository
    if CompanyRepository.get_by_cnpj(db, cnpj):
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado no sistema.")

    saved_files = []

    try:
        # 2. Cria Usuário (Apenas instanciando o Model para garantir a Transação Atômica)
        new_user = User(
            email=email, 
            password_hash=get_password_hash(password),
            nome=responsible_name,
            role=UserRole.CLIENT.value,
            is_active=True, 
            cpf=cpf
        )
        db.add(new_user)
        db.flush() # Gera o ID, mas não commita
        
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

        # 4. Cria Vínculo de Equipe
        link = UserCompanyLink(
            user_id=new_user.id,
            company_id=new_company.id,
            role=UserCompanyRole.MASTER.value,
            is_active=True 
        )
        db.add(link)

        # 5. Processamento de Arquivos Físicos (REESCRITO PARA ALTA PERFORMANCE)
        async def process_file_io(upload_file: UploadFile, title: str):
            if not upload_file: 
                return None
            
            if not upload_file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="Apenas arquivos PDF são permitidos.")
            
            # Validação de tamanho
            upload_file.file.seek(0, 2)
            size = upload_file.file.tell()
            upload_file.file.seek(0)
            if size > 5 * 1024 * 1024:
                raise HTTPException(status_code=413, detail=f"Arquivo {title} muito grande. Máximo 5MB.")
            
            try:
                # Faz o I/O pesado de forma assíncrona
                path, size = await save_upload_file(upload_file, "companies")
                return {
                    "title": title,
                    "filename": upload_file.filename,
                    "file_path": path
                }
            except Exception as e:
                raise ValueError(f"Falha ao salvar {title}: {str(e)}")

        # Monta as tarefas para rodar TODAS AO MESMO TEMPO
        io_tasks = []
        if social_contract: io_tasks.append(process_file_io(social_contract, "Contrato Social"))
        if cnpj_card: io_tasks.append(process_file_io(cnpj_card, "Cartão CNPJ"))
        if responsible_doc: io_tasks.append(process_file_io(responsible_doc, "Documento Identidade"))
        if proxy_doc: io_tasks.append(process_file_io(proxy_doc, "Procuração"))

        # Executa o I/O de todos os arquivos paralelamente
        processed_files = await asyncio.gather(*io_tasks)

        # Agora, insere no banco (Síncrono e Seguro)
        for file_data in processed_files:
            if file_data:
                saved_files.append(file_data["file_path"])
                doc = Document(
                    title=file_data["title"],
                    filename=file_data["filename"],
                    file_path=file_data["file_path"],
                    company_id=new_company.id,
                    uploaded_by_id=new_user.id,
                    status=DocumentStatus.VALID.value,
                    is_client_upload=True
                )
                db.add(doc)

        # 6. Finaliza a Transação Atômica com Sucesso
        db.commit()
        
        # 7. Auto-Login (Retorna o JWT para o Frontend não precisar logar de novo)
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

    except HTTPException as e:
        for path in saved_files:
            with contextlib.suppress(OSError):
                os.remove(path)
        db.rollback()
        raise e
    except Exception as e:
        for path in saved_files:
            with contextlib.suppress(OSError):
                os.remove(path)
                
        db.rollback() # 🛡️ BLINDAGEM: Se qualquer passo falhar, o banco volta ao estado inicial
        if "Email já cadastrado" in str(e):
            raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
        raise HTTPException(status_code=500, detail=f"Erro ao processar cadastro: {str(e)}")


# ==========================================
# 🔐 LOGIN (GERAÇÃO DE TOKEN)
# ==========================================

@router.post(
    "/token", 
    response_model=Token,
    summary="Login de Usuário (OAuth2)",
    description="Valida as credenciais e retorna o Token JWT de acesso."
)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Consome o UserRepository (já protegido contra Soft Delete)
    user = UserRepository.get_by_email(db, form_data.username)
    
    if not user:
        verify_password(form_data.password, DUMMY_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Acesso bloqueado. Conta inativa.")

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
# 🛠️ UTILITÁRIOS E LEGADOS
# ==========================================

class UserSimpleCreate(BaseModel):
    email: EmailStr
    password: str

@router.post(
    "/register-simple", 
    status_code=status.HTTP_201_CREATED,
    summary="Cadastro Simplificado (Testes/Admin)",
    description="Cria apenas a entidade Usuário (sem Empresa ou arquivos). Útil para testes ou criação de Staff."
)
def register_simple(
    user_in: UserSimpleCreate, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    if UserRepository.get_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    
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

class PaymentSimulationRequest(BaseModel):
    email: EmailStr

@router.post(
    "/simulate-payment", 
    status_code=status.HTTP_200_OK,
    summary="Simular Webhook de Pagamento",
    description="Ativa a conta de um usuário. Funciona apenas em ambiente de desenvolvimento."
)
def simulate_payment(data: PaymentSimulationRequest, db: Session = Depends(get_db)):
    env = os.getenv("ENV", "development").lower()
    
    # Feature Flag de Segurança
    if env == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Operação bloqueada em produção. O sistema aguarda o webhook real do parceiro de pagamento."
        )
        
    user = UserRepository.get_by_email(db, email=data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    user.is_active = True
    db.commit()
    return {"message": f"Pagamento simulado (Modo: {env}). Conta de {user.email} ativada com sucesso."}
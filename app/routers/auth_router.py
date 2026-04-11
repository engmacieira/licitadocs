"""
Router de Autenticação e Onboarding.
Controla as rotas de cadastro complexo (Multipart Form), login JWT e utilitários de acesso.
"""
import os
import re
import contextlib
import asyncio
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError

from app.core.config import settings
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
from app.services.email_service import EmailService
from app.schemas.user_schemas import Token, ForgotPasswordRequest, ResetPasswordRequest, RecoverEmailRequest

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
    social_contract: UploadFile = File(..., description="PDF do Contrato Social"),
    cnpj_card: UploadFile = File(..., description="PDF do Cartão CNPJ"),
    responsible_doc: UploadFile = File(..., description="PDF do Documento de Identidade"),
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
            email_corporativo=email,
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
                saved_files.append(path) # 🛡️ Registra para limpeza em caso de falha global
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

        # 7. Gera Token de Verificação (Expiração de 24h para dar tempo ao cliente)
        verify_token = create_access_token(
            data={"sub": new_user.email, "type": "email_verification"},
            expires_delta=timedelta(hours=24)
        )

        # 8. Dispara E-mail de Boas-vindas/Verificação
        EmailService.send_verification_email(to_email=new_user.email, token=verify_token)
        
        # 9. Alerta Administrativo
        if settings.ADMIN_EMAIL_NOTIFICATIONS:
            company_summary = {
                "razao_social": new_company.razao_social,
                "cnpj": new_company.cnpj,
                "responsavel": new_company.responsavel_nome,
                "email": new_company.email_corporativo
            }
            # Notifica a equipa do LicitaDoc
            EmailService.send_new_company_alert(
                admin_email=settings.ADMIN_EMAIL_NOTIFICATIONS, 
                company_data=company_summary
            )

        # 10. Auto-Login (Retorna o JWT para o Frontend não precisar logar de novo)
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

    except (HTTPException, Exception) as e:
        for path in set(saved_files):
            with contextlib.suppress(OSError):
                os.remove(path)
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
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

# ==========================================
# RECUPERAÇÃO DE SENHA
# ==========================================

@router.post(
    "/forgot-password", 
    status_code=status.HTTP_200_OK,
    summary="Solicitar Recuperação de Senha",
    description="Gera um token JWT curto e dispara um e-mail com o link de recuperação. Sempre retorna sucesso por segurança (Anti-Enumeração)."
)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = UserRepository.get_by_email(db, email=data.email)
    
    # 🛡️ Blindagem: Retornar sempre a mesma mensagem para não vazar a existência do cliente
    success_message = {"message": "Se o e-mail estiver cadastrado, as instruções foram enviadas."}
    
    if not user or not user.is_active:
        return success_message

    # Gera token específico para reset (Não pode ser usado para Login)
    reset_token = create_access_token(
        data={"sub": user.email, "type": "password_reset"},
        expires_delta=timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
    )

    # Dispara e-mail via serviço assíncrono (Adapter)
    EmailService.send_password_reset_email(to_email=user.email, reset_token=reset_token)

    return success_message

@router.post(
    "/reset-password", 
    status_code=status.HTTP_200_OK,
    summary="Redefinir Senha",
    description="Recebe o Token JWT validado e altera a senha no banco de dados."
)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token de recuperação expirado ou inválido.",
    )
    
    try:
        # 1. Valida o Token
        payload = jwt.decode(data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        # 2. Garante que é um token de reset, e não um token de sessão interceptado
        if email is None or token_type != "password_reset":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # 3. Busca o usuário
    user = UserRepository.get_by_email(db, email=email)
    if not user:
        raise credentials_exception

    # 4. Atualiza a senha no banco
    user.password_hash = get_password_hash(data.new_password)
    db.commit()

    return {"message": "Sua senha foi redefinida com sucesso. Faça login para continuar."}

# ==========================================
# VALIDAÇÃO DE E-MAIL
# ==========================================

@router.get(
    "/verify-email", 
    status_code=status.HTTP_200_OK,
    summary="Validar E-mail do Utilizador",
    description="Recebe o token enviado por e-mail e ativa a flag is_email_verified."
)
def verify_email(token: str, db: Session = Depends(get_db)):
    exception = HTTPException(status_code=400, detail="Token inválido ou expirado.")
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "email_verification":
            raise exception
            
    except JWTError:
        raise exception

    user = UserRepository.get_by_email(db, email=email)
    if not user:
        raise exception

    if user.is_email_verified:
        return {"message": "E-mail já estava validado."}

    user.is_email_verified = True
    db.commit()

    return {"message": "E-mail validado com sucesso! A sua conta está pronta."}

# ==========================================
# RECUPERAÇÃO DE E-MAIL
# ==========================================

@router.post(
    "/recover-email", 
    status_code=status.HTTP_200_OK,
    summary="Recuperar E-mail Esquecido (Anti-Enumeração)",
    description="Recebe um CPF ou CNPJ e, se existir, dispara um e-mail com o endereço de acesso. Sempre retorna a mesma mensagem para evitar vazamento de dados."
)
def recover_email(data: RecoverEmailRequest, db: Session = Depends(get_db)):
    # 🛡️ Blindagem Máxima: Mensagem genérica idêntica para qualquer cenário
    success_message = {
        "message": "Se o documento estiver cadastrado, enviamos um lembrete para o e-mail oficial (verifique também a caixa de spam). Se o erro persistir, favor nos contatar pelos canais oficiais."
    }

    # 1. Limpa o documento (remove pontos, traços, barras)
    doc_clean = re.sub(r'\D', '', data.documento)
    email_encontrado = None
    
    # 2. Lógica de Busca Silenciosa
    if len(doc_clean) == 11:
        # É um CPF: Busca no perfil do Usuário
        user = UserRepository.get_by_cpf(db, cpf=doc_clean)
        if user:
            email_encontrado = user.email
            
    elif len(doc_clean) == 14:
        # É um CNPJ: Busca a Empresa e pega o e-mail do Dono (Owner)
        from app.repositories.company_repository import CompanyRepository
        company = CompanyRepository.get_by_cnpj(db, cnpj=doc_clean)
        if company and company.owner:
            email_encontrado = company.owner.email
            
    else:
        # Erro de formatação de documento pode retornar 400, pois não vaza dados do banco
        raise HTTPException(status_code=400, detail="Formato inválido. Envie um CPF (11) ou CNPJ (14) válido.")

    # 3. Disparo do E-mail (Se encontrou)
    if email_encontrado:
        # Como o envio usa smtplib que pode demorar alguns segundos, 
        # idealmente usaríamos BackgroundTasks aqui no futuro.
        EmailService.send_email_recovery_email(to_email=email_encontrado)

    # 4. Retorno Cego
    return success_message
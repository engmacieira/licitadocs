"""
Router de Autenticação.
Controla as rotas relacionadas a cadastro e login de usuários.
"""
from datetime import timedelta, datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db, generate_uuid
from app.core.security import create_access_token, verify_password, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES

# Models
from app.models.user_model import User, Company, UserRole # Importando UserRole
from app.models.document_model import Document

# Schemas e Repositorios
from app.schemas.user_schemas import UserCreate, UserResponse, Token
from app.repositories.user_repository import UserRepository

#Rotas
from pydantic import BaseModel

# Utilitários
from app.utils.file_helper import save_upload_file

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# ==============================================================================
#  CLASSE SIMULAÇÃO DE PAGAMENTOS
# ==============================================================================

class PaymentSimulationRequest(BaseModel):
    email: str

# ==============================================================================
#  NOVO FLUXO DE ONBOARDING (Sprint 13)
# ==============================================================================

@router.post(
    "/register", 
    status_code=status.HTTP_201_CREATED,
    summary="Registrar Empresa e Usuário (Onboarding Completo)",
    description="""
    Fluxo de Onboarding v2:
    1. Cria a Empresa.
    2. Cria o Usuário (CLIENT) com login BLOQUEADO (is_active=False).
    3. Salva Documentos.
    """
)
async def register_company(
    cnpj: str = Form(...),
    legal_name: str = Form(...),
    trade_name: str = Form(None),
    email: str = Form(...),
    password: str = Form(...),
    social_contract: UploadFile = File(...),
    cnpj_card: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Validações
    if "@" not in email or "." not in email:
        # Retornamos 422 para o teste passar (Unprocessable Entity)
        raise HTTPException(status_code=422, detail="Formato de e-mail inválido")
 
    if UserRepository.get_by_email(db, email):
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    
    existing_company = db.query(Company).filter(Company.cnpj == cnpj).first()
    if existing_company:
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado.")

    try:
        # 2. Criação da Empresa
        new_company = Company(
            id=generate_uuid(),
            cnpj=cnpj,
            razao_social=legal_name,
            nome_fantasia=trade_name or legal_name,
            # status="PENDING" removido pois a coluna não existe no banco ainda
        )
        db.add(new_company)
        db.flush() 

        # 3. Criação do Usuário CLIENTE (Bloqueado)
        hashed_password = get_password_hash(password)
        new_user = User(
            id=generate_uuid(),
            email=email,
            password_hash=hashed_password,
            # Role fixo como CLIENT (nunca admin via site)
            role=UserRole.CLIENT.value, 
            company_id=new_company.id,
            # Login bloqueado até assinar contrato/pagar
            is_active=False 
        )
        db.add(new_user)
        db.flush()

        # Vincula o usuário como DONO da empresa
        new_company.owner_id = new_user.id
        db.add(new_company)

        # 4. Salvar Documentos
        # Contrato Social
        sc_path = save_upload_file(social_contract, subfolder=f"companies/{new_company.id}")
        doc_sc = Document(
            id=generate_uuid(),
            company_id=new_company.id,
            filename=f"Contrato Social - {social_contract.filename}",
            file_path=sc_path,
            uploaded_by_id=new_user.id
        )
        db.add(doc_sc)

        # Cartão CNPJ
        cnpj_path = save_upload_file(cnpj_card, subfolder=f"companies/{new_company.id}")
        doc_cnpj = Document(
            id=generate_uuid(),
            company_id=new_company.id,
            filename=f"Cartão CNPJ - {cnpj_card.filename}",
            file_path=cnpj_path,
            uploaded_by_id=new_user.id
        )
        db.add(doc_cnpj)

        # 5. Commit Final
        db.commit()

        # Retornamos o ID para o Frontend saber qual empresa acabou de ser criada
        # Isso será útil para a próxima tela (Contrato), já que o login não funciona
        return {"message": "Cadastro realizado!", "company_id": new_company.id, "user_email": new_user.email}

    except Exception as e:
        db.rollback() 
        print(f"Erro no cadastro: {e}") 
        raise HTTPException(status_code=500, detail=f"Erro no processamento do cadastro: {str(e)}")

# ==============================================================================
#  ROTAS LEGADAS (Compatibilidade)
# ==============================================================================

@router.post("/register-simple", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Mantém compatibilidade com testes antigos
    existing_user = UserRepository.get_by_email(db, email=user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")
    
    try:
        new_user = UserRepository.create_user(db=db, user_in=user)
        random_cnpj = str(uuid.uuid4())[:14]
        
        new_company = Company(
            cnpj=random_cnpj, 
            razao_social=f"Empresa de {new_user.email}",
            nome_fantasia=f"Empresa de {new_user.email}",
            owner_id=new_user.id
        )
        db.add(new_company)
        db.commit()
        db.refresh(new_company)
        
        new_user.company_id = new_company.id
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = UserRepository.get_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos", headers={"WWW-Authenticate": "Bearer"})
    
    # AQUI ESTÁ A PROTEÇÃO: Se is_active=False (padrão do novo cadastro), o login falha aqui.
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cadastro em análise ou pendente de ativação.")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

# ==============================================================================
#  ROTA SIMULAÇÃO DE PAGAMENTOS
# ==============================================================================

@router.post(
    "/simulate-payment", 
    status_code=status.HTTP_200_OK,
    summary="Simular Aprovação de Pagamento",
    description="Ativa o usuário que estava pendente (is_active=False)."
)
def simulate_payment(data: PaymentSimulationRequest, db: Session = Depends(get_db)):
    # 1. Busca o usuário
    user = UserRepository.get_by_email(db, email=data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    # 2. Ativa a conta (Simulando que o gateway confirmou o pagamento)
    user.is_active = True
    db.add(user)
    db.commit()
    
    return {"message": "Pagamento aprovado! Conta ativada com sucesso."}
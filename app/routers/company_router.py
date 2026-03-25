"""
Router de Gestão de Empresas.
Controla as rotas de atualização de dados, membros da equipa (convites e permissões) e onboarding.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, DatabaseError
import secrets

from app.core.database import get_db
from app.core.security import get_password_hash
from app.dependencies import get_current_active_user, verify_company_access, get_current_user, get_current_active_admin
from app.models.user_model import User, UserCompanyLink, UserCompanyRole, UserRole
from app.models.company_model import Company

# Repositórios
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository

from app.schemas.company_schemas import (
    CompanyUpdate, 
    CompanyResponse, 
    CompanyMemberInvite, 
    MemberResponse, 
    MemberAddResponse,
    MemberUpdateRole
)

router = APIRouter(prefix="/companies", tags=["Gestão de Empresas e Equipa"])

# ==========================================
# 🏢 GESTÃO DE DADOS DA EMPRESA
# ==========================================

@router.get(
    "/", 
    response_model=List[CompanyResponse],
    summary="Listar Todas as Empresas (Apenas Admin)"
)
def get_companies(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna uma lista paginada de todas as empresas do sistema. Uso restrito à equipa interna."""
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas administradores podem listar todas as empresas."
        )

    # Usa o repositório blindado contra Soft Delete
    return CompanyRepository.get_all(db, skip=skip, limit=limit)

@router.get(
    "/{company_id}", 
    response_model=CompanyResponse,
    summary="Detalhes da Empresa"
)
def get_company_by_id(
    company_id: str = Path(..., description="ID da Empresa"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Busca dados detalhados de uma empresa específica. Valida o acesso do utilizador."""
    company = CompanyRepository.get_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    # Verificação de Segurança
    is_owner = str(company.owner_id) == str(current_user.id)
    if not is_owner and current_user.role != UserRole.ADMIN.value:
         # Valida se existe vínculo ativo
         verify_company_access(company_id, current_user, db)

    return company

@router.put(
    "/{company_id}", 
    response_model=CompanyResponse,
    summary="Atualizar Dados da Empresa"
)
def update_company(
    company_in: CompanyUpdate,
    company_id: str = Path(..., description="ID da empresa a editar"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza os dados cadastrais da empresa.
    REQUER: Ser membro com cargo 'MASTER' ou Administrador.
    """
    if current_user.role != UserRole.ADMIN.value:
        verify_company_access(company_id, current_user, db, required_role=UserCompanyRole.MASTER.value)
        
    company = CompanyRepository.get_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    update_data = company_in.model_dump(exclude_unset=True, by_alias=True)
    
    # Blindagem: O cliente não pode auto-aprovar pendências impostas pelo Admin
    if current_user.role != UserRole.ADMIN.value:
        update_data.pop("is_admin_verified", None)
        update_data.pop("is_contract_signed", None)
        update_data.pop("is_payment_active", None)
        update_data.pop("admin_pendencies", None) 
        
    for field, value in update_data.items():
        setattr(company, field, value)
    
    db.commit()
    db.refresh(company)
    return company

@router.patch(
    "/{company_id}/onboarding-step",
    summary="Atualizar Etapa do Onboarding"
)
def update_onboarding_step(
    company_id: str,
    step: str = Query(..., description="terms | payment | data | contract"),
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Avança as flags de progresso do onboarding da empresa."""
    
    company = CompanyRepository.get_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    
    if step == "terms":
        company.is_terms_accepted = True
    elif step == "payment":
        company.is_payment_active = True
    elif step == "data":
        company.is_data_completed = True
    elif step == "contract":
        company.is_contract_signed = True
    else:
        raise HTTPException(status_code=400, detail="Etapa de onboarding inválida.")
        
    db.commit()
    db.refresh(company)
    return company

# ==========================================
# 👥 GESTÃO DE EQUIPA (MEMBROS)
# ==========================================

def check_is_master(db: Session, user: User, company_id: str):
    """Helper local para validar permissões de gestão de equipa (Respeita Soft Delete)."""
    if user.role == UserRole.ADMIN.value:
        return True
    
    link = db.query(UserCompanyLink).filter(
        UserCompanyLink.user_id == user.id,
        UserCompanyLink.company_id == company_id,
        UserCompanyLink.role == UserCompanyRole.MASTER.value,
        UserCompanyLink.is_active == True,
        UserCompanyLink.deleted_at == None
    ).first()

    if not link:
        raise HTTPException(
            status_code=403, 
            detail="Apenas gestores (MASTER) ativos podem gerir a equipa."
        )
    return True

@router.get(
    "/{company_id}/members", 
    response_model=List[MemberResponse],
    summary="Listar Membros da Equipa"
)
def list_members(
    company_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lista todos os utilizadores vinculados a esta empresa (Acesso para qualquer membro)."""
    verify_company_access(company_id, current_user, db)
    
    members_links = db.query(UserCompanyLink).filter(UserCompanyLink.company_id == company_id).all()
    
    results = []
    for link in members_links:
        user = link.user
        results.append({
            "user_id": user.id,
            "name": getattr(user, "nome", None) or user.email.split("@")[0],
            "email": user.email,
            "role": link.role,
            "status": link.is_active,
            "joined_at": link.created_at
        })
    return results

@router.post(
    "/{company_id}/members", 
    response_model=MemberAddResponse, 
    status_code=201,
    summary="Convidar Novo Membro"
)
def add_member(
    company_id: str,
    data: CompanyMemberInvite,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Convida um utilizador para a empresa utilizando transações seguras (Savepoints).
    Cria a conta automaticamente caso o e-mail não exista.
    """
    check_is_master(db, current_user, company_id)

    company = CompanyRepository.get_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    # Busca utilizador via Repositório para garantir Soft Delete check
    user = UserRepository.get_by_email(db, data.email)
    is_new = False
    temp_password = None

    if not user:
        is_new = True
        temp_password = secrets.token_urlsafe(8)
        user = User(
            email=data.email,
            password_hash=get_password_hash(temp_password),
            role=UserRole.CLIENT.value,
            is_active=True,
            cpf=data.cpf
        )
        try:
            # 🛡️ BLINDAGEM 1: Savepoint de transação (Evita concorrência)
            with db.begin_nested():
                db.add(user)
                db.flush()
        except (IntegrityError, DatabaseError):
            user = UserRepository.get_by_email(db, data.email)
            is_new = False

    # Valida se já existe vínculo
    link_existente = db.query(UserCompanyLink).filter(
        UserCompanyLink.user_id == user.id,
        UserCompanyLink.company_id == company.id
    ).first()

    if link_existente:
        raise HTTPException(status_code=400, detail="O utilizador já faz parte da equipa.")

    new_link = UserCompanyLink(
        user_id=user.id,
        company_id=company.id,
        role=data.role.value,
        is_active=True
    )
    
    try:
        # 🛡️ BLINDAGEM 2: Savepoint do vínculo
        with db.begin_nested():
            db.add(new_link)
            db.flush()
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="O utilizador já faz parte da equipa.")

    msg = "Utilizador adicionado à equipa com sucesso."
    if is_new:
        # Simulação de envio de e-mail com temp_password
        # send_invite_email(user.email, temp_password)
        msg = "Conta criada. Instruções enviadas por e-mail."

    return {
        "user_id": user.id,
        "email": user.email,
        "role": data.role.value,
        "message": msg
    }

@router.put(
    "/{company_id}/members/{user_id}", 
    response_model=MemberResponse,
    summary="Alterar Permissões do Membro"
)
def update_member_role(
    company_id: str,
    user_id: str,
    data: MemberUpdateRole,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Promove ou despromove um membro (MASTER <-> VIEWER)."""
    check_is_master(db, current_user, company_id)

    link = db.query(UserCompanyLink).filter(
        UserCompanyLink.company_id == company_id,
        UserCompanyLink.user_id == user_id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Membro não encontrado nesta empresa.")

    company = CompanyRepository.get_by_id(db, company_id)
    if str(company.owner_id) == user_id:
        raise HTTPException(status_code=403, detail="O criador da empresa não pode ser alterado ou removido.")

    if str(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Não é possível alterar o seu próprio nível de permissão por esta via.")

    link.role = data.role.value
    db.commit()
    db.refresh(link)

    user_alvo = link.user
    return {
        "user_id": user_alvo.id,
        "name": getattr(user_alvo, "nome", None) or user_alvo.email.split("@")[0],
        "email": user_alvo.email,
        "role": link.role,
        "status": link.is_active,
        "joined_at": link.created_at
    }

@router.delete(
    "/{company_id}/members/{user_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover Membro da Equipa"
)
def remove_member(
    company_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove o acesso de um utilizador à empresa."""
    check_is_master(db, current_user, company_id)

    link = db.query(UserCompanyLink).filter(
        UserCompanyLink.company_id == company_id,
        UserCompanyLink.user_id == user_id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Membro não encontrado nesta empresa.")

    company = CompanyRepository.get_by_id(db, company_id)
    if str(company.owner_id) == user_id:
        raise HTTPException(status_code=403, detail="O criador da empresa não pode ser alterado ou removido.")

    if str(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Não pode remover-se a si próprio.")
        
    if link.role == UserCompanyRole.MASTER.value:
        raise HTTPException(status_code=400, detail="Um gestor principal (MASTER) não pode ser removido antes de ser despromovido.")

    # Remove fisicamente o vínculo de equipa (Neste caso, o Hard Delete na tabela Link faz sentido)
    db.delete(link)
    db.commit()

    return None
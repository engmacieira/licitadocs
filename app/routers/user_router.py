from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_current_user
from app.core.database import get_db
from app.models.user_model import User
from app.schemas.user_schemas import UserResponse, UserUpdate
from app.schemas.company_schemas import CompanyWithRole 

router = APIRouter(prefix="/users", tags=["Gestão de Usuários"])

@router.get(
    "/me", 
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter dados do usuário logado",
    description="""
    Retorna os detalhes do perfil do usuário autenticado (identificado pelo Token JWT).
    
    Esta rota é utilizada pelo Frontend para:
    - Verificar se o Token ainda é válido.
    - Obter o ID e o Papel (Role) para controle de acesso.
    - Carregar dados básicos (Email, Empresa).
    """
)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retorna o objeto User completo (filtrado pelo Schema de Response).
    """
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza dados do próprio perfil (ex: telefone, senha, nome).
    """
    # Exclui campos não enviados (unset) para não sobrescrever com null
    user_data = user_in.model_dump(exclude_unset=True)
    
    for field, value in user_data.items():
        # Segurança: O usuário não pode mudar seu próprio ID ou Role por aqui
        if field not in ["id", "role", "password_hash"]:
            setattr(current_user, field, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/companies", response_model=List[CompanyWithRole])
def read_my_companies(current_user: User = Depends(get_current_user)):
    """
    Lista todas as empresas vinculadas ao usuário logado,
    incluindo o nível de acesso (role) em cada uma.
    """
    results = []
    
    # O SQLAlchemy carrega 'company_links' automaticamente (Lazy Loading)
    for link in current_user.company_links:
        if link.is_active: 
            # Montamos o objeto de resposta mesclando dados da empresa + dados do link
            company_data = link.company
            
            # Cria um dicionário com os dados da empresa e injeta a role do vínculo
            company_dict = {
                **company_data.__dict__, # Pega razao_social, cnpj, etc
                "id": company_data.id,   # Garante o ID da empresa
                "role": link.role,       # Pega do Link (MASTER/VIEWER)
                "status": link.is_active,
                "created_at": company_data.created_at
            }
            results.append(company_dict)
            
    return results
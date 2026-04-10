"""
Router de Gestão de Utilizadores (Perfil Próprio).
Controla as rotas onde o utilizador logado pode consultar ou alterar os seus próprios dados,
bem como listar as empresas às quais está vinculado.
"""
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password
from app.dependencies import get_current_user
from app.models.user_model import User
from app.schemas.user_schemas import UserResponse, UserUpdate
from app.schemas.company_schemas import CompanyWithRole 

# Tag "Perfil do Utilizador" para separar visualmente no Swagger
router = APIRouter(prefix="/users", tags=["Perfil do Utilizador (Me)"])

@router.get(
    "/me", 
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter Dados do Próprio Perfil",
    description=(
        "Retorna os detalhes completos do perfil do utilizador autenticado (identificado pelo Token JWT).\n\n"
        "Esta rota é ideal para o Frontend:\n"
        "- Validar se o Token atual ainda é válido.\n"
        "- Obter as permissões e o ID do utilizador para controlo de interface.\n"
        "- Carregar dados pessoais (Nome, E-mail, CPF, etc)."
    )
)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retorna o objeto User completo (A magia acontece no Pydantic, que filtra 
    automaticamente a password_hash através do schema de resposta).
    """
    return current_user

@router.patch(
    "/me", 
    response_model=UserResponse,
    summary="Atualizar Dados do Próprio Perfil",
    description="Permite ao utilizador atualizar os seus dados pessoais, como nome, telemóvel ou profissão. Se for alterar a senha, exige a senha atual por segurança."
)
def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualiza dados do perfil."""
    # Exclui campos não enviados (unset)
    user_data = user_in.model_dump(exclude_unset=True)
    
    # 🛡️ Missão 1: Tratamento de Senha (Com Validação de Segurança)
    if user_in.password:
        # No schema UserUpdate, password e current_password são opcionais.
        # Mas se password vier, current_password é obrigatório.
        if not user_in.current_password:
            raise HTTPException(status_code=400, detail="A senha atual é obrigatória para definir uma nova senha.")
            
        if not verify_password(user_in.current_password, current_user.password_hash):
            raise HTTPException(status_code=401, detail="Senha atual incorreta.")
            
        current_user.password_hash = get_password_hash(user_in.password)
        # Remove do dict para não tentar setar no loop mass assignment
        user_data.pop("password", None)
        user_data.pop("current_password", None)
    
    for field, value in user_data.items():
        # 🛡️ Missão 3: Bloqueio de Mass Assignment (Blindagem)
        # current_password foi excluído aqui pois já foi processado e retirado com o .pop()
        if field not in ["id", "role", "password_hash", "is_active", "current_password"]:
            setattr(current_user, field, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get(
    "/me/companies", 
    response_model=List[CompanyWithRole],
    summary="Listar as Minhas Empresas",
    description=(
        "Lista todas as empresas a que o utilizador atual tem acesso.\n"
        "Cruza os dados da empresa com o nível de permissão (MASTER ou VIEWER) que o utilizador tem nela."
    )
)
def read_my_companies(current_user: User = Depends(get_current_user)):
    """Lista as empresas vinculadas ao utilizador logado."""
    results = []
    
    # O SQLAlchemy carrega os 'company_links' automaticamente (Lazy Loading)
    for link in current_user.company_links:
        # Garante que só retorna as empresas em que o vínculo ainda está ativo
        if link.is_active: 
            company_data = link.company
            
            # 🛡️ Missão 4: Limpeza de Retorno (Anti-Pattern ORM Fix)
            # Evita expor o estado interno do SQLAlchemy (__dict__)
            company_dict = {
                "id": company_data.id,
                "razao_social": company_data.razao_social,
                "cnpj": company_data.cnpj,
                "nome_fantasia": company_data.nome_fantasia,
                "email_corporativo": company_data.email_corporativo,
                "role": link.role,
                "status": link.is_active,
                "created_at": company_data.created_at
            }
            results.append(company_dict)
            
    return results
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any

from app.core.database import get_db
from app.dependencies import get_current_active_admin, get_current_active_user
from app.models.user_model import User
from app.models.company_model import Company
from app.models.document_model import Document 

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# --- VISÃO DO ADMINISTRADOR ---
@router.get("/admin/stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    """
    Retorna números gerais do sistema para o Admin.
    """
    # 1. Totais
    total_companies = db.query(Company).count()
    
    # CORREÇÃO: Usando Document direto em vez de Repository.model
    total_documents = db.query(Document).count()
    
    total_users = db.query(User).count()

    # 2. Documentos Recentes (Últimos 5 enviados)
    recent_docs = db.query(Document)\
        .order_by(Document.created_at.desc())\
        .limit(5)\
        .all()

    # 3. Empresas Recentes (Últimas 5 cadastradas)
    recent_companies = db.query(Company)\
        .order_by(Company.created_at.desc())\
        .limit(5)\
        .all()

    return {
        "total_companies": total_companies,
        "total_documents": total_documents,
        "total_users": total_users,
        "recent_documents": recent_docs,
        "recent_companies": recent_companies
    }

# --- VISÃO DO CLIENTE ---
@router.get("/client/stats")
def get_client_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retorna números específicos da empresa do usuário logado.
    """
    if not current_user.company_id:
        return {"error": "Usuário sem empresa vinculada"}

    # 1. Meus Totais (CORREÇÃO: Usando Document)
    my_docs_count = db.query(Document)\
        .filter(Document.company_id == current_user.company_id)\
        .count()

    # 2. Meus Documentos Recentes (CORREÇÃO: Usando Document)
    my_recent_docs = db.query(Document)\
        .filter(Document.company_id == current_user.company_id)\
        .order_by(Document.created_at.desc())\
        .limit(5)\
        .all()
    
    # 3. Status da Empresa
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    
    return {
        "company_name": company.razao_social if company else "N/A",
        "cnpj": company.cnpj if company else "N/A",
        "is_active": current_user.is_active, # Status do acesso dele
        "total_documents": my_docs_count,
        "recent_documents": my_recent_docs
    }
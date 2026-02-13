from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any, Optional

from app.core.database import get_db
from app.dependencies import get_current_active_admin, get_current_active_user
from app.models.user_model import User
from app.models.company_model import Company
from app.models.document_model import Document, DocumentStatus # Importante importar o Status

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
    # 1. Totais Globais
    total_companies = db.query(Company).count()
    total_documents = db.query(Document).count()
    total_users = db.query(User).count()

    # 2. Documentos Recentes (Últimos 5 enviados no sistema todo)
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

# --- VISÃO DO CLIENTE (Corrigida Multi-Tenancy) ---
@router.get("/client/stats")
def get_client_dashboard_stats(
    company_id: Optional[str] = None, # Agora aceita o ID da empresa alvo
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retorna números específicos de UMA empresa do usuário.
    Se company_id não for informado, usa a primeira empresa encontrada.
    """
    
    # 1. Determina qual empresa usar
    target_company_id = company_id
    
    if not target_company_id:
        # Fallback: Se o front não mandou ID, pega a primeira empresa vinculada
        if not current_user.company_links:
             # Usuário sem nenhuma empresa (ex: recém criado sem vínculo)
             return {
                "company_name": "Sem Empresa",
                "total_docs": 0,
                "docs_valid": 0,
                "docs_expired": 0,
                "recent_docs": []
            }
        target_company_id = current_user.company_links[0].company_id
    else:
        # Segurança: Verifica se o usuário tem acesso à empresa solicitada
        # Procura nos links do usuário se existe esse company_id
        has_access = any(link.company_id == target_company_id for link in current_user.company_links)
        if not has_access:
            raise HTTPException(status_code=403, detail="Acesso negado aos dados desta empresa.")

    # 2. Busca dados da Empresa Alvo
    company = db.query(Company).filter(Company.id == target_company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    # 3. Estatísticas Filtradas (WHERE company_id = target)
    total_docs = db.query(Document)\
        .filter(Document.company_id == target_company_id)\
        .count()

    docs_valid = db.query(Document)\
        .filter(
            Document.company_id == target_company_id, 
            Document.status == DocumentStatus.VALID.value
        ).count()
        
    docs_expired = db.query(Document)\
        .filter(
            Document.company_id == target_company_id, 
            Document.status == DocumentStatus.EXPIRED.value
        ).count()

    # 4. Documentos Recentes desta empresa
    my_recent_docs = db.query(Document)\
        .filter(Document.company_id == target_company_id)\
        .order_by(Document.created_at.desc())\
        .limit(5)\
        .all()
    
    return {
        "company_name": company.razao_social,
        "total_docs": total_docs,
        "docs_valid": docs_valid,
        "docs_expired": docs_expired,
        "recent_docs": my_recent_docs
    }
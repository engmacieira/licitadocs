"""
Router do Dashboard (Estatísticas e Gráficos).
Fornece os indicadores para a página inicial do Administrador e do Cliente.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.dependencies import get_current_active_admin, get_current_active_user
from app.models.user_model import User
from app.models.company_model import Company
from app.models.document_model import Document
from app.models.certificate_model import Certificate

# Importamos a nossa "fortaleza" de Repositórios
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository
from app.repositories.document_repository import DocumentRepository
from app.schemas.dashboard_schemas import AdminStatsResponse, ClientStatsResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard (Indicadores)"])

# ==========================================
# 📊 VISÃO DO ADMINISTRADOR
# ==========================================

@router.get("/admin/stats", summary="Estatísticas Globais (Admin)", response_model=AdminStatsResponse)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    """
    Retorna números gerais do sistema para o Admin.
    Blindado com Soft Delete: não contabiliza dados enviados para a lixeira.
    """
    # 1. Totais Globais (Usando a magia da Herança: get_active_query!)
    total_companies = CompanyRepository.get_active_query(db).count()
    total_users = UserRepository.get_active_query(db).count()

    # Correção: Somar Documentos Legados e Certificados Estruturados Ativos
    total_legacies = db.query(Document).filter(Document.deleted_at.is_(None)).count()
    total_certs = db.query(Certificate).filter(Certificate.deleted_at.is_(None)).count()
    total_documents = total_legacies + total_certs

    # 2. Documentos Recentes (Unificados: Legados + Certidões)
    recent_docs = DocumentRepository.get_recent_global(db, limit=5)

    # 3. Empresas Recentes
    recent_companies = CompanyRepository.get_active_query(db)\
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


# ==========================================
# 📈 VISÃO DO CLIENTE (Multi-Tenancy)
# ==========================================

@router.get("/client/stats", summary="Estatísticas da Empresa (Cliente)", response_model=ClientStatsResponse)
def get_client_dashboard_stats(
    company_id: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retorna números específicos de UMA empresa do utilizador.
    Unifica documentos manuais e certidões automáticas de forma transparente.
    """
    
    # 1. Determina qual empresa usar e valida acesso
    target_company_id = company_id
    
    if not target_company_id:
        # Fallback para a primeira empresa ativa do utilizador
        active_links = [link for link in current_user.company_links if link.is_active]
        if not active_links:
             return {
                "company_name": "Sem Empresa",
                "total_docs": 0,
                "docs_valid": 0,
                "docs_expired": 0,
                "recent_docs": []
            }
        target_company_id = active_links[0].company_id
    else:
        # Segurança: Verifica se tem acesso real a esta empresa
        has_access = any(link.company_id == target_company_id and link.is_active for link in current_user.company_links)
        if not has_access:
            raise HTTPException(status_code=403, detail="Acesso negado aos dados desta empresa.")

    # 2. Busca dados da Empresa (usando Soft Delete check)
    company = CompanyRepository.get_by_id(db, target_company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    # 3. 🎩 A MÁGICA DA UNIFICAÇÃO
    # Em vez de fazer 3 queries complexas, usamos a lista unificada que criámos!
    unified_docs = DocumentRepository.get_unified_by_company(db, target_company_id)
    
    total_docs = len(unified_docs)
    docs_valid = sum(1 for d in unified_docs if d["status"] == "valid")
    docs_expired = sum(1 for d in unified_docs if d["status"] == "expired")

    # 4. Documentos Recentes
    # Como a lista já vem ordenada por 'created_at' do Repositório, basta cortar os 5 primeiros!
    my_recent_docs = unified_docs[:5]
    
    return {
        "company_name": company.razao_social,
        "total_docs": total_docs,
        "docs_valid": docs_valid,
        "docs_expired": docs_expired,
        "recent_docs": my_recent_docs
    }
with open("app/routers/admin_router.py", "r") as f:
    content = f.read()

imports = """
from app.schemas.audit_schemas import PaginatedAuditLogs
from app.repositories.audit_repository import AuditRepository
from datetime import datetime
"""

if "PaginatedAuditLogs" not in content:
    content = content.replace("from typing import List", f"from typing import List\n{imports}")

endpoint = """
# ==========================================
# 📊 AUDITORIA (Audit Trail)
# ==========================================

@router.get(
    "/audit-logs",
    response_model=PaginatedAuditLogs,
    summary="Listar Logs de Auditoria",
    description="Retorna os logs de auditoria do sistema com suporte a paginação e filtros detalhados. Restrito a Administradores."
)
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    entity_name: str = Query(None, description="Filtrar por nome da entidade (ex: User, Company)"),
    entity_id: str = Query(None, description="Filtrar por ID da entidade"),
    user_id: str = Query(None, description="Filtrar pelo ID do usuário que realizou a ação"),
    action: str = Query(None, description="Filtrar por ação (ex: CREATE, UPDATE, DELETE)"),
    request_id: str = Query(None, description="Filtrar pelo ID da requisição"),
    start_date: datetime = Query(None, description="Data de início (ISO 8601)"),
    end_date: datetime = Query(None, description="Data de fim (ISO 8601)"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    logs, total = AuditRepository.get_audit_logs(
        db=db,
        skip=skip,
        limit=limit,
        entity_name=entity_name,
        entity_id=entity_id,
        user_id=user_id,
        action=action,
        request_id=request_id,
        start_date=start_date,
        end_date=end_date
    )

    return PaginatedAuditLogs(
        items=logs,
        total=total,
        skip=skip,
        limit=limit
    )
"""

if "def list_audit_logs" not in content:
    content += f"\n{endpoint}\n"

with open("app/routers/admin_router.py", "w") as f:
    f.write(content)

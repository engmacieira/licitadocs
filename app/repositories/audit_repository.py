import structlog
from app.core.database import SessionLocal
from app.models.audit_log_model import AuditLog

logger = structlog.get_logger("business.audit")

class AuditRepository:
    @classmethod
    def create_audit_log_async(
        cls,
        entity_name: str,
        entity_id: str,
        action: str,
        user_id: str,
        old_payload: dict,
        new_payload: dict,
        request_id: str
    ):
        """
        Salva um log de auditoria em uma sessão separada.
        Idealmente executado como uma BackgroundTask ou Thread secundária.
        """
        try:
            db = SessionLocal()
            audit_log = AuditLog(
                entity_name=entity_name,
                entity_id=entity_id,
                action=action,
                user_id=user_id,
                old_payload=old_payload,
                new_payload=new_payload,
                request_id=request_id
            )
            db.add(audit_log)
            db.commit()

            logger.info("audit_log_created", entity=entity_name, action=action, entity_id=entity_id)
        except Exception as e:
            if 'db' in locals():
                db.rollback()
            logger.error("audit_log_failed", error=str(e), entity=entity_name, action=action)
        finally:
            if 'db' in locals():
                db.close()
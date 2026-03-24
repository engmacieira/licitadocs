from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.models.ai_usage_model import AIUsage
import logging

logger = logging.getLogger(__name__)

class AIQuotaRepository:
    """
    Repositório para gerenciar a cota diária de tokens de IA por empresa.
    """
    
    @staticmethod
    def get_daily_usage(db: Session, company_id: str, ref_date: date) -> int:
        """
        Retorna o total de tokens consumidos por uma empresa em uma data específica.
        """
        try:
            record = db.query(AIUsage).filter(
                AIUsage.company_id == company_id,
                AIUsage.usage_date == ref_date
            ).first()
            
            return record.tokens_consumed if record else 0
        except Exception as e:
            logger.error(f"❌ [AI_QUOTA_REPO] Erro ao buscar uso diário: {str(e)}")
            return 0
            
    @staticmethod
    def add_usage(db: Session, company_id: str, tokens: int, ref_date: date) -> None:
        """
        Adiciona tokens ao consumo diário da empresa. Se o registro não existir para a data, ele é criado.
        """
        try:
            record = db.query(AIUsage).filter(
                AIUsage.company_id == company_id,
                AIUsage.usage_date == ref_date
            ).first()
            
            if record:
                record.tokens_consumed += tokens
            else:
                record = AIUsage(
                    company_id=company_id,
                    usage_date=ref_date,
                    tokens_consumed=tokens
                )
                db.add(record)
                
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"❌ [AI_QUOTA_REPO] Erro ao adicionar uso diário: {str(e)}")
            raise

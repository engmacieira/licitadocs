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
        Adiciona tokens ao consumo diário da empresa. 
        Utiliza Atomic Update (banco de dados) para evitar Race Conditions (Lost Update).
        Se o registro não existir, realiza um Upsert seguro.
        """
        try:
            from sqlalchemy import update
            
            # 1. Tentativa de Update Atômico (Nível de Banco)
            stmt = (
                update(AIUsage)
                .where(AIUsage.company_id == company_id)
                .where(AIUsage.usage_date == ref_date)
                .values(tokens_consumed=AIUsage.tokens_consumed + tokens)
            )
            result = db.execute(stmt)
            
            # Se nenhuma linha foi afetada, o registro ainda não existe para hoje
            if result.rowcount == 0:
                try:
                    # 2. Tentativa de Inserção (Criação do registro diário)
                    new_record = AIUsage(
                        company_id=company_id,
                        usage_date=ref_date,
                        tokens_consumed=tokens
                    )
                    db.add(new_record)
                    db.commit()
                except Exception:
                    # 3. Fallback: Se outro processo inseriu entre o Update e o Insert (IntegrityError)
                    db.rollback()
                    db.execute(stmt)
                    db.commit()
            else:
                db.commit()

        except Exception as e:
            db.rollback()
            logger.error(f"❌ [AI_QUOTA_REPO] Erro crítico ao adicionar uso: {str(e)}")
            raise

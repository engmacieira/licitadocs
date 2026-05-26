"""
Serviço Orquestrador de Automação (Cron Job).
Varre o banco de dados em busca de documentos expirados ou faltantes 
e dispara os crawlers correspondentes para cada empresa ativa.
"""

import uuid
import logging
from datetime import datetime
from pathlib import Path

from app.core.database import SessionLocal
from app.models.document_automation_model import DocumentAutomationConfig
from app.models.company_model import Company
from app.models.certificate_model import Certificate
from app.services.crawlers.crawler_factory import CrawlerFactory
from app.repositories.document_repository import DocumentRepository
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configuração de Storage



class OrchestratorService:
    
    @staticmethod
    def run_daily_scan():
        """
        Executa a varredura global diária de certidões.
        Respeita o Soft Delete e as regras de proximidade de vencimento.
        """
        logger.info("🤖 [ORQUESTRADOR] Iniciando varredura diária...")
        db = SessionLocal()
        hoje = datetime.now().date()
        
        try:
            # 1. Busca robôs ativos e NÃO deletados
            active_configs = db.query(DocumentAutomationConfig).filter(
                DocumentAutomationConfig.is_automatable == True,
                DocumentAutomationConfig.strategy_name.isnot(None),
                DocumentAutomationConfig.deleted_at.is_(None) # Soft Delete Check
            ).all()

            if not active_configs:
                logger.info("🤖 [ORQUESTRADOR] Nenhuma automação ativa configurada.")
                return

            # Filtra apenas empresas ativas e não deletadas
            companies = db.query(Company).filter(Company.deleted_at.is_(None)).all()

            # 2. Cruzamento Inteligente
            for config in active_configs:
                strategy = config.strategy_name
                doc_name = config.document_type.name
                type_id = config.document_type_id
                
                for company in companies:
                    if not company.cnpj: continue 
                        
                    # Verificação de Recorrência: Busca a última certidão válida
                    ultimo_doc = db.query(Certificate).filter(
                        Certificate.company_id == company.id,
                        Certificate.type_id == type_id,
                        Certificate.deleted_at.is_(None)
                    ).order_by(Certificate.created_at.desc()).first()
                    
                    # Regra de Negócio: Busca se não existir ou se vencer em < 5 dias
                    if ultimo_doc and ultimo_doc.expiration_date:
                        dias_restantes = (ultimo_doc.expiration_date - hoje).days
                        if dias_restantes > 5:
                            continue
                            
                    logger.info(f"🔍 [ORQUESTRADOR] Disparando {strategy} para {company.razao_social}")
                    
                    # 3. Execução do Crawler
                    try:
                        crawler = CrawlerFactory.get_crawler(strategy, {
                            "cnpj": company.cnpj,
                            "company_id": company.id,
                            "type_id": type_id
                        })
                        result = crawler.fetch()
                        
                        if result.get("success"):
                            meta = result["file_metadata"]
                            file_content = result.get("file_content")
                            
                            # Persistência no Supabase Storage
                            unique_name = f"{uuid.uuid4()}_{meta['filename']}"
                            supabase: Client = create_client(settings.SUPABASE_URL or "", settings.SUPABASE_KEY or "")
                            bucket = "cofre-digital"
                            supabase.storage.from_(bucket).upload(path=unique_name, file=file_content)
                            file_path = f"{bucket}/{unique_name}"
                                
                            # Persistência no Cofre via Repository
                            DocumentRepository.create_certificate(
                                db=db,
                                type_id=type_id,
                                filename=meta["filename"],
                                file_path=str(file_path),
                                company_id=company.id,
                                expiration_date=meta.get("expiration_date"),
                                authentication_code=meta.get("authentication_code")
                            )
                            logger.info(f"✅ [SUCESSO] {doc_name} atualizado para {company.cnpj}")
                            
                    except Exception as e:
                        logger.error(f"❌ [ORQUESTRADOR] Falha na estratégia {strategy} para {company.cnpj}: {e}")

        except Exception as e:
            logger.error(f"❌ [ORQUESTRADOR] Erro fatal: {str(e)}")
        finally:
            db.close()
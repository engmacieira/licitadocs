"""
Serviço Orquestrador de Automação (Cron Job).
Responsável por varrer o banco de dados e disparar os robôs corretos para cada empresa.
"""
import os
import uuid
import logging
from datetime import datetime

from app.core.database import SessionLocal
from app.models.document_automation_model import DocumentAutomationConfig
from app.models.company_model import Company
from app.models.certificate_model import Certificate
from app.services.crawlers.crawler_factory import CrawlerFactory
from app.repositories.document_repository import DocumentRepository

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configura o diretório local de uploads para os background jobs
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class OrchestratorService:
    
    @staticmethod
    def run_daily_scan():
        logger.info("🤖 [ORQUESTRADOR] A iniciar a varredura diária de certidões...")
        db = SessionLocal()
        
        try:
            # 1. Encontra os robôs ativados
            active_configs = db.query(DocumentAutomationConfig).filter(
                DocumentAutomationConfig.is_automatable == True,
                DocumentAutomationConfig.strategy_name.isnot(None)
            ).all()

            if not active_configs:
                logger.info("🤖 [ORQUESTRADOR] Nenhum robô configurado ou ativado no momento.")
                return

            companies = db.query(Company).all()
            hoje = datetime.now().date()

            # 2. O Cruzamento: Para cada Empresa, passa cada Robô
            for config in active_configs:
                strategy = config.strategy_name
                doc_name = config.document_type.name
                type_id = config.document_type_id
                
                for company in companies:
                    if not company.cnpj:
                        continue 
                        
                    # --- NOVO: VERIFICAÇÃO INTELIGENTE DE COFRE ---
                    # Busca a última certidão deste tipo gerada para esta empresa
                    ultimo_doc = db.query(Certificate).filter(
                        Certificate.company_id == company.id,
                        Certificate.type_id == type_id
                    ).order_by(Certificate.created_at.desc()).first()
                    
                    # Regra de Negócio: Só busca se NÃO existir, ou se estiver EXPIRADO/EXPIRANDO (< 5 dias)
                    if ultimo_doc and ultimo_doc.expiration_date:
                        dias_para_expirar = (ultimo_doc.expiration_date - hoje).days
                        if dias_para_expirar > 5:
                            logger.info(f"⏭️ [PULANDO] Empresa {company.cnpj} já possui '{doc_name}' válido (Expira em {dias_para_expirar} dias).")
                            continue
                            
                    logger.info(f"🔍 [EXECUTANDO] A buscar '{doc_name}' para a empresa {company.razao_social} ({company.cnpj})...")
                    
                    # 3. Dispara o Robô!
                    try:
                        execution_params = {
                            "cnpj": company.cnpj,
                            "company_id": company.id,
                            "type_id": type_id
                        }
                        
                        crawler = CrawlerFactory.get_crawler(strategy, execution_params)
                        result = crawler.fetch()
                        
                        if result.get("success"):
                            meta = result["file_metadata"]
                            file_content = result.get("file_content")
                            
                            if not file_content:
                                logger.error(f"❌ [ERRO] O robô devolveu sucesso, mas não anexou o conteúdo (bytes) do arquivo.")
                                continue

                            # --- NOVO: SALVAR NO DISCO E NO BANCO ---
                            # Gera um nome de arquivo único para não sobrescrever
                            unique_filename = f"{uuid.uuid4()}_{meta['filename']}"
                            file_path = os.path.join(UPLOAD_DIR, unique_filename)
                            
                            # Salva os raw bytes no HD do servidor
                            with open(file_path, "wb") as f:
                                f.write(file_content)
                                
                            # Usa o nosso repositório para oficializar o documento no Cofre do cliente!
                            DocumentRepository.create_certificate(
                                db=db,
                                type_id=type_id,
                                filename=meta["filename"],
                                file_path=file_path,
                                company_id=company.id,
                                expiration_date=meta.get("expiration_date"),
                                authentication_code=meta.get("authentication_code")
                            )
                            
                            logger.info(f"✅ [SUCESSO] Certidão salva e vinculada ao Cofre da empresa {company.cnpj}!")
                        else:
                            logger.warning(f"⚠️ [AVISO] Falha ao buscar para {company.cnpj}: {result.get('message')}")
                            
                    except Exception as e:
                        logger.error(f"❌ [ERRO CRÍTICO] Falha na execução da estratégia {strategy} para {company.cnpj}: {str(e)}")

        except Exception as e:
            logger.error(f"❌ [ORQUESTRADOR] Erro fatal na varredura: {str(e)}")
        finally:
            db.close()
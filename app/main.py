"""
Ponto de Entrada da Aplicação (Entrypoint).
Inicializa o FastAPI, configura Middlewares e regista as Rotas.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from apscheduler.schedulers.background import BackgroundScheduler

# IMPORTAÇÃO DO SENTRY E DAS CONFIGURAÇÕES
import sentry_sdk
from app.core.config import settings

# Importações de Base de Dados e Segurança
from app.core.database import engine, Base

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.rate_limit import limiter
from app.core.middleware import PayloadSizeLimitMiddleware

from asgi_correlation_id import CorrelationIdMiddleware
from app.middlewares.audit_middleware import AuditMiddleware

# Importação dos Routers Refatorados
from app.routers import (
    auth_router, 
    document_router, 
    admin_router, 
    ai_router, 
    user_router, 
    dashboard_router,
    company_router,
    message_router,
    emission_rule_router,
    pncp_lead_router,
    payment_router
)

# Models para garantir a criação das tabelas pelo SQLAlchemy
from app.models import certificate_model, payment_model
from app.models.document_automation_model import DocumentAutomationConfig
from app.services.orchestrator_service import OrchestratorService
from anyio.lowlevel import RunVar
from anyio import CapacityLimiter

ENV = os.getenv("ENV", "development").lower()

# ==========================================
# INICIALIZAÇÃO DO SENTRY
# ==========================================
# Só inicia se a DSN estiver preenchida no .env, evitando erros em desenvolvimento local se você não quiser usar.
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=ENV,
        # Performance Monitoring
        traces_sample_rate=1.0, # Captura 100% das transações.
        # Profiling (Opcional, mede gargalos de CPU no código Python)
        profiles_sample_rate=1.0,
    )
    print("✅ Sentry SDK inicializado com sucesso!")

# Missão 4: Ocultar o Swagger em Produção
docs_config = {
    "docs_url": "/docs" if ENV != "production" else None,
    "redoc_url": "/redoc" if ENV != "production" else None,
}

API_VERSION = "2.1.0"

app = FastAPI(
    title="LicitaDoc API",
    version=API_VERSION, # Versão atualizada pós-refatoração
    description="""
    **API Backend do sistema LicitaDoc.**
    
    A plataforma definitiva para gestão de documentos e certidões para licitações.
    
    ## 🧩 Módulos Principais:
    * **🔐 Auth & Users:** Login, Registo, RBAC e Gestão de Perfil.
    * **🏢 Companies & Team:** Multi-Tenancy, Gestão de Membros (MASTER/VIEWER) e Onboarding.
    * **🗂️ Vault (Documents):** Upload seguro, Listagem Unificada e Soft Delete.
    * **🤖 AI Concierge:** Assistente Virtual RAG focado exclusivamente no Cofre da Empresa.
    * **⚙️ Admin & Backoffice:** Gestão global, Broadcasts de mensagens e configuração de Automações.
    """,
    **docs_config
)

# 1. Rate Limit
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# 2. Blindagem de Payload
app.add_middleware(PayloadSizeLimitMiddleware, max_upload_size=20 * 1024 * 1024)

# 3. Middleware de Auditoria (Sistêmico) e Correlation ID
app.add_middleware(AuditMiddleware)
app.add_middleware(CorrelationIdMiddleware, header_name='X-Request-ID')

# ==========================================
# ⏰ BACKGROUND JOBS (CRON)
# ==========================================
'''
# --- CONFIGURAÇÃO DO BACKGROUND JOBS (APScheduler) ---
scheduler = BackgroundScheduler()

@app.on_event("startup")
def setup_concurrency():
    """
    Missão: Otimizar o Thread Pool do AnyIO para suportar a carga de 200 requests.
    Como o banco usa conexões síncronas, cada request em thread consome um slot.
    O default de 40 causaria gargalo mesmo com o banco configurado.
    """
    RunVar("_default_thread_limiter").set(CapacityLimiter(200))

@app.on_event("startup")
def start_scheduler():
    # Adicionamos a nossa tarefa ao agendador. 
    # Para testes (agora), vamos colocar para rodar a cada 30 segundos!
    # Em produção mudaremos para: trigger="cron", hour=2, minute=0 (Todos os dias às 02:00)
    scheduler.add_job(OrchestratorService.run_daily_scan, trigger="interval", seconds=120)
    scheduler.start()
    print("⏰ APScheduler iniciado! Orquestrador em background a rodar.")

@app.on_event("shutdown")
def stop_scheduler():
    scheduler.shutdown()
    print("⏰ APScheduler desligado.")
'''

# ==========================================
# 🌐 MIDDLEWARES (CORS Dinâmico)
# ==========================================

# Missão 3: CORS configurável via Variável de Ambiente
cors_origins_str = os.getenv("CORS_ORIGINS", "")
if cors_origins_str:
    origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
else:
    # Fallback seguro para desenvolvimento
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://licitadocs.com.br",
        "https://www.licitadocs.com.br",

    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 🔀 REGISTO DE ROTAS (ENDPOINTS)
# ==========================================

app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(company_router.router)
app.include_router(document_router.router)
app.include_router(dashboard_router.router)
app.include_router(message_router.router)
app.include_router(emission_rule_router.router)
app.include_router(ai_router.router)
app.include_router(admin_router.router)
app.include_router(pncp_lead_router.router)
app.include_router(payment_router.router)

# ==========================================
# ❤️ HEALTH CHECK
# ==========================================

@app.api_route("/", methods=["GET", "HEAD"])
def health_check():
    """Endpoint básico para verificar se a API está online."""
    return {
        "status": "ok", 
        "version": API_VERSION, 
        "system": "LicitaDoc API", 
        "environment": ENV
    }
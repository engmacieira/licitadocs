"""
Ponto de Entrada da Aplicação (Entrypoint).
Inicializa o FastAPI, configura Middlewares e regista as Rotas.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from apscheduler.schedulers.background import BackgroundScheduler

# Importações de Base de Dados e Segurança
from app.core.database import engine, Base
from app.core.security import SECRET_KEY

from app.core.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

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
    emission_rule_router
)

# Models para garantir a criação das tabelas pelo SQLAlchemy
from app.models import certificate_model
from app.models.document_automation_model import DocumentAutomationConfig
from app.services.orchestrator_service import OrchestratorService

ENV = os.getenv("ENV", "development").lower()

# ==========================================
# 🚀 CONFIGURAÇÃO DA APLICAÇÃO (FASTAPI)
# ==========================================

app = FastAPI(
    title="LicitaDoc API",
    version="1.1.0", # Versão atualizada pós-refatoração
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
    docs_url="/docs",
    redoc_url="/redoc"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ==========================================
# ⏰ BACKGROUND JOBS (CRON)
# ==========================================
'''
# --- CONFIGURAÇÃO DO BACKGROUND JOBS (APScheduler) ---
scheduler = BackgroundScheduler()

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
# 🌐 MIDDLEWARES (CORS)
# ==========================================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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

# ==========================================
# ❤️ HEALTH CHECK
# ==========================================

@app.get("/", tags=["Health"])
def health_check():
    """Endpoint básico para verificar se a API está online."""
    return {
        "status": "ok", 
        "version": "1.1.0", 
        "system": "LicitaDoc API", 
        "environment": ENV
    }
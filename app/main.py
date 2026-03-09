"""
Ponto de Entrada da Aplicação (Entrypoint).
Inicializa o FastAPI, configura Middlewares e registra as Rotas.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
#from apscheduler.schedulers.background import BackgroundScheduler

# A importação desses módulos já acionará o Fail Fast (sys.exit) se faltarem as envs
from app.core.database import engine, Base
from app.core.security import SECRET_KEY
from app.routers import (
    auth_router, 
    document_router, 
    admin_router, 
    ai_router, 
    user_router, 
    dashboard_router,
    company_router,
    message_router,
    prefecture_router
)
from app.models import certificate_model
from app.models.document_automation_model import DocumentAutomationConfig

from app.services.orchestrator_service import OrchestratorService

ENV = os.getenv("ENV", "development").lower()

# Configuração da Aplicação
app = FastAPI(
    title="LicitaDoc API",
    version="1.0.3", 
    description="""
    API Backend do sistema LicitaDoc.
    
    ## Módulos Principais:
    * **Auth:** Login e Registro (JWT).
    * **Documents:** Upload e Listagem com isolamento por empresa.
    * **AI:** Concierge Jurídico (RAG) para análise de editais.
    * **Admin:** Gestão de Multi-Tenancy (Empresas).
    """,
    docs_url="/docs",
    redoc_url="/redoc"
)

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

# --- Configuração de CORS ---
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

# --- Registro de Rotas ---
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(document_router.router)
app.include_router(ai_router.router)
app.include_router(admin_router.router)
app.include_router(company_router.router)
app.include_router(dashboard_router.router)
app.include_router(message_router.router)
app.include_router(prefecture_router.router)

# Rota de Health Check
@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "1.0.3", "system": "LicitaDoc API", "environment": ENV}
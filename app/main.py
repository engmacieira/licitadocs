"""
Ponto de Entrada da Aplicação (Entrypoint).
Inicializa o FastAPI, configura Middlewares e registra as Rotas.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.routers import (
    auth_router, 
    document_router, 
    admin_router, 
    ai_router, 
    user_router, 
    dashboard_router
)
from app.models import certificate_model

# Inicialização do Banco de Dados (Modo Dev)
# Cria as tabelas se não existirem. Em produção, use Alembic migrations.
# Base.metadata.create_all(bind=engine)

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
    docs_url="/docs", # URL do Swagger UI
    redoc_url="/redoc" # URL da documentação alternativa
)

# --- Configuração de CORS (Cross-Origin Resource Sharing) ---
# Permite que o Frontend (React) rodando em outra porta acesse a API.
origins = [
    "http://localhost:5173",  # Vite Localhost
    "http://127.0.0.1:5173",  # Vite Localhost (IP)
    # Adicionar domínio de produção aqui futuramente
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"], # Permite Authorization e outros headers
)

# --- Registro de Rotas (Routers) ---
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(document_router.router)
app.include_router(ai_router.router)
app.include_router(admin_router.router)
app.include_router(dashboard_router.router)

# Rota de Health Check (útil para monitoramento)
@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "1.0.3", "system": "LicitaDoc API"}
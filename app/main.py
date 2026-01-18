from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.models import user_model, document_model
from app.routers import auth_router, document_router, admin_router, ai_router

# Cria as tabelas ao iniciar (dev only)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LicitaDoc API", 
    version="0.4.0",
    description="API para gestão de documentos de licitação com inteligência artificial."
)

# --- 2. CONFIGURAÇÃO DO CORS (O Fix) ---
# Isso permite que o Frontend (localhost:5173) converse com o Backend
origins = [
    "http://localhost:5173",  # Endereço do React/Vite
    "http://127.0.0.1:5173",  # Variação comum
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Quem pode acessar
    allow_credentials=True,      # Permitir cookies/tokens
    allow_methods=["*"],         # Permitir GET, POST, PUT, DELETE...
    allow_headers=["*"],         # Permitir todos os cabeçalhos
)
# ---------------------------------------

# Registrando as rotas
app.include_router(auth_router.router) # <--- Conecta o router de Auth
app.include_router(document_router.router) # <--- Conecta o router de Documentos
app.include_router(admin_router.router) # <--- Conecta o router de Admin
app.include_router(ai_router.router) # <--- Conecta o router de AI

@app.get("/")
def read_root():
    return {"message": "Sistema LicitaDoc Operante", "docs": "/docs"}
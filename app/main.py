from fastapi import FastAPI
from app.core.database import engine, Base
from app.models import user_model, document_model
from app.routers import auth_router, document_router, admin_router, ai_router

# Cria as tabelas ao iniciar (dev only)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LicitaDoc API", 
    version="0.1.0",
    description="API para gestão de documentos de licitação com inteligência artificial."
)
# Registrando as rotas
app.include_router(auth_router.router) # <--- Conecta o router de Auth
app.include_router(document_router.router) # <--- Conecta o router de Documentos
app.include_router(admin_router.router) # <--- Conecta o router de Admin
app.include_router(ai_router.router) # <--- Conecta o router de AI

@app.get("/")
def read_root():
    return {"message": "Sistema LicitaDoc Operante", "docs": "/docs"}
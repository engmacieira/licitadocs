from fastapi import FastAPI
from app.core.database import engine, Base
from app.models import user_model # Importar para registrar as tabelas na Base

# Cria as tabelas no banco de dados (equivalente a uma migration simples)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="LicitaDoc API", version="0.1.0")

@app.get("/")
def read_root():
    return {"message": "Sistema LicitaDoc Operante", "docs": "/docs"}
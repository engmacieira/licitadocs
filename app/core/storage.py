"""
Módulo de Storage.
Responsável por salvar arquivos físicos no disco (e futuramente na nuvem).
Data: Sprint 02
"""
import shutil
import os
import uuid
from fastapi import UploadFile

# Diretório onde vamos salvar (pode vir do .env)
UPLOAD_DIR = "storage/uploads"

def init_storage():
    """Garante que a pasta de uploads existe."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_file_locally(file: UploadFile) -> str:
    """
    Salva o arquivo recebido no disco local com um nome único.
    
    Args:
        file (UploadFile): O arquivo enviado pelo FastAPI.
        
    Returns:
        str: O caminho relativo onde o arquivo foi salvo (para salvar no banco).
    """
    # 1. Garantir que o storage existe
    init_storage()
    
    # 2. Gerar nome único (UUID) mantendo a extensão original
    # Ex: boleto.pdf -> a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11.pdf
    extension = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4()}.{extension}"
    file_path = f"{UPLOAD_DIR}/{unique_name}"
    
    # 3. Escrever os bytes no disco
    # O shutil.copyfileobj é eficiente para arquivos grandes (não carrega tudo na RAM)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return file_path
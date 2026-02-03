"""
Módulo de Armazenamento (Storage).
Abstrai a lógica de salvar arquivos. Hoje é local, amanhã pode ser S3/Azure.
"""
import shutil
import os
import uuid
from fastapi import UploadFile

# Define o caminho absoluto para evitar erros de diretório relativo
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "storage", "uploads")

def init_storage():
    """Cria a pasta storage/uploads se não existir."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_file_locally(file: UploadFile) -> str:
    """
    Salva o arquivo recebido no disco com um nome UUID único.
    Retorna: Caminho relativo para salvar no banco.
    """
    init_storage()
    
    # Extrai extensão (ex: .pdf)
    filename = file.filename or "unknown"
    extension = filename.split(".")[-1] if "." in filename else "bin"
    
    # Gera nome único
    unique_name = f"{uuid.uuid4()}.{extension}"
    
    # Monta caminho completo (seguro para Windows/Linux)
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    # Salva o conteúdo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise IOError(f"Falha ao gravar arquivo no disco: {e}")
        
    # Retorna caminho relativo (para portabilidade do banco)
    return f"storage/uploads/{unique_name}"
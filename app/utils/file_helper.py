import os
import shutil
import uuid
from fastapi import UploadFile
from pathlib import Path

# Pasta onde salvaremos os uploads
UPLOAD_DIR = Path("storage/uploads")

def save_upload_file(upload_file: UploadFile, subfolder: str) -> tuple[str, int]:
    """
    Salva um arquivo de upload no disco e retorna (caminho_relativo, tamanho_bytes).
    """
    try:
        # Garante que a pasta existe
        target_dir = UPLOAD_DIR / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)

        # Gera um nome único mantendo a extensão original
        file_ext = Path(upload_file.filename).suffix
        unique_name = f"{uuid.uuid4()}{file_ext}"
        file_path = target_dir / unique_name

        # Grava os bytes no disco
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        # --- CORREÇÃO AQUI ---
        # Calculamos o tamanho do arquivo que acabamos de salvar
        file_size = os.path.getsize(file_path)
        
        # Retorna o caminho como string e o tamanho como inteiro
        return str(file_path), file_size

    except Exception as e:
        print(f"Erro ao salvar arquivo: {e}")
        # Se der erro, tentamos limpar o arquivo parcial se ele foi criado
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise e
    finally:
        # Importante: fecha o ponteiro do arquivo recebido do FastAPI
        upload_file.file.close()
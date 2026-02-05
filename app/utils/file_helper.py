import os
import shutil
from fastapi import UploadFile
from pathlib import Path

# Pasta onde salvaremos os uploads (fora do código fonte para não reiniciar o servidor em dev)
UPLOAD_DIR = Path("storage/uploads")

def save_upload_file(upload_file: UploadFile, subfolder: str) -> str:
    """
    Salva um arquivo de upload no disco e retorna o caminho relativo.
    Ex: storage/uploads/companies/{uuid}/arquivo.pdf
    """
    try:
        # Garante que a pasta existe
        target_dir = UPLOAD_DIR / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)

        # Gera um caminho final (mantendo o nome original por enquanto)
        # TODO: No futuro, gerar UUID para o nome do arquivo para evitar conflitos/sanitizar
        file_path = target_dir / upload_file.filename

        # Grava os bytes no disco
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        return str(file_path)
    except Exception as e:
        print(f"Erro ao salvar arquivo: {e}")
        raise e
    finally:
        upload_file.file.close()
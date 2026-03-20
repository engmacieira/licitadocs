"""
Utilitários para Manipulação de Arquivos.
Fornece funções auxiliares para salvamento físico, cálculo de metadados 
e gestão de subpastas no storage do LicitaDoc.
"""

import os
import shutil
import uuid
import logging
from pathlib import Path
from fastapi import UploadFile

# Configuração de Logs
logger = logging.getLogger("app.utils.file_helper")

# Definição do diretório base de uploads
# Busca a pasta 'storage/uploads' na raiz do projeto
UPLOAD_DIR = Path("storage/uploads")

def save_upload_file(upload_file: UploadFile, subfolder: str) -> tuple[str, int]:
    """
    Salva um arquivo de upload no disco e extrai seus metadados básicos.
    
    Args:
        upload_file (UploadFile): Objeto do arquivo vindo do FastAPI.
        subfolder (str): Nome da subpasta de destino (ex: 'certidoes', 'procuracoes').
        
    Returns:
        tuple[str, int]: Uma tupla contendo o (caminho_relativo, tamanho_em_bytes).
        
    Raises:
        Exception: Caso ocorra erro na escrita ou permissão de diretório.
    """
    file_path = None
    try:
        # 1. Preparação do Diretório
        target_dir = UPLOAD_DIR / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)

        # 2. Geração de Nome Único mantendo a extensão original
        file_ext = Path(upload_file.filename).suffix if upload_file.filename else ".bin"
        unique_name = f"{uuid.uuid4()}{file_ext}"
        file_path = target_dir / unique_name

        # 3. Escrita dos Bytes no Disco
        # Usamos o 'shutil.copyfileobj' para eficiência de memória com arquivos grandes
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        # 4. Cálculo de Metadados Pós-Escrita
        file_size = os.path.getsize(file_path)
        
        logger.info(f"✅ [FILE_HELPER] Arquivo salvo: {unique_name} em {subfolder} ({file_size} bytes)")
        
        # Retorna o caminho como string (para o banco) e o tamanho
        return str(file_path), file_size

    except Exception as e:
        logger.error(f"❌ [FILE_HELPER] Falha ao salvar upload: {str(e)}")
        
        # Cleanup: Se o arquivo foi criado mas houve erro depois (ex: no getsize), removemos
        if file_path and file_path.exists():
            file_path.unlink()
            
        raise e
        
    finally:
        # Protocolo de Segurança: Sempre fecha o ponteiro do arquivo
        upload_file.file.close()
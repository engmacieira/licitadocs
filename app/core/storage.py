"""
Módulo de Gestão de Armazenamento (Storage).
Abstrai a persistência de arquivos físicos (PDFs de certidões e procurações).
Projetado para ser facilmente portável para S3 ou Azure Blob Storage no futuro.
"""

import shutil
import os
import uuid
import logging
from fastapi import UploadFile

# Configuração de Logs para rastreio de operações de arquivo
logger = logging.getLogger("app.storage")

# 1. Definição de Caminhos
# Busca a raiz do projeto para garantir caminhos absolutos robustos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "storage", "uploads")

def init_storage():
    """
    Inicializa o diretório de uploads caso ele não exista.
    Garante que o servidor não quebre ao tentar salvar o primeiro arquivo.
    """
    if not os.path.exists(UPLOAD_DIR):
        try:
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            logger.info(f"📂 [STORAGE] Diretório criado com sucesso: {UPLOAD_DIR}")
        except Exception as e:
            logger.error(f"❌ [STORAGE] Falha crítica ao criar diretório: {e}")

def save_file_locally(file: UploadFile) -> str:
    """
    Recebe um arquivo do FastAPI, gera um nome único e salva no disco.
    
    Args:
        file (UploadFile): O objeto do arquivo vindo da requisição HTTP.
        
    Returns:
        str: O caminho relativo do arquivo (ex: 'storage/uploads/uuid.pdf') 
             para ser persistido no banco de dados.
             
    Raises:
        IOError: Se houver falha na escrita física do arquivo.
    """
    init_storage()
    
    # Extração de metadados de forma segura
    original_filename = file.filename or "documento_desconhecido"
    extension = original_filename.split(".")[-1] if "." in original_filename else "bin"
    
    # Geração de Identificador Único (Evita sobrescrever arquivos com nomes iguais)
    unique_name = f"{uuid.uuid4()}.{extension}"
    
    # Construção do caminho final de destino
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    try:
        # Escrita em bloco para eficiência de memória
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"✅ [STORAGE] Arquivo salvo: {unique_name}")
        
        # Retornamos o caminho relativo para garantir portabilidade entre ambientes
        return f"storage/uploads/{unique_name}"
        
    except Exception as e:
        logger.error(f"❌ [STORAGE] Erro ao gravar arquivo {unique_name}: {str(e)}")
        raise IOError(f"Não foi possível salvar o arquivo no servidor: {e}")

def delete_file_locally(relative_path: str):
    """
    Remove um arquivo do disco. Útil para limpezas ou substituições.
    
    Args:
        relative_path (str): O caminho salvo no banco de dados.
    """
    full_path = os.path.join(BASE_DIR, relative_path)
    if os.path.exists(full_path):
        os.remove(full_path)
        logger.info(f"🗑️ [STORAGE] Arquivo removido: {relative_path}")
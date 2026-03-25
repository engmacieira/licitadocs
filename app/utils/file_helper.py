"""
Utilitários para Manipulação de Arquivos.
Fornece funções auxiliares para salvamento físico, cálculo de metadados 
e gestão de subpastas no storage do LicitaDoc.
"""

import os
import uuid
import logging
import aiofiles
from pathlib import Path
from fastapi import UploadFile

# Configuração de Logs
logger = logging.getLogger("app.utils.file_helper")

# Definição do diretório base de uploads
# Cloud Ready: Busca o caminho do .env ou usa o padrão local
# TODO: No futuro, acoplar integração com AWS S3 (boto3) aqui
UPLOAD_DIR = Path(os.getenv("STORAGE_PATH", "storage/uploads"))

async def save_upload_file(upload_file: UploadFile, subfolder: str) -> tuple[str, int]:
    """
    Salva um arquivo de upload no disco e extrai seus metadados básicos de forma assíncrona.
    
    Args:
        upload_file (UploadFile): Objeto do arquivo vindo do FastAPI.
        subfolder (str): Nome da subpasta de destino (ex: 'certidoes', 'procuracoes').
        
    Returns:
        tuple[str, int]: Uma tupla contendo o (caminho_relativo, tamanho_em_bytes).
        
    Raises:
        ValueError: Se for detectada uma tentativa de Path Traversal.
        Exception: Caso ocorra erro na escrita ou permissão de diretório.
    """
    file_path = None
    try:
        # 1. Preparação do Diretório e Proteção contra Path Traversal
        # Resolvemos os caminhos para garantir que subfolder não aponte para fora de UPLOAD_DIR
        base_dir = UPLOAD_DIR.resolve()
        target_dir = (base_dir / subfolder).resolve()

        if not target_dir.is_relative_to(base_dir):
            logger.warning(f"🚨 [FILE_HELPER] Path Traversal detectado! Tentativa em: {subfolder}")
            raise ValueError("Path Traversal detectado")

        target_dir.mkdir(parents=True, exist_ok=True)

        # 2. Geração de Nome Único mantendo a extensão original
        file_ext = Path(upload_file.filename).suffix if upload_file.filename else ".bin"
        unique_name = f"{uuid.uuid4()}{file_ext}"
        file_path = target_dir / unique_name

        # 3. Escrita Assíncrona dos Bytes no Disco
        # Usamos aiofiles para não bloquear a thread principal do FastAPI
        async with aiofiles.open(file_path, "wb") as buffer:
            # Lemos o conteúdo do UploadFile e escrevemos no buffer
            content = await upload_file.read()
            await buffer.write(content)

        # 4. Cálculo de Metadados Pós-Escrita
        file_size = os.path.getsize(file_path)
        
        logger.info(f"✅ [FILE_HELPER] Arquivo salvo: {unique_name} em {subfolder} ({file_size} bytes)")
        
        # Retorna o caminho como string (para o banco) e o tamanho
        return str(file_path), file_size

    except Exception as e:
        logger.error(f"❌ [FILE_HELPER] Falha ao salvar upload: {str(e)}")
        
        # Cleanup: Se o arquivo foi criado mas houve erro depois, removemos
        if file_path and file_path.exists():
            file_path.unlink()
            
        raise e
        
    finally:
        # Protocolo de Segurança: Sempre fecha o ponteiro do arquivo
        await upload_file.close()

def delete_file(relative_path: str):
    """
    Remove um arquivo do disco de forma síncrona. 
    Usado para limpezas ou reversão de transações.
    
    Args:
        relative_path (str): Caminho relativo ou absoluto do arquivo.
    """
    try:
        path = Path(relative_path)
        # Se for relativo, resolvemos a partir da base
        if not path.is_absolute():
            # Tenta resolver a partir de UPLOAD_DIR ou BASE_DIR se necessário
            # mas geralmente o path já vem completo (str(file_path)) do save_upload_file
            pass
            
        if path.exists() and path.is_file():
            path.unlink()
            logger.info(f"🗑️ [FILE_HELPER] Arquivo removido: {relative_path}")
    except Exception as e:
        logger.error(f"❌ [FILE_HELPER] Erro ao deletar arquivo {relative_path}: {e}")

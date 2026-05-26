"""
Utilitários para Manipulação de Arquivos via Supabase Storage.
Fornece funções para salvamento, recuperação e exclusão de arquivos na nuvem.
"""

import os
import uuid
import logging
import asyncio
from pathlib import Path
from fastapi import UploadFile
from supabase import create_client, Client
from app.core.config import settings

# Configuração de Logs
logger = logging.getLogger("app.utils.file_helper")

# Instância do cliente Supabase para Storage
# Nota: Em produção, usar chaves de serviço se necessário para bypass de RLS de admin
supabase: Client = create_client(settings.SUPABASE_URL or "", settings.SUPABASE_KEY or "")

async def save_upload_file(upload_file: UploadFile, subfolder: str) -> tuple[str, int]:
    """
    Faz o upload de um arquivo para o Supabase Storage.

    Args:
        upload_file (UploadFile): Objeto do arquivo vindo do FastAPI.
        subfolder (str): Nome do bucket de destino (ex: 'cofre-digital', 'editais').

    Returns:
        tuple[str, int]: Uma tupla contendo o (caminho_relativo, tamanho_em_bytes).
    """
    try:
        # 1. Preparação
        file_ext = Path(upload_file.filename).suffix if upload_file.filename else ".bin"
        unique_name = f"{uuid.uuid4()}{file_ext}"

        # Lemos o conteúdo do UploadFile
        content = await upload_file.read()
        file_size = len(content)

        # 2. Upload para o Supabase Storage
        # subfolder aqui atua como o nome do BUCKET
        res = supabase.storage.from_(subfolder).upload(
            path=unique_name,
            file=content,
            file_options={"content-type": upload_file.content_type}
        )

        # O retorno esperado no banco é o caminho relativo dentro do bucket ou uma URL
        # Para consistência com o sistema atual, retornamos o nome do arquivo único
        # ou o caminho 'bucket/filename'
        storage_path = f"{subfolder}/{unique_name}"

        logger.info(f"✅ [FILE_HELPER] Arquivo enviado ao Supabase: {unique_name} no bucket {subfolder} ({file_size} bytes)")

        return storage_path, file_size

    except Exception as e:
        logger.error(f"❌ [FILE_HELPER] Falha ao enviar upload para Supabase: {str(e)}")
        raise e

    finally:
        await upload_file.close()

def delete_file(path_string: str):
    """
    Remove um arquivo do Supabase Storage.

    Args:
        path_string (str): Caminho no formato 'bucket/filename'.
    """
    try:
        if "/" not in path_string:
            return

        bucket, filename = path_string.split("/", 1)
        supabase.storage.from_(bucket).remove([filename])
        logger.info(f"🗑️ [FILE_HELPER] Arquivo removido do Supabase: {path_string}")
    except Exception as e:
        logger.error(f"❌ [FILE_HELPER] Erro ao deletar arquivo no Supabase {path_string}: {e}")

async def get_file_url(path_string: str, expires_in: int = 3600) -> str:
    """
    Gera uma URL assinada (temporária) para visualização do arquivo.
    """
    try:
        bucket, filename = path_string.split("/", 1)
        res = supabase.storage.from_(bucket).create_signed_url(filename, expires_in)
        return res['signedURL']
    except Exception as e:
        logger.error(f"❌ [FILE_HELPER] Erro ao gerar URL assinada: {e}")
        return ""

"""
Router de Gestão de Documentos (Cofre Digital).
Controla o upload, download, listagem unificada e o catálogo de tipos de certidões.
"""
import os
import io
import zipfile
import stat
import aiofiles
from stream_zip import async_stream_zip, ZIP_64
from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status as http_status, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.rate_limit import limiter
from app.core.database import get_db
from app.dependencies import get_current_active_user, require_role
from app.utils.file_helper import save_upload_file # Mudança para o nosso utilitário padronizado
from app.models.user_model import User, UserRole
from app.models.document_model import Document
from app.models.certificate_model import Certificate
from app.models.document_type_model import DocumentType

from app.repositories.document_repository import DocumentRepository
from app.repositories.message_repository import MessageRepository
from app.schemas.message_schemas import MessageCreate
from app.schemas.document_schemas import (
    DocumentResponse, DocumentCategoryResponse, DocumentTypeResponse,
    DocumentCategoryCreate, DocumentCategoryUpdate,
    DocumentTypeCreate, DocumentTypeUpdate, DocumentUpdate
)

router = APIRouter(prefix="/documents", tags=["Gestão de Documentos (Cofre)"])

# ==========================================
# 🗂️ CATÁLOGO DE TIPOS (Admin & Frontend)
# ==========================================

@router.get(
    "/types", 
    response_model=List[DocumentCategoryResponse],
    summary="Listar Catálogo de Documentos",
    description="Retorna todas as categorias ativas e os seus respetivos tipos para popular os menus do Frontend."
)
def get_document_types_catalog(db: Session = Depends(get_db)):
    # Já protegido pelo repositório
    return DocumentRepository.get_all_categories_with_types(db)

# ==========================================
# 📑 LISTAGEM E MONITORAMENTO DO COFRE
# ==========================================

@router.get(
    "/", 
    response_model=List[DocumentResponse],
    summary="Listar Documentos do Cofre (Unificado)"
)
def list_documents(
    company_id: Optional[str] = Query(None, description="Filtra por empresa (Obrigatório para Admin)"),
    is_client_upload: Optional[bool] = Query(None, description="Filtra por quem enviou (Cofre vs Cliente)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    target_company_id = company_id
    allowed_company_ids = [link.company_id for link in current_user.company_links if link.is_active]

    # Validação de Segurança Multi-Tenant
    if current_user.role == UserRole.ADMIN.value:
         if not target_company_id:
             raise HTTPException(status_code=400, detail="Admins devem especificar o company_id para listar os documentos.")
    else:
        if target_company_id:
            if target_company_id not in allowed_company_ids:
                raise HTTPException(status_code=403, detail="Acesso negado a esta empresa.")
        elif allowed_company_ids:
            target_company_id = allowed_company_ids[0]
        else:
            return []

    return DocumentRepository.get_unified_by_company(db, target_company_id, is_client_upload)

@router.get(
    "/expiring", 
    response_model=List[DocumentResponse],
    summary="Monitoramento de Validades Globais (Admin)"
)
def get_expiring_documents(
    days: int = Query(30, description="Dias para o vencimento"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    """Retorna todos os documentos de todas as empresas que estão vencidos ou a vencer em X dias."""
    return DocumentRepository.get_expiring_global(db, days_threshold=days)

@router.get(
    "/irregular", 
    response_model=List[DocumentResponse],
    summary="Monitoramento de Irregularidades (Admin)"
)
def get_irregular_documents(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    """Retorna todos os documentos com erro ou irregularidade, de todas as empresas."""
    return DocumentRepository.get_irregular_global(db)

# ==========================================
# 📤 UPLOAD, DOWNLOAD E EXCLUSÃO
# ==========================================

@router.post(
    "/upload", 
    response_model=DocumentResponse, 
    status_code=http_status.HTTP_201_CREATED,
    summary="Upload de Documento ou Certidão"
)
async def upload_document(
    title: Optional[str] = Form(None),
    type_id: Optional[str] = Form(None),
    authentication_code: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None, description="Ficheiro PDF (Opcional se for registo de pendência)"),
    expiration_date: Optional[date] = Form(None), 
    target_company_id: Optional[str] = Form(None),
    company_id: Optional[str] = Form(None), 
    status: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Gere a entrada de documentos manuais (Cliente) e estruturados (Admin/Automação)."""
    final_company_id = target_company_id or company_id
    
    # Validação de Acesso
    if current_user.role != UserRole.ADMIN.value:
        active_links = [link.company_id for link in current_user.company_links if link.is_active]
        if not active_links:
            raise HTTPException(status_code=403, detail="O utilizador não está vinculado a nenhuma empresa ativa.")
        
        if not final_company_id:
            final_company_id = active_links[0]
        elif final_company_id not in active_links:
            raise HTTPException(status_code=403, detail="Acesso negado a esta empresa.")
    elif not final_company_id:
        raise HTTPException(status_code=400, detail="Admins devem enviar o ID da empresa destino.")

    # TRATAMENTO DO ARQUIVO (Usando o nosso File Helper)
    if file:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Apenas ficheiros PDF são permitidos.")

        MAX_FILE_SIZE = 5 * 1024 * 1024 # 5MB
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=http_status.HTTP_413_CONTENT_TOO_LARGE, detail="Ficheiro maior que 5MB.")

        try:
            # Missão 1: Blindagem contra Malware (Magic Numbers)
            header = await file.read(5)
            await file.seek(0)
            if header != b"%PDF-":
                raise HTTPException(status_code=400, detail="O conteúdo do ficheiro não é um PDF válido (Assinatura inválida).")

            file_path, _ = await save_upload_file(file, "vault")
            filename = file.filename
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail="Falha ao guardar ficheiro no disco.")
    else:
        filename = "Registo de Pendência"
        file_path = "SEM_ANEXO"

    is_client = (current_user.role != UserRole.ADMIN.value)

    # 1. FLUXO: Certidão Estruturada (Com Type_ID)
    if type_id:
        try:
            cert = DocumentRepository.create_certificate(
                db=db, type_id=type_id, filename=filename, file_path=file_path,
                company_id=final_company_id, expiration_date=expiration_date,
                authentication_code=authentication_code
            )
        except Exception as e:
            # Missão 2: Prevenção de Arquivos Zumbis (Rollback Físico)
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass
            raise HTTPException(status_code=500, detail=str(e))
            
        # ---> CORREÇÃO DO BUG 1 AQUI <---
        # Aplica o status customizado na certidão estruturada e salva no banco
        if status:
            cert.status = status
            db.commit()
            db.refresh(cert)

        # Automação de Alertas
        if status in ["error", "irregular"]:
            doc_type_obj = db.query(DocumentType).filter(DocumentType.id == type_id).first()
            cat_name = doc_type_obj.category.name if doc_type_obj and doc_type_obj.category else "Categoria Geral"
            doc_name = doc_type_obj.name if doc_type_obj else "Documento"

            alert_msg = MessageCreate(
                subject=f"⚠️ Alerta de Irregularidade: {doc_name}",
                content=(
                    "O documento recém-adicionado ao seu cofre apresentou irregularidades/pendências.\n"
                    f"Documento: {cat_name} - {doc_name}\n"
                    f"Observações do Analista: {notes or 'Sem observações adicionais.'}\n\n"
                    "Favor regularizar o mais rápido possível."
                ),
                message_type="action_required",
                related_document_id=cert.id
            )
            MessageRepository.create(db, final_company_id, current_user.id, alert_msg)

        return DocumentResponse(
            id=cert.id, filename=cert.filename, status=cert.status, created_at=cert.created_at,
            is_structured=True, type_id=type_id, authentication_code=authentication_code,
            is_client_upload=False, company_id=str(cert.company_id)
        )
            
    # 2. FLUXO: Documento Legado/Manual (Sem Type_ID)
    else:
        if not title: title = "Documento Sem Título"
        try:
            doc = DocumentRepository.create_legacy(
                db=db, title=title, filename=filename, file_path=file_path,
                company_id=final_company_id, expiration_date=expiration_date, 
                uploaded_by_id=current_user.id,
                is_client_upload=is_client 
            )
            
            if status:
                doc.status = status
                db.commit()

            if status in ["error", "irregular"]:
                alert_msg = MessageCreate(
                    subject=f"⚠️ Alerta de Irregularidade: {title}",
                    content=(
                        "O documento recém-adicionado ao seu cofre apresentou irregularidades/pendências.\n"
                        f"Documento: Outros - {title}\n"
                        f"Observações: {notes or 'Sem observações adicionais.'}\n\n"
                        "Favor regularizar o mais rápido possível."
                    ),
                    message_type="action_required",
                    related_document_id=doc.id
                )
                MessageRepository.create(db, final_company_id, current_user.id, alert_msg)

            return DocumentResponse(
                id=doc.id, title=doc.title, filename=doc.filename, status=doc.status, 
                created_at=doc.created_at, is_structured=False, is_client_upload=is_client,
                company_id=str(doc.company_id)
            )
        except Exception as e:
            # Missão 2: Prevenção de Arquivos Zumbis (Rollback Físico)
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass
            raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/{item_id}/download",
    summary="Download de Documento",
    description="Protegido com Rate Limiting: Máximo de 60 downloads por minuto por IP."
)
@limiter.limit("60/minute")
def download_document(
    request: Request,
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Download de arquivo do cofre com validação de propriedade (Anti-IDOR/BOLA).
    """
    # 1. Busca os metadados para descobrir a quem pertence (Respeita Soft Delete)
    doc = db.query(Document).filter(Document.id == item_id, Document.deleted_at.is_(None)).first()
    if not doc:
        doc = db.query(Certificate).filter(Certificate.id == item_id, Certificate.deleted_at.is_(None)).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    # 2. Validação de Segurança Multi-Tenant
    if current_user.role != UserRole.ADMIN.value:
        allowed_company_ids = [link.company_id for link in current_user.company_links if link.is_active]
        if doc.company_id not in allowed_company_ids:
             raise HTTPException(status_code=403, detail="Acesso negado: Este documento pertence a outra empresa.")

    file_path = doc.file_path
    
    if not file_path or file_path == "SEM_ANEXO":
        raise HTTPException(status_code=400, detail="Este registo não possui um anexo físico para download.")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Ficheiro físico não encontrado no servidor.")

    filename = os.path.basename(file_path)
    return FileResponse(path=file_path, filename=filename, media_type='application/pdf')

@router.get(
    "/export/zip",
    summary="Exportar Documentos Válidos em Lote (ZIP)",
    description="Gera um arquivo .zip com todos os documentos vigentes e não arquivados da empresa em streaming."
)
async def export_valid_documents_zip(
    company_id: Optional[str] = Query(None, description="Filtra por empresa (Obrigatório para Admin)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Constrói um arquivo ZIP em fluxo (stream) contendo os anexos físicos
    de todos os documentos com status 'valid' ou 'warning', evitando estourar a RAM
    usando complexidade espacial O(1).
    """
    # 1. Validação de Segurança Multi-Tenant
    target_company_id = company_id
    allowed_company_ids = [link.company_id for link in current_user.company_links if link.is_active]

    if current_user.role == UserRole.ADMIN.value:
         if not target_company_id:
             raise HTTPException(status_code=400, detail="Admins devem especificar o company_id para exportar os documentos.")
    else:
        if target_company_id:
            if target_company_id not in allowed_company_ids:
                raise HTTPException(status_code=403, detail="Acesso negado a esta empresa.")
        elif allowed_company_ids:
            target_company_id = allowed_company_ids[0]
        else:
            raise HTTPException(status_code=403, detail="Utilizador não possui empresa ativa vinculada.")

    # 2. Busca os documentos da empresa, IGNORANDO uploads pendentes do cliente
    all_docs = DocumentRepository.get_unified_by_company(
        db=db, 
        company_id=target_company_id, 
        is_client_upload=False
    )
    
    # 3. Filtragem de Regra de Negócio: Apenas Válidos e Vigentes
    valid_statuses = ["valid", "warning"]
    valid_docs = [doc for doc in all_docs if doc["status"] in valid_statuses]
    
    if not valid_docs:
        raise HTTPException(status_code=404, detail="Nenhum documento válido/vigente encontrado para exportação.")

    # 4. Pré-carregar caminhos de arquivo baseados no Database de forma síncrona
    # pra não prender Sessão do DB no generator assíncrono atrasado pela I/O de rede
    files_metadata = []
    for doc in valid_docs:
        file_path = DocumentRepository.get_file_path(db, doc["id"])
        # (AQUI) Agora também validamos se o arquivo realmente existe no SO
        if file_path and file_path != "SEM_ANEXO" and os.path.exists(file_path):
            files_metadata.append({
                "path": file_path,
                "filename": doc["filename"]
            })

    if not files_metadata:
         raise HTTPException(
             status_code=404, 
             detail="Documentos encontrados, mas os ficheiros físicos não existem no servidor de armazenamento."
         )

    # 5. Gerador Assíncrono de Arquivos para o stream_zip
    async def get_files():
        added_files = set()
        for doc_meta in files_metadata:
            file_path = doc_meta["path"]
            original_filename = doc_meta["filename"]

            # PREVENÇÃO DE RACE CONDITION (Soft validation)
            if not os.path.exists(file_path):
                continue

            base_name, ext = os.path.splitext(original_filename)
            zip_filename = original_filename
            counter = 1
            while zip_filename in added_files:
                zip_filename = f"{base_name}_{counter}{ext}"
                counter += 1
            added_files.add(zip_filename)

            modified_at = datetime.now()
            perms = stat.S_IFREG | 0o600

            # Função de leitura em blocos do arquivo físico (HARD Race condition failover)
            async def get_chunks(fp=file_path, fname=original_filename):
                try:
                    async with aiofiles.open(fp, "rb") as f:
                        while chunk := await f.read(65536):
                            yield chunk
                except FileNotFoundError:
                    # Se for hard deleted no nanosegundo entre exists() e aiofiles.open()
                    msg = f"Ficheiro {fname} indisponivel e deletado durante o download."
                    yield msg.encode("utf-8")

            # Yield seguindo os contratos do stream-zip
            yield (zip_filename, modified_at, perms, ZIP_64, get_chunks())

    # 6. Streamer final que re-passa os bytes montados da central do ZIP
    async def zip_streamer():
        async for chunk in async_stream_zip(get_files()):
            yield chunk

    # 7. Retorno como Streaming Nativo Assíncrono
    return StreamingResponse(
        zip_streamer(),
        media_type="application/x-zip-compressed",
        headers={
            "Content-Disposition": "attachment; filename=documentos_validos.zip",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.delete(
    "/{item_id}", 
    status_code=http_status.HTTP_204_NO_CONTENT,
    summary="Eliminar Documento do Cofre"
)
def delete_document(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove um documento do cofre. Agora implementa SOFT DELETE.
    O ficheiro não é apagado fisicamente para manter o histórico de auditoria.
    """
    doc = db.query(Document).filter(Document.id == item_id, Document.deleted_at.is_(None)).first()
    is_legacy = True
    
    if not doc:
        doc = db.query(Certificate).filter(Certificate.id == item_id, Certificate.deleted_at.is_(None)).first()
        is_legacy = False
        
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado no Cofre.")
        
    # Segurança
    if current_user.role != UserRole.ADMIN.value:
        allowed_company_ids = [link.company_id for link in current_user.company_links]
        if doc.company_id not in allowed_company_ids:
             raise HTTPException(status_code=403, detail="Acesso negado para eliminar este documento.")
             
    # Aplica o SOFT DELETE em vez de apagar do disco e dar db.delete()
    doc.deleted_at = datetime.now()
    db.commit()
    return None

@router.patch(
    "/{document_id}",
    summary="Atualizar Metadados (Validade/Código)"
)
def update_document_metadata(
    document_id: str, 
    payload: DocumentUpdate, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    updated_info = DocumentRepository.update_metadata(
        db=db, 
        item_id=document_id, 
        expiration_date=payload.expiration_date, 
        authentication_code=payload.authentication_code,
        status=payload.status
    )
    
    if not updated_info:
        raise HTTPException(status_code=404, detail="Documento não encontrado no cofre.")
        
    return updated_info
"""
Repositório de Documentos e Certificados.
Responsável pela persistência e leitura unificada (Cofre).
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List
from datetime import date

from app.models.document_model import Document, DocumentStatus
from app.models.certificate_model import Certificate, CertificateStatus
from app.models.document_category_model import DocumentCategory
from app.models.document_type_model import DocumentType

class DocumentRepository:
    
    # --- CATÁLOGO (Sprint 17) ---
    @staticmethod
    def get_all_categories_with_types(db: Session) -> List[DocumentCategory]:
        """
        Traz as categorias e seus tipos em uma única query otimizada (Eager Loading).
        """
        return db.query(DocumentCategory)\
            .options(joinedload(DocumentCategory.types))\
            .order_by(DocumentCategory.order)\
            .all()

    # --- UPLOAD LEGADO ---
    @staticmethod
    def create_legacy(
        db: Session, title: str, filename: str, file_path: str, company_id: str, 
        expiration_date: Optional[date] = None, uploaded_by_id: Optional[str] = None
    ) -> Document:
        db_doc = Document(
            title=title, filename=filename, file_path=file_path,
            company_id=company_id, expiration_date=expiration_date,
            status=DocumentStatus.VALID.value, uploaded_by_id=uploaded_by_id
        )
        try:
            db.add(db_doc)
            db.commit()
            db.refresh(db_doc)
            return db_doc
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError(f"Erro ao registrar documento legado: {str(e)}")

    # --- UPLOAD ESTRUTURADO (Sprint 17) ---
    @staticmethod
    def create_certificate(
        db: Session, type_id: str, filename: str, file_path: str, company_id: str,
        expiration_date: Optional[date] = None, authentication_code: Optional[str] = None
    ) -> Certificate:
        cert = Certificate(
            type_id=type_id, filename=filename, file_path=file_path,
            company_id=company_id, expiration_date=expiration_date,
            authentication_code=authentication_code,
            status=CertificateStatus.VALID.value
        )
        try:
            db.add(cert)
            db.commit()
            db.refresh(cert)
            return cert
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError(f"Erro ao registrar certificado estruturado: {str(e)}")

    # --- BUSCA UNIFICADA (MERGE) ---
    @staticmethod
    def get_unified_by_company(db: Session, company_id: str) -> List[dict]:
        """
        Faz a fusão da tabela antiga 'documents' com a nova 'certificates'.
        Retorna uma lista de dicionários mapeados para o UnifiedDocumentResponse.
        """
        unified_list = []
        
        # 1. Busca Legados
        legacies = db.query(Document).filter(Document.company_id == company_id).all()
        for doc in legacies:
            unified_list.append({
                "id": doc.id,
                "title": doc.title or "Documento Legado",
                "filename": doc.filename,
                "expiration_date": doc.expiration_date,
                "status": doc.status,
                "created_at": doc.created_at,
                "is_structured": False,
                # 👇 CORREÇÃO: Garantindo que as chaves existam mesmo sendo nulas 👇
                "type_id": None,
                "category_id": None,
                "type_name": None,
                "category_name": None,
                "authentication_code": None
            })

        # 2. Busca Certificados Novos (Com JOIN para pegar nomes da Categoria e Tipo)
        certificates = db.query(Certificate)\
            .options(joinedload(Certificate.document_type).joinedload(DocumentType.category))\
            .filter(Certificate.company_id == company_id).all()
            
        for cert in certificates:
            unified_list.append({
                "id": cert.id,
                "title": cert.document_type.name if cert.document_type else "Certidão",
                "filename": cert.filename,
                "expiration_date": cert.expiration_date,
                "status": cert.status,
                "created_at": cert.created_at,
                "is_structured": True,
                "type_id": cert.type_id,
                "category_id": cert.document_type.category_id if cert.document_type else None,
                "type_name": cert.document_type.name if cert.document_type else None,
                "category_name": cert.document_type.category.name if cert.document_type and cert.document_type.category else None,
                "authentication_code": cert.authentication_code
            })

        # Ordena tudo por data de criação (Mais recentes primeiro)
        unified_list.sort(key=lambda x: x["created_at"], reverse=True)
        return unified_list
        
    @staticmethod
    def get_file_path(db: Session, item_id: str) -> Optional[str]:
        """Busca o caminho físico do arquivo, seja ele legado ou certificado"""
        doc = db.query(Document).filter(Document.id == item_id).first()
        if doc: return doc.file_path
        
        cert = db.query(Certificate).filter(Certificate.id == item_id).first()
        if cert: return cert.file_path
        
        return None
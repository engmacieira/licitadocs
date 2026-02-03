"""
Repositório de Documentos.
Responsável pela persistência dos metadados dos arquivos.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List
from datetime import date

from app.models.document_model import Document, DocumentStatus

class DocumentRepository:
    @staticmethod
    def create(
        db: Session, 
        filename: str, 
        file_path: str, 
        company_id: str, 
        expiration_date: Optional[date] = None,
        uploaded_by_id: Optional[str] = None
    ) -> Document:
        """
        Persiste os metadados do documento.
        """
        # Status inicial padrão
        status = DocumentStatus.VALID
        
        db_doc = Document(
            filename=filename,
            file_path=file_path,
            company_id=company_id,
            expiration_date=expiration_date,
            status=status.value,
            uploaded_by_id=uploaded_by_id
        )
        
        try:
            db.add(db_doc)
            db.commit()
            db.refresh(db_doc)
            return db_doc
        except SQLAlchemyError as e:
            db.rollback()
            # Nota: Em um sistema real, aqui deveríamos deletar o arquivo físico também para não deixar lixo
            raise ValueError(f"Erro ao registrar documento no banco: {str(e)}")

    @staticmethod
    def get_by_company(db: Session, company_id: str) -> List[Document]:
        """Lista todos os documentos de uma empresa (sem paginação, usado pela IA)."""
        return db.query(Document).filter(Document.company_id == company_id).all()
    
    @staticmethod
    def get_all(db: Session, company_id: str, skip: int = 0, limit: int = 100) -> List[Document]:
        """
        Lista paginada de documentos de uma empresa.
        """
        return db.query(Document)\
            .filter(Document.company_id == company_id)\
            .offset(skip)\
            .limit(limit)\
            .all()
            
    @staticmethod
    def get_by_id(db: Session, document_id: str, company_id: str) -> Optional[Document]:
        """
        Busca um documento específico, com verificação de segurança (company_id).
        """
        return db.query(Document)\
            .filter(Document.id == document_id, Document.company_id == company_id)\
            .first()
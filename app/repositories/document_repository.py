from sqlalchemy.orm import Session
from app.models.document_model import Document, DocumentStatus
from datetime import date
from typing import Optional

class DocumentRepository:
    @staticmethod
    def create(
        db: Session, 
        filename: str, 
        file_path: str, 
        company_id: str, 
        expiration_date: Optional[date] = None,
        upload_by_id: Optional[str] = None
    ):
        """
        Cria o registro do documento no banco.
        Nota: O arquivo físico JÁ DEVE ter sido salvo pelo Storage antes de chamar aqui.
        """
        # Define status inicial simples (depois faremos uma rotina inteligente para atualizar isso)
        status = DocumentStatus.VALID
        
        db_doc = Document(
            filename=filename,
            file_path=file_path,
            company_id=company_id,
            expiration_date=expiration_date,
            status=status.value,
            uploaded_by_id=upload_by_id
        )
        
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        return db_doc

    @staticmethod
    def get_by_company(db: Session, company_id: str):
        """Lista todos os documentos de uma empresa."""
        return db.query(Document).filter(Document.company_id == company_id).all()
    
    @staticmethod
    def get_all(db: Session, company_id: str, skip: int = 0, limit: int = 100):
        """
        Lista apenas os documentos pertencentes à empresa do usuário logado.
        """
        return db.query(Document)\
            .filter(Document.company_id == company_id)\
            .offset(skip)\
            .limit(limit)\
            .all()
            
    @staticmethod
    def get_by_id(db: Session, document_id: str, company_id: str):
        """
        Busca um documento específico, garantindo que ele pertença à empresa.
        """
        return db.query(Document)\
            .filter(Document.id == document_id, Document.company_id == company_id)\
            .first()
from sqlalchemy.orm import Session
from app.models.document_model import Document, DocumentStatus
from datetime import date

class DocumentRepository:
    @staticmethod
    def create(db: Session, filename: str, file_path: str, company_id: str, expiration_date: date = None):
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
            status=status.value
        )
        
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        return db_doc

    @staticmethod
    def get_by_company(db: Session, company_id: str):
        """Lista todos os documentos de uma empresa."""
        return db.query(Document).filter(Document.company_id == company_id).all()
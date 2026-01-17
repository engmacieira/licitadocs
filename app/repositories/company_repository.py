from sqlalchemy.orm import Session
from app.models.user_model import Company

class CompanyRepository:
    @staticmethod
    def list_all(db: Session):
        """Retorna todas as empresas cadastradas (Apenas para Admin)."""
        return db.query(Company).all()

    @staticmethod
    def get_by_id(db: Session, company_id: str):
        """Busca uma empresa específica pelo ID."""
        return db.query(Company).filter(Company.id == company_id).first()
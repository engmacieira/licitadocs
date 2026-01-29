from sqlalchemy.orm import Session
from app.models.user_model import Company
from app.schemas.company_schemas import CompanyCreate, CompanyUpdate

class CompanyRepository:
    @staticmethod
    def create(db: Session, company: CompanyCreate):
        db_company = Company(
            razao_social=company.name,
            cnpj=company.cnpj,
        )
        db.add(db_company)
        db.commit()
        db.refresh(db_company)
        return db_company

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Company).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, company_id: str):
        return db.query(Company).filter(Company.id == company_id).first()
    
    @staticmethod
    def get_by_cnpj(db: Session, cnpj: str):
        return db.query(Company).filter(Company.cnpj == cnpj).first()

    @staticmethod
    def update(db: Session, company_id: str, company_data: CompanyUpdate):
        db_company = db.query(Company).filter(Company.id == company_id).first()
        if not db_company:
            return None
        
        # Atualiza apenas os campos que vieram preenchidos
        update_data = company_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key == "name":
                setattr(db_company, "razao_social", value)
            else:
                setattr(db_company, key, value)
            
        db.commit()
        db.refresh(db_company)
        return db_company

    @staticmethod
    def delete(db: Session, company_id: str):
        # Soft Delete (Apenas desativa) ou Hard Delete?
        # Por enquanto vamos de Hard Delete para simplificar o admin
        db_company = db.query(Company).filter(Company.id == company_id).first()
        if db_company:
            db.delete(db_company)
            db.commit()
            return True
        return False
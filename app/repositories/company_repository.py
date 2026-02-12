"""
Repositório de Empresas.
Gerencia o ciclo de vida das entidades Company no banco de dados.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List

from app.models.company_model import Company
from app.schemas.company_schemas import CompanyCreate, CompanyUpdate

class CompanyRepository:
    @staticmethod
    def create(db: Session, company: CompanyCreate) -> Company:
        """
        Cria uma nova empresa.
        """
        db_company = Company(
            razao_social=company.name, # Mapeamento Schema -> Model
            cnpj=company.cnpj,
        )
        try:
            db.add(db_company)
            db.commit()
            db.refresh(db_company)
            return db_company
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError(f"Erro ao criar empresa: {str(e)}")

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Company]:
        """Lista todas as empresas (Paginação simples)."""
        return db.query(Company).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, company_id: str) -> Optional[Company]:
        """Busca empresa por UUID."""
        return db.query(Company).filter(Company.id == company_id).first()
    
    @staticmethod
    def get_by_cnpj(db: Session, cnpj: str) -> Optional[Company]:
        """Busca empresa por CNPJ (Único)."""
        return db.query(Company).filter(Company.cnpj == cnpj).first()

    @staticmethod
    def update(db: Session, company_id: str, company_data: CompanyUpdate) -> Optional[Company]:
        """
        Atualiza dados da empresa.
        Retorna None se não encontrar.
        """
        db_company = db.query(Company).filter(Company.id == company_id).first()
        if not db_company:
            return None
        
        # Atualiza apenas campos preenchidos
        update_data = company_data.model_dump(exclude_unset=True)
        
        try:
            for key, value in update_data.items():
                # Tratamento especial para mapeamento de nomes diferentes
                if key == "name":
                    setattr(db_company, "razao_social", value)
                else:
                    setattr(db_company, key, value)
                
            db.commit()
            db.refresh(db_company)
            return db_company
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError(f"Erro ao atualizar empresa: {str(e)}")

    @staticmethod
    def delete(db: Session, company_id: str) -> bool:
        """
        Remove uma empresa.
        Retorna True se sucesso, False se não encontrada.
        """
        db_company = db.query(Company).filter(Company.id == company_id).first()
        if not db_company:
            return False
            
        try:
            db.delete(db_company)
            db.commit()
            return True
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError(f"Erro ao deletar empresa (possível vínculo com dados): {str(e)}")
"""
Repositório de Empresas.
Gerencia o ciclo de vida das entidades Company no banco de dados.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List

from app.repositories.base_repository import BaseRepository
from app.models.company_model import Company
from app.schemas.company_schemas import CompanyCreate, CompanyUpdate

class CompanyRepository(BaseRepository[Company]):
    # Indica para a classe pai qual é o modelo que estamos manipulando
    model = Company 

    @classmethod
    def create(cls, db: Session, company: CompanyCreate) -> Company:
        """Cria uma nova empresa."""
        db_company = cls.model(
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

    @classmethod
    def get_all(cls, db: Session, skip: int = 0, limit: int = 100) -> List[Company]:
        """Lista todas as empresas ativas (Paginação simples)."""
        # Chama a inteligência do BaseRepository que já filtra os deletados
        return super().get_all(db, skip, limit)

    @classmethod
    def get_by_id(cls, db: Session, company_id: str) -> Optional[Company]:
        """Busca empresa ativa por UUID."""
        # Chama a inteligência do BaseRepository que já filtra os deletados
        return super().get_by_id(db, company_id)

    @classmethod
    def get_by_cnpj(cls, db: Session, cnpj: str) -> Optional[Company]:
        """Busca empresa por CNPJ (Único)."""
        # Usa get_active_query para ignorar CNPJs de contas excluídas
        return cls.get_active_query(db).filter(cls.model.cnpj == cnpj).first()

    @classmethod
    def update(cls, db: Session, company_id: str, company_data: CompanyUpdate) -> Optional[Company]:
        """Atualiza dados da empresa. Retorna None se não encontrar."""
        # Usamos o método próprio (que já tem soft delete) em vez de db.query puro
        db_company = cls.get_by_id(db, company_id)
        if not db_company:
            return None
        
        update_data = company_data.model_dump(exclude_unset=True)
        
        try:
            for key, value in update_data.items():
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

    @classmethod
    def delete(cls, db: Session, company_id: str) -> bool:
        """
        Remove uma empresa (Agora via Soft Delete).
        Retorna True se sucesso, False se não encontrada.
        """
        return cls.soft_delete(db, company_id)
"""
Repositório de Prefeituras.
Isola a lógica de acesso à base de dados para a entidade Prefecture.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import DatabaseError, IntegrityError
from fastapi import HTTPException
from app.models.prefecture_model import Prefecture
from app.schemas.prefecture_schemas import PrefectureCreate, PrefectureUpdate

class PrefectureRepository:
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        try:
            return db.query(Prefecture).order_by(Prefecture.state.asc(), Prefecture.city.asc()).offset(skip).limit(limit).all()
        except DatabaseError:
            raise HTTPException(status_code=500, detail="Erro interno ao buscar prefeituras.")

    @staticmethod
    def get_by_id(db: Session, pref_id: str) -> Prefecture:
        try:
            return db.query(Prefecture).filter(Prefecture.id == pref_id).first()
        except DatabaseError:
            raise HTTPException(status_code=500, detail="Erro interno ao buscar prefeitura.")
            
    @staticmethod
    def get_by_location(db: Session, state: str, city: str) -> Prefecture:
        """Busca uma prefeitura específica pela sua localização (Estado e Cidade)."""
        try:
            return db.query(Prefecture).filter(
                Prefecture.state == state.upper(), 
                Prefecture.city.ilike(city)
            ).first()
        except DatabaseError:
            raise HTTPException(status_code=500, detail="Erro interno ao buscar prefeitura por localização.")

    @staticmethod
    def create(db: Session, pref_in: PrefectureCreate) -> Prefecture:
        try:
            # Verifica se já existe para evitar duplicados
            existing = PrefectureRepository.get_by_location(db, pref_in.state, pref_in.city)
            if existing:
                raise HTTPException(status_code=400, detail=f"Já existe um registo para {pref_in.city} - {pref_in.state}.")
                
            new_pref = Prefecture(
                state=pref_in.state.upper(),
                city=pref_in.city,
                emission_link=pref_in.emission_link,
                contact_email=pref_in.contact_email,
                contact_phone=pref_in.contact_phone,
                contact_whatsapp=pref_in.contact_whatsapp,
                operation_notes=pref_in.operation_notes
            )
            db.add(new_pref)
            db.commit()
            db.refresh(new_pref)
            return new_pref
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Erro de integridade ao criar a prefeitura.")
        except DatabaseError as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="Erro interno ao salvar a prefeitura.")

    @staticmethod
    def update(db: Session, pref_id: str, pref_in: PrefectureUpdate) -> Prefecture:
        try:
            pref = db.query(Prefecture).filter(Prefecture.id == pref_id).first()
            if not pref:
                raise HTTPException(status_code=404, detail="Prefeitura não encontrada.")
            
            update_data = pref_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                if field == 'state' and value:
                    value = value.upper()
                setattr(pref, field, value)
                
            db.commit()
            db.refresh(pref)
            return pref
        except DatabaseError:
            db.rollback()
            raise HTTPException(status_code=500, detail="Erro interno ao atualizar a prefeitura.")
            
    @staticmethod
    def delete(db: Session, pref_id: str):
        try:
            pref = db.query(Prefecture).filter(Prefecture.id == pref_id).first()
            if not pref:
                raise HTTPException(status_code=404, detail="Prefeitura não encontrada.")
                
            db.delete(pref)
            db.commit()
            return True
        except DatabaseError:
            db.rollback()
            raise HTTPException(status_code=500, detail="Erro interno ao excluir a prefeitura.")
"""
Repositório de Solicitações de Emissão.
Gerencia a fila de trabalho para emissão de certidões.
Herda de BaseRepository para garantir suporte a Soft Delete automaticamente.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.repositories.base_repository import BaseRepository
from app.models.emission_request_model import EmissionRequest
from app.models.company_model import Company
from app.schemas.emission_request_schemas import EmissionRequestCreate, EmissionRequestUpdate

class EmissionRequestRepository(BaseRepository[EmissionRequest]):
    # Define qual modelo esta classe manipula para o BaseRepository
    model = EmissionRequest
    
    @classmethod
    def get_by_rule_and_company(cls, db: Session, rule_id: str, company_id: str):
        """Busca o histórico de solicitações de uma regra para uma empresa."""
        # Utiliza a query ativa (cls.get_active_query) que JÁ IGNORA as solicitações deletadas
        requests = cls.get_active_query(db).filter(
            cls.model.emission_rule_id == rule_id,
            cls.model.company_id == company_id
        ).order_by(cls.model.created_at.desc()).all()
        
        results = []
        for req in requests:
            # Busca os dados da empresa, mas blinda contra empresas deletadas (Soft Delete)
            company = db.query(Company).filter(
                Company.id == req.company_id,
                Company.deleted_at.is_(None)
            ).first()
            
            results.append({
                "id": req.id,
                "date": req.created_at,
                "companyId": req.company_id,
                "companyName": company.razao_social if company else "Empresa Desconhecida",
                "estimatedDate": req.estimated_date.isoformat() if req.estimated_date else "",
                "status": req.status
            })
        return results

    @classmethod
    def create(cls, db: Session, rule_id: str, user_id: str, payload: EmissionRequestCreate):
        """Registra uma nova solicitação na fila."""
        new_request = cls.model(
            emission_rule_id=rule_id,
            company_id=payload.company_id,
            requested_by_id=user_id
        )
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        
        # Blinda a busca da empresa contra o Soft Delete para montar a resposta
        company = db.query(Company).filter(
            Company.id == payload.company_id,
            Company.deleted_at.is_(None)
        ).first()
        
        return {
            "id": new_request.id,
            "date": new_request.created_at,
            "companyId": new_request.company_id,
            "companyName": company.razao_social if company else "Empresa Desconhecida",
            "estimatedDate": "",
            "status": new_request.status
        }

    @classmethod
    def update(cls, db: Session, request_id: str, payload: EmissionRequestUpdate):
        """Atualiza o status ou previsão de entrega da solicitação."""
        # Reutiliza o get_by_id da classe pai, que JÁ APLICA o filtro de Soft Delete!
        req = cls.get_by_id(db, request_id)
        
        if not req:
            raise HTTPException(status_code=404, detail="Registo de emissão não encontrado.")
            
        if payload.estimated_date is not None:
            req.estimated_date = payload.estimated_date
        if payload.status is not None:
            req.status = payload.status
            
        db.commit()
        db.refresh(req)
        return req
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.emission_request_model import EmissionRequest
from app.models.company_model import Company
from app.schemas.emission_request_schemas import EmissionRequestCreate, EmissionRequestUpdate

class EmissionRequestRepository:
    
    @staticmethod
    def get_by_rule_and_company(db: Session, rule_id: str, company_id: str):
        requests = db.query(EmissionRequest).filter(
            EmissionRequest.emission_rule_id == rule_id,
            EmissionRequest.company_id == company_id
        ).order_by(EmissionRequest.created_at.desc()).all()
        
        results = []
        for req in requests:
            company = db.query(Company).filter(Company.id == req.company_id).first()
            results.append({
                "id": req.id,
                "date": req.created_at,
                "companyId": req.company_id,
                "companyName": company.razao_social if company else "Empresa Desconhecida",
                "estimatedDate": req.estimated_date.isoformat() if req.estimated_date else "",
                "status": req.status
            })
        return results

    @staticmethod
    def create(db: Session, rule_id: str, user_id: str, payload: EmissionRequestCreate):
        new_request = EmissionRequest(
            emission_rule_id=rule_id,
            company_id=payload.company_id,
            requested_by_id=user_id
        )
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        
        company = db.query(Company).filter(Company.id == payload.company_id).first()
        return {
            "id": new_request.id,
            "date": new_request.created_at,
            "companyId": new_request.company_id,
            "companyName": company.razao_social if company else "Empresa Desconhecida",
            "estimatedDate": "",
            "status": new_request.status
        }

    @staticmethod
    def update(db: Session, request_id: str, payload: EmissionRequestUpdate):
        req = db.query(EmissionRequest).filter(EmissionRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Registo de emissão não encontrado.")
            
        if payload.estimated_date is not None:
            req.estimated_date = payload.estimated_date
        if payload.status is not None:
            req.status = payload.status
            
        db.commit()
        db.refresh(req)
        return req
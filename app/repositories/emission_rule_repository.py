"""
Repositório de Regras de Emissão (Diretórios).
Isola a lógica de acesso à base de dados para a entidade EmissionRule.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import DatabaseError, IntegrityError
from fastapi import HTTPException
from app.models.emission_rule_model import EmissionRule
from app.schemas.emission_rule_schemas import EmissionRuleCreate, EmissionRuleUpdate

class EmissionRuleRepository:
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        try:
            # Usa joinedload para carregar os dados do DocumentType associado numa única query
            rules = db.query(EmissionRule).options(joinedload(EmissionRule.document_type))\
                      .order_by(EmissionRule.created_at.desc())\
                      .offset(skip).limit(limit).all()
            
            # Injeta o nome do documento no objeto para o Pydantic ler facilmente
            for rule in rules:
                rule.document_type_name = rule.document_type.name if rule.document_type else "Desconhecido"
                
            return rules
        except DatabaseError:
            raise HTTPException(status_code=500, detail="Erro interno ao buscar regras de emissão.")

    @staticmethod
    def get_by_id(db: Session, rule_id: str) -> EmissionRule:
        try:
            rule = db.query(EmissionRule).options(joinedload(EmissionRule.document_type)).filter(EmissionRule.id == rule_id).first()
            if rule:
                rule.document_type_name = rule.document_type.name if rule.document_type else "Desconhecido"
            return rule
        except DatabaseError:
            raise HTTPException(status_code=500, detail="Erro interno ao buscar regra de emissão.")
            
    @staticmethod
    def get_specific_rule(db: Session, document_type_id: str, state: str = None, city: str = None) -> EmissionRule:
        """Busca uma regra específica cruzando o Documento e a Localização."""
        try:
            query = db.query(EmissionRule).filter(EmissionRule.document_type_id == document_type_id)
            
            # Filtro exato para Estado (ou garante que é nulo se for Nacional)
            if state:
                query = query.filter(EmissionRule.state == state.upper())
            else:
                query = query.filter(EmissionRule.state == None)
                
            # Filtro exato para Cidade (ou garante que é nulo se for Estadual/Nacional)
            if city:
                query = query.filter(EmissionRule.city.ilike(city))
            else:
                query = query.filter(EmissionRule.city == None)
                
            return query.first()
        except DatabaseError:
            raise HTTPException(status_code=500, detail="Erro interno ao buscar regra por localização.")

    @staticmethod
    def create(db: Session, rule_in: EmissionRuleCreate) -> EmissionRule:
        try:
            # Verifica se já existe para evitar cadastrar o mesmo link duas vezes para o mesmo local
            existing = EmissionRuleRepository.get_specific_rule(db, rule_in.document_type_id, rule_in.state, rule_in.city)
            if existing:
                raise HTTPException(status_code=400, detail="Já existe uma regra cadastrada para este documento nesta exata localização.")
                
            new_rule = EmissionRule(
                document_type_id=rule_in.document_type_id,
                state=rule_in.state.upper() if rule_in.state else None,
                city=rule_in.city,
                emission_link=rule_in.emission_link,
                contact_email=rule_in.contact_email,
                contact_phone=rule_in.contact_phone,
                contact_whatsapp=rule_in.contact_whatsapp,
                operation_notes=rule_in.operation_notes
            )
            db.add(new_rule)
            db.commit()
            db.refresh(new_rule)
            
            # Recarrega a regra com o join para ter o nome do documento ao retornar
            return EmissionRuleRepository.get_by_id(db, new_rule.id)
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Erro de integridade ao criar a regra de emissão.")
        except DatabaseError:
            db.rollback()
            raise HTTPException(status_code=500, detail="Erro interno ao salvar a regra.")

    @staticmethod
    def update(db: Session, rule_id: str, rule_in: EmissionRuleUpdate) -> EmissionRule:
        try:
            rule = db.query(EmissionRule).filter(EmissionRule.id == rule_id).first()
            if not rule:
                raise HTTPException(status_code=404, detail="Regra de emissão não encontrada.")
            
            update_data = rule_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                if field == 'state' and value:
                    value = value.upper()
                setattr(rule, field, value)
                
            db.commit()
            db.refresh(rule)
            return EmissionRuleRepository.get_by_id(db, rule.id)
        except DatabaseError:
            db.rollback()
            raise HTTPException(status_code=500, detail="Erro interno ao atualizar a regra.")
            
    @staticmethod
    def delete(db: Session, rule_id: str):
        try:
            rule = db.query(EmissionRule).filter(EmissionRule.id == rule_id).first()
            if not rule:
                raise HTTPException(status_code=404, detail="Regra de emissão não encontrada.")
                
            db.delete(rule)
            db.commit()
            return True
        except DatabaseError:
            db.rollback()
            raise HTTPException(status_code=500, detail="Erro interno ao excluir a regra.")

    @staticmethod
    def resolve_rule_for_company(db: Session, document_type_id: str, company_id: str) -> EmissionRule:
        """
        RESOLUÇÃO MÁGICA: Cruza o Documento com o Endereço da Empresa e Escopo.
        Devolve a regra exata (Link, Contatos) ou None se não houver regra para aquele endereço.
        """
        try:
            from app.models.company_model import Company
            from app.models.document_type_model import DocumentType, DocumentScope

            # 1. Busca os dados da Empresa (para ter Estado e Cidade)
            company = db.query(Company).filter(Company.id == company_id).first()
            if not company: return None
            
            # 2. Busca o Tipo de Documento (para saber o Escopo)
            doc_type = db.query(DocumentType).filter(DocumentType.id == document_type_id).first()
            if not doc_type: return None

            # 3. Lógica de Resolução baseada no Escopo
            query = db.query(EmissionRule).filter(EmissionRule.document_type_id == document_type_id)

            if doc_type.scope == DocumentScope.NATIONAL.value:
                # Regra Nacional: state e city devem ser NULOS
                return query.filter(EmissionRule.state == None, EmissionRule.city == None).first()

            elif doc_type.scope == DocumentScope.STATE.value:
                # Regra Estadual: state deve bater com a empresa, city deve ser NULA
                if not company.estado: return None
                return query.filter(EmissionRule.state == company.estado.upper(), EmissionRule.city == None).first()

            elif doc_type.scope == DocumentScope.MUNICIPAL.value:
                # Regra Municipal: state e city devem bater exatamente com a empresa
                if not company.estado or not company.cidade: return None
                return query.filter(EmissionRule.state == company.estado.upper(), EmissionRule.city.ilike(company.cidade)).first()

            return None
        except DatabaseError:
            raise HTTPException(status_code=500, detail="Erro interno ao resolver regra de emissão.")
"""
Repositório de Regras de Emissão (Diretórios).
Isola a lógica de acesso à base de dados para a entidade EmissionRule.
Herda de BaseRepository para garantir suporte a Soft Delete automaticamente.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import DatabaseError, IntegrityError

from app.repositories.base_repository import BaseRepository
from app.models.emission_rule_model import EmissionRule
from app.schemas.emission_rule_schemas import EmissionRuleCreate, EmissionRuleUpdate

class EmissionRuleRepository(BaseRepository[EmissionRule]):
    # Define qual modelo esta classe manipula para o BaseRepository
    model = EmissionRule
    
    @classmethod
    def get_all(cls, db: Session, skip: int = 0, limit: int = 100):
        try:
            # Usa get_active_query para ignorar os deletados e adiciona o joinedload
            rules = cls.get_active_query(db).options(joinedload(cls.model.document_type))\
                      .order_by(cls.model.created_at.desc())\
                      .offset(skip).limit(limit).all()
            
            # Injeta o nome do documento no objeto para o Pydantic ler facilmente
            for rule in rules:
                rule.document_type_name = rule.document_type.name if rule.document_type else "Desconhecido"
                
            return rules
        except DatabaseError:
            raise ValueError("Erro interno ao buscar regras de emissão.")

    @classmethod
    def get_by_id(cls, db: Session, rule_id: str) -> EmissionRule:
        try:
            # O mesmo aqui: get_active_query + joinedload
            rule = cls.get_active_query(db).options(joinedload(cls.model.document_type))\
                      .filter(cls.model.id == rule_id).first()
            if rule:
                rule.document_type_name = rule.document_type.name if rule.document_type else "Desconhecido"
            return rule
        except DatabaseError:
            raise ValueError("Erro interno ao buscar regra de emissão.")
            
    @classmethod
    def get_specific_rule(cls, db: Session, document_type_id: str, state: str = None, city: str = None) -> EmissionRule:
        """Busca uma regra específica cruzando o Documento e a Localização."""
        try:
            query = cls.get_active_query(db).filter(cls.model.document_type_id == document_type_id)
            
            if state:
                query = query.filter(cls.model.state == state.upper())
            else:
                query = query.filter(cls.model.state == None)
                
            if city:
                query = query.filter(cls.model.city.ilike(city))
            else:
                query = query.filter(cls.model.city == None)
                
            return query.first()
        except DatabaseError:
            raise ValueError("Erro interno ao buscar regra por localização.")

    @classmethod
    def create(cls, db: Session, rule_in: EmissionRuleCreate) -> EmissionRule:
        try:
            existing = cls.get_specific_rule(db, rule_in.document_type_id, rule_in.state, rule_in.city)
            if existing:
                raise ValueError("Já existe uma regra cadastrada para este documento nesta exata localização.")
                
            new_rule = cls.model(
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
            
            return cls.get_by_id(db, new_rule.id)
        except IntegrityError:
            db.rollback()
            raise ValueError("Erro de integridade ao criar a regra de emissão.")
        except DatabaseError:
            db.rollback()
            raise ValueError("Erro interno ao salvar a regra.")

    @classmethod
    def update(cls, db: Session, rule_id: str, rule_in: EmissionRuleUpdate) -> EmissionRule:
        try:
            rule = cls.get_by_id(db, rule_id)
            if not rule:
                raise KeyError("Regra de emissão não encontrada.")
            
            update_data = rule_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                if field == 'state' and value:
                    value = value.upper()
                setattr(rule, field, value)
                
            db.commit()
            db.refresh(rule)
            return cls.get_by_id(db, rule.id)
        except DatabaseError:
            db.rollback()
            raise ValueError("Erro interno ao atualizar a regra.")
            
    @classmethod
    def delete(cls, db: Session, rule_id: str):
        try:
            # Substituímos db.delete() pelo superpoder do cls.soft_delete()
            success = cls.soft_delete(db, rule_id)
            if not success:
                raise KeyError("Regra de emissão não encontrada.")
            return True
        except DatabaseError:
            db.rollback()
            raise ValueError("Erro interno ao excluir a regra.")

    @classmethod
    def resolve_rule_for_company(cls, db: Session, document_type_id: str, company_id: str) -> EmissionRule:
        """
        RESOLUÇÃO MÁGICA: Cruza o Documento com o Endereço da Empresa e Escopo.
        Agora totalmente blindada contra lixo eletrônico (Soft Delete).
        """
        try:
            from app.models.company_model import Company
            from app.models.document_type_model import DocumentType, DocumentScope

            # 1. Busca os dados da Empresa (Garante que a empresa não foi deletada)
            company = db.query(Company).filter(
                Company.id == company_id,
                Company.deleted_at.is_(None) # <--- BLINDAGEM SOFT DELETE
            ).first()
            if not company: return None
            
            # 2. Busca o Tipo de Documento (Garante que o tipo de documento não foi deletado)
            doc_type = db.query(DocumentType).filter(
                DocumentType.id == document_type_id,
                DocumentType.deleted_at.is_(None) # <--- BLINDAGEM SOFT DELETE
            ).first()
            if not doc_type: return None

            # 3. Lógica de Resolução baseada no Escopo ignorando regras deletadas
            query = cls.get_active_query(db).filter(cls.model.document_type_id == document_type_id)

            if doc_type.scope == DocumentScope.NATIONAL.value:
                return query.filter(cls.model.state == None, cls.model.city == None).first()

            elif doc_type.scope == DocumentScope.STATE.value:
                if not company.estado: return None
                return query.filter(cls.model.state == company.estado.upper(), cls.model.city == None).first()

            elif doc_type.scope == DocumentScope.MUNICIPAL.value:
                if not company.estado or not company.cidade: return None
                return query.filter(cls.model.state == company.estado.upper(), cls.model.city.ilike(company.cidade)).first()

            return None
        except DatabaseError:
            raise ValueError("Erro interno ao resolver regra de emissão.")
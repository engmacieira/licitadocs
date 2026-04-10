"""
Repositório de Documentos e Certificados.
Responsável pela persistência e leitura unificada (Cofre).
Inclui proteção de Soft Delete em todas as entidades relacionadas.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from typing import Optional, List
from datetime import date, datetime

from app.models.document_model import Document, DocumentStatus
from app.models.certificate_model import Certificate, CertificateStatus
from app.models.company_model import Company 
from app.models.document_category_model import DocumentCategory
from app.models.document_type_model import DocumentType
from app.models.document_automation_model import DocumentAutomationConfig 

from app.schemas.document_schemas import (
    DocumentCategoryCreate, DocumentCategoryUpdate,
    DocumentTypeCreate, DocumentTypeUpdate
)

class DocumentRepository:
    
    # --- CATÁLOGO ---
    @staticmethod
    def get_all_categories_with_types(db: Session) -> List[DocumentCategory]:
        """Traz categorias ativas e seus tipos (Ignora deletados)."""
        return db.query(DocumentCategory)\
            .options(joinedload(DocumentCategory.types).joinedload(DocumentType.automation_config))\
            .filter(DocumentCategory.deleted_at.is_(None))\
            .order_by(DocumentCategory.order)\
            .all()

    # --- UPLOAD LEGADO ---
    @staticmethod
    def create_legacy(
        db: Session, title: str, filename: str, file_path: str, company_id: str, 
        expiration_date: Optional[date] = None, uploaded_by_id: Optional[str] = None,
        is_client_upload: bool = False
    ) -> Document:
        # Se for upload do cliente, entra como PENDING para conferência
        initial_status = DocumentStatus.PENDING.value if is_client_upload else DocumentStatus.VALID.value

        db_doc = Document(
            title=title, filename=filename, file_path=file_path,
            company_id=company_id, expiration_date=expiration_date,
            status=initial_status, uploaded_by_id=uploaded_by_id,
            is_client_upload=is_client_upload
        )
        try:
            db.add(db_doc)
            db.commit()
            db.refresh(db_doc)
            return db_doc
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError(f"Erro ao registrar documento legado: {str(e)}")

    # --- UPLOAD ESTRUTURADO ---
    @staticmethod
    def create_certificate(
        db: Session, type_id: str, filename: str, file_path: str, company_id: str,
        expiration_date: Optional[date] = None, authentication_code: Optional[str] = None,
        is_client_upload: bool = False
    ) -> Certificate:
        # Missão 3: Versionamento de Certidões (Upsert e Arquivamento)
        # Busca todas as certidões ativas daquele company_id e type_id e altera o status para "archived"
        db.query(Certificate).filter(
            Certificate.company_id == company_id,
            Certificate.type_id == type_id,
            Certificate.status != CertificateStatus.ARCHIVED.value,
            Certificate.deleted_at.is_(None)
        ).update({"status": CertificateStatus.ARCHIVED.value}, synchronize_session=False)

        initial_status = CertificateStatus.PENDING.value if is_client_upload else CertificateStatus.VALID.value

        cert = Certificate(
            type_id=type_id, filename=filename, file_path=file_path,
            company_id=company_id, expiration_date=expiration_date,
            authentication_code=authentication_code,
            status=initial_status
        )
        try:
            db.add(cert)
            db.commit()
            db.refresh(cert)
            return cert
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError(f"Erro ao registrar certificado estruturado: {str(e)}")

    # --- BUSCA UNIFICADA (MERGE) ---
    @staticmethod
    def get_unified_by_company(db: Session, company_id: str, is_client_upload: Optional[bool] = None) -> List[dict]:
        """Busca documentos e certificados ativos de uma empresa."""
        unified_list = []
        
        # 1. Busca Documentos Genéricos (Soft Delete aplicado)
        legacies_query = db.query(Document).filter(
            Document.company_id == company_id,
            Document.deleted_at.is_(None) # <--- BLINDAGEM SOFT DELETE
        )
        
        if is_client_upload is not None:
            legacies_query = legacies_query.filter(Document.is_client_upload == is_client_upload)
            
        legacies = legacies_query.all()
        
        for doc in legacies:
            unified_list.append({
                "id": doc.id,
                "title": doc.title or "Documento Legado",
                "filename": doc.filename,
                "expiration_date": doc.expiration_date,
                "status": doc.status,
                "created_at": doc.created_at,
                "is_structured": False,
                "type_id": None,
                "category_id": None,
                "type_name": None,
                "category_name": None,
                "authentication_code": None,
                "is_client_upload": getattr(doc, 'is_client_upload', False)
            })

        # 2. Busca Certidões (Soft Delete aplicado)
        if is_client_upload is not True:
            certificates = db.query(Certificate)\
                .options(joinedload(Certificate.document_type).joinedload(DocumentType.category))\
                .filter(
                    Certificate.company_id == company_id,
                    Certificate.deleted_at.is_(None) # <--- BLINDAGEM SOFT DELETE
                ).all()
                
            for cert in certificates:
                unified_list.append({
                    "id": cert.id,
                    "title": cert.document_type.name if cert.document_type else "Certidão",
                    "filename": cert.filename,
                    "expiration_date": cert.expiration_date,
                    "status": cert.status,
                    "created_at": cert.created_at,
                    "is_structured": True,
                    "type_id": cert.type_id,
                    "category_id": cert.document_type.category_id if cert.document_type else None,
                    "type_name": cert.document_type.name if cert.document_type else None,
                    "category_name": cert.document_type.category.name if cert.document_type and cert.document_type.category else None,
                    "authentication_code": cert.authentication_code,
                    "is_client_upload": False
                })

        unified_list.sort(key=lambda x: x["created_at"], reverse=True)
        return unified_list
        
    @staticmethod
    def get_file_path(db: Session, item_id: str, company_id: Optional[str] = None) -> Optional[str]:
        """Garante que não baixa arquivos deletados e valida vínculo da empresa (IDOR)."""
        doc = db.query(Document).filter(Document.id == item_id, Document.deleted_at.is_(None)).first()
        if doc:
            if company_id and str(doc.company_id) != company_id: return None
            return doc.file_path
        
        cert = db.query(Certificate).filter(Certificate.id == item_id, Certificate.deleted_at.is_(None)).first()
        if cert:
            if company_id and str(cert.company_id) != company_id: return None
            return cert.file_path
        return None
    
    # =================================================================
    # CRUD DE CATEGORIAS (Admin)
    # =================================================================
    @staticmethod
    def create_category(db: Session, cat_in: DocumentCategoryCreate) -> DocumentCategory:
        db_cat = DocumentCategory(**cat_in.model_dump())
        try:
            db.add(db_cat)
            db.commit()
            db.refresh(db_cat)
            return db_cat
        except IntegrityError:
            db.rollback()
            raise ValueError("Já existe uma categoria com este slug (identificador).")

    @staticmethod
    def update_category(db: Session, cat_id: str, cat_in: DocumentCategoryUpdate) -> DocumentCategory:
        db_cat = db.query(DocumentCategory).filter(
            DocumentCategory.id == cat_id, 
            DocumentCategory.deleted_at.is_(None)
        ).first()
        
        if not db_cat:
            raise ValueError("Categoria não encontrada.")
        
        update_data = cat_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_cat, key, value)
            
        try:
            db.commit()
            db.refresh(db_cat)
            return db_cat
        except IntegrityError:
            db.rollback()
            raise ValueError("Erro de integridade ao atualizar a categoria.")

    @staticmethod
    def delete_category(db: Session, cat_id: str):
        """SUBSTITUÍDO db.delete() PELO SOFT DELETE."""
        db_cat = db.query(DocumentCategory).filter(DocumentCategory.id == cat_id).first()
        if not db_cat or db_cat.deleted_at is not None:
            raise ValueError("Categoria não encontrada.")
        
        if db.query(DocumentType).filter(DocumentType.category_id == cat_id, DocumentType.deleted_at.is_(None)).first():
            raise ValueError("Não é possível excluir uma categoria que ainda possui Tipos de Documentos ativos vinculados.")
            
        db_cat.deleted_at = datetime.now() # <--- SOFT DELETE
        db.commit()

    # =================================================================
    # CRUD DE TIPOS DE DOCUMENTOS E AUTOMAÇÃO (Admin)
    # =================================================================
    @staticmethod
    def create_type(db: Session, type_in: DocumentTypeCreate) -> DocumentType:
        type_data = type_in.model_dump(exclude={"automation_config"})
        db_type = DocumentType(**type_data)
        
        try:
            db.add(db_type)
            db.flush() 
            
            if type_in.automation_config:
                auto_config = DocumentAutomationConfig(
                    document_type_id=db_type.id,
                    **type_in.automation_config.model_dump()
                )
            else:
                auto_config = DocumentAutomationConfig(document_type_id=db_type.id)
                
            db.add(auto_config)
            db.commit()
            db.refresh(db_type)
            return db_type
            
        except IntegrityError:
            db.rollback()
            raise ValueError("Erro de integridade. Verifique se o slug já existe ou se a Categoria é válida.")

    @staticmethod
    def update_type(db: Session, type_id: str, type_in: DocumentTypeUpdate) -> DocumentType:
        db_type = db.query(DocumentType).filter(
            DocumentType.id == type_id,
            DocumentType.deleted_at.is_(None)
        ).first()
        
        if not db_type:
            raise ValueError("Tipo de documento não encontrado.")
            
        update_data = type_in.model_dump(exclude_unset=True, exclude={"automation_config"})
        for key, value in update_data.items():
            setattr(db_type, key, value)
            
        if type_in.automation_config is not None:
            if not db_type.automation_config:
                new_auto = DocumentAutomationConfig(
                    document_type_id=db_type.id,
                    **type_in.automation_config.model_dump(exclude_unset=True)
                )
                db.add(new_auto)
            else:
                auto_data = type_in.automation_config.model_dump(exclude_unset=True)
                for key, value in auto_data.items():
                    setattr(db_type.automation_config, key, value)
            
        try:
            db.commit()
            db.refresh(db_type)
            return db_type
        except IntegrityError:
            db.rollback()
            raise ValueError("Erro de integridade ao atualizar o tipo de documento.")

    @staticmethod
    def delete_type(db: Session, type_id: str):
        """SUBSTITUÍDO db.delete() PELO SOFT DELETE."""
        db_type = db.query(DocumentType).filter(DocumentType.id == type_id).first()
        if not db_type or db_type.deleted_at is not None:
            raise ValueError("Tipo de documento não encontrado.")
            
        if db.query(Certificate).filter(Certificate.type_id == type_id, Certificate.deleted_at.is_(None)).first():
            raise ValueError("Não é possível excluir este Tipo. Já existem certidões ativas vinculadas a ele.")
            
        db_type.deleted_at = datetime.now() # <--- SOFT DELETE
        db.commit()
        
    @staticmethod
    def update_metadata(db: Session, item_id: str, expiration_date: Optional[date] = None, authentication_code: Optional[str] = None, status: Optional[str] = None):
        doc = db.query(Document).filter(Document.id == item_id, Document.deleted_at.is_(None)).first()
        if doc:
            if expiration_date is not None: doc.expiration_date = expiration_date
            if status is not None: doc.status = status 
            try:
                db.commit()
                db.refresh(doc)
                return {"id": doc.id, "type": "legacy", "message": "Documento atualizado"}
            except SQLAlchemyError as e:
                db.rollback()
                raise ValueError(f"Erro ao atualizar documento: {str(e)}")

        cert = db.query(Certificate).filter(Certificate.id == item_id, Certificate.deleted_at.is_(None)).first()
        if cert:
            if expiration_date is not None: cert.expiration_date = expiration_date
            if authentication_code is not None: cert.authentication_code = authentication_code
            if status is not None: cert.status = status
                
            try:
                db.commit()
                db.refresh(cert)
                return {"id": cert.id, "type": "certificate", "message": "Certificado atualizado com sucesso"}
            except SQLAlchemyError as e:
                db.rollback()
                raise ValueError(f"Erro ao atualizar certificado: {str(e)}")

        return None
    
    @staticmethod
    def get_expiring_global(db: Session, days_threshold: int = 30) -> List[dict]:        
        from datetime import date, timedelta
        target_date = date.today() + timedelta(days=days_threshold)
        unified_list = []
        
        # Ignora empresas deletadas
        companies = {
            c.id: {
                "name": c.razao_social or c.name or "Empresa Desconhecida", 
                "cnpj": getattr(c, 'cnpj', '')
            } 
            for c in db.query(Company).filter(Company.deleted_at.is_(None)).all()
        }
        
        default_comp = {"name": "Empresa Desconhecida", "cnpj": ""}
        
        certs = db.query(Certificate).options(
            joinedload(Certificate.document_type).joinedload(DocumentType.category)
        ).filter(
            Certificate.expiration_date != None,
            Certificate.expiration_date <= target_date,
            Certificate.status != "archived",
            Certificate.deleted_at.is_(None) # <--- BLINDAGEM SOFT DELETE
        ).all()
        
        for cert in certs:
            comp_info = companies.get(cert.company_id, default_comp)
            unified_list.append({
                "id": cert.id,
                "title": cert.document_type.name if cert.document_type else "Certidão",
                "filename": cert.filename,
                "expiration_date": cert.expiration_date,
                "status": cert.status,
                "created_at": cert.created_at,
                "company_id": cert.company_id,
                "company_name": comp_info["name"],
                "company_cnpj": comp_info["cnpj"],
                "is_structured": True,
                "type_id": cert.type_id,
                "category_id": cert.document_type.category_id if cert.document_type else None,
                "type_name": cert.document_type.name if cert.document_type else None,
                "category_name": cert.document_type.category.name if cert.document_type and cert.document_type.category else None,
                "authentication_code": cert.authentication_code,
                "is_client_upload": False
            })

        legacies = db.query(Document).filter(
            Document.expiration_date != None,
            Document.expiration_date <= target_date,
            Document.status != "archived",
            Document.deleted_at.is_(None) # <--- BLINDAGEM SOFT DELETE
        ).all()
        
        for doc in legacies:
            comp_info = companies.get(doc.company_id, default_comp)
            unified_list.append({
                "id": doc.id,
                "title": doc.title or "Documento Legado",
                "filename": doc.filename,
                "expiration_date": doc.expiration_date,
                "status": doc.status,
                "created_at": doc.created_at,
                "company_id": doc.company_id,
                "company_name": comp_info["name"],
                "company_cnpj": comp_info["cnpj"],
                "is_structured": False,
                "type_id": None,
                "category_id": None,
                "type_name": None,
                "category_name": None,
                "authentication_code": None,
                "is_client_upload": getattr(doc, 'is_client_upload', False)
            })

        unified_list.sort(key=lambda x: x["expiration_date"])
        return unified_list

    @staticmethod
    def get_irregular_global(db: Session) -> List[dict]:
        from datetime import date
        unified_list = []
        
        # Ignora empresas deletadas
        companies = {
            c.id: {"name": c.razao_social or c.name or "Empresa Desconhecida", "cnpj": getattr(c, 'cnpj', '')} 
            for c in db.query(Company).filter(Company.deleted_at.is_(None)).all()
        }
        default_comp = {"name": "Empresa Desconhecida", "cnpj": ""}
        
        certs = db.query(Certificate).options(
            joinedload(Certificate.document_type).joinedload(DocumentType.category)
        ).filter(
            Certificate.status.in_(["error", "irregular"]),
            Certificate.deleted_at.is_(None) # <--- BLINDAGEM SOFT DELETE
        ).all()
        
        for cert in certs:
            comp_info = companies.get(cert.company_id, default_comp)
            unified_list.append({
                "id": cert.id,
                "title": cert.document_type.name if cert.document_type else "Certidão",
                "filename": cert.filename,
                "expiration_date": cert.expiration_date,
                "status": cert.status,
                "created_at": cert.created_at,
                "company_id": cert.company_id,
                "company_name": comp_info["name"],
                "company_cnpj": comp_info["cnpj"],
                "is_structured": True,
                "type_id": cert.type_id,
                "category_id": cert.document_type.category_id if cert.document_type else None,
                "type_name": cert.document_type.name if cert.document_type else None,
                "category_name": cert.document_type.category.name if cert.document_type and cert.document_type.category else None,
                "authentication_code": cert.authentication_code,
                "is_client_upload": False
            })

        legacies = db.query(Document).filter(
            Document.status.in_(["error", "irregular"]),
            Document.deleted_at.is_(None) # <--- BLINDAGEM SOFT DELETE
        ).all()
        
        for doc in legacies:
            comp_info = companies.get(doc.company_id, default_comp)
            unified_list.append({
                "id": doc.id,
                "title": doc.title or "Documento Legado",
                "filename": doc.filename,
                "expiration_date": doc.expiration_date,
                "status": doc.status,
                "created_at": doc.created_at,
                "company_id": doc.company_id,
                "company_name": comp_info["name"],
                "company_cnpj": comp_info["cnpj"],
                "is_structured": False,
                "is_client_upload": getattr(doc, 'is_client_upload', False)
            })

        unified_list.sort(key=lambda x: x["company_name"])
        return unified_list

    @staticmethod
    def get_recent_global(db: Session, limit: int = 5) -> List[dict]:
        """Busca os documentos e certificados mais recentes de todo o sistema (Admin)."""
        unified_list = []
        
        # 1. Documentos Recentes (Soft Delete aplicado)
        legacies = db.query(Document)\
            .filter(Document.deleted_at.is_(None))\
            .order_by(Document.created_at.desc())\
            .limit(limit)\
            .all()
            
        for doc in legacies:
            unified_list.append({
                "id": doc.id,
                "title": doc.title or "Documento Legado",
                "filename": doc.filename,
                "expiration_date": doc.expiration_date,
                "status": doc.status,
                "created_at": doc.created_at,
                "is_structured": False,
                "company_id": str(doc.company_id),
                "is_client_upload": getattr(doc, 'is_client_upload', False)
            })

        # 2. Certidões Recentes (Soft Delete aplicado)
        certificates = db.query(Certificate)\
            .options(joinedload(Certificate.document_type))\
            .filter(Certificate.deleted_at.is_(None))\
            .order_by(Certificate.created_at.desc())\
            .limit(limit)\
            .all()
            
        for cert in certificates:
            unified_list.append({
                "id": cert.id,
                "title": cert.document_type.name if cert.document_type else "Certidão",
                "filename": cert.filename,
                "expiration_date": cert.expiration_date,
                "status": cert.status,
                "created_at": cert.created_at,
                "is_structured": True,
                "company_id": str(cert.company_id),
                "is_client_upload": False
            })

        # 3. Ordena e limita
        unified_list.sort(key=lambda x: x["created_at"], reverse=True)
        return unified_list[:limit]
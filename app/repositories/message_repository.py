"""
Repositório de Mensagens.
Isola a lógica de acesso à base de dados para a entidade Message.
Herda de BaseRepository para garantir suporte a Soft Delete automaticamente.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import DatabaseError
from typing import List

from app.repositories.base_repository import BaseRepository
from app.models.message_model import Message
from app.schemas.message_schemas import MessageCreate

class MessageRepository(BaseRepository[Message]):
    # Define qual modelo esta classe manipula para o BaseRepository
    model = Message
    
    @classmethod
    def create(cls, db: Session, company_id: str, sender_id: str, message_in: MessageCreate) -> Message:
        """Cria uma nova mensagem ou ticket no banco de dados."""
        try:
            # Usamos cls.model em vez de chamar Message diretamente
            new_message = cls.model(
                company_id=company_id,
                sender_id=sender_id,
                content=message_in.content,
                message_type=message_in.message_type,
                subject=message_in.subject,
                related_document_id=message_in.related_document_id,
                attachment_path=message_in.attachment_path,
                parent_id=message_in.parent_id
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message)
            return new_message
        except DatabaseError as e:
            db.rollback()
            raise e

    @classmethod
    def create_bulk(cls, db: Session, messages: List[Message]) -> List[Message]:
        """Cria várias mensagens em um único lote (bulk insert) para evitar N+1/DoS."""
        try:
            db.add_all(messages)
            db.commit()
            return messages
        except DatabaseError as e:
            db.rollback()
            raise e

    @classmethod
    def get_by_company(cls, db: Session, company_id: str):
        """Busca o histórico de mensagens ativas de uma empresa."""
        try:
            # Substituído db.query por get_active_query para ignorar mensagens deletadas
            return cls.get_active_query(db).filter(
                cls.model.company_id == company_id
            ).order_by(cls.model.created_at.asc()).all()
        except DatabaseError as e:
            raise e

    @classmethod
    def mark_as_read(cls, db: Session, message_id: str) -> Message:
        """Marca uma mensagem como lida."""
        try:
            # Reutiliza a inteligência do BaseRepository (que já checa o Soft Delete)
            message = cls.get_by_id(db, message_id)
            if message:
                message.is_read = True
                db.commit()
                db.refresh(message)
            return message
        except DatabaseError as e:
            db.rollback()
            raise e

    @classmethod
    def resolve_ticket(cls, db: Session, message_id: str) -> Message:
        """Fecha um ticket ou pendência."""
        try:
            # Reutiliza o get_by_id herdado
            message = cls.get_by_id(db, message_id)
            if message:
                message.is_resolved = True
                db.commit()
                db.refresh(message)
            return message
        except DatabaseError as e:
            db.rollback()
            raise e
        
    @classmethod
    def get_all_tickets_admin(cls, db: Session):
        """Busca todos os tickets ativos para a visão do Administrador."""
        try:
            # Traz todos os chats e pendências, blindado pelo Soft Delete
            return cls.get_active_query(db).filter(
                cls.model.message_type != "system"
            ).order_by(cls.model.created_at.desc()).all()
        except DatabaseError as e:
            raise e
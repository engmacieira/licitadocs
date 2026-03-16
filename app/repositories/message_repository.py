"""
Repositório de Mensagens.
Isola a lógica de acesso à base de dados para a entidade Message.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import DatabaseError
from fastapi import HTTPException
from app.models.message_model import Message
from app.schemas.message_schemas import MessageCreate

class MessageRepository:
    
    @staticmethod
    def create(db: Session, company_id: str, sender_id: str, message_in: MessageCreate) -> Message:
        try:
            new_message = Message(
                company_id=company_id,
                sender_id=sender_id,
                content=message_in.content,
                message_type=message_in.message_type,
                # --- NOVOS CAMPOS (US-2412: Contexto e Tickets) ---
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
            raise HTTPException(status_code=500, detail="Erro interno ao salvar a mensagem/ticket.")

    @staticmethod
    def get_by_company(db: Session, company_id: str):
        try:
            # Retorna o histórico todo ordenado cronologicamente (O Frontend cuida de agrupar as threads pelo parent_id)
            return db.query(Message).filter(Message.company_id == company_id).order_by(Message.created_at.asc()).all()
        except DatabaseError:
            raise HTTPException(status_code=500, detail="Erro interno ao buscar mensagens.")

    @staticmethod
    def mark_as_read(db: Session, message_id: str) -> Message:
        try:
            message = db.query(Message).filter(Message.id == message_id).first()
            if message:
                message.is_read = True
                db.commit()
                db.refresh(message)
            return message
        except DatabaseError:
            db.rollback()
            raise HTTPException(status_code=500, detail="Erro interno ao atualizar a mensagem.")

    # --- NOVA FUNÇÃO BÓNUS: FECHAR TICKET / RESOLVER PENDÊNCIA ---
    @staticmethod
    def resolve_ticket(db: Session, message_id: str) -> Message:
        try:
            message = db.query(Message).filter(Message.id == message_id).first()
            if message:
                message.is_resolved = True
                db.commit()
                db.refresh(message)
            return message
        except DatabaseError:
            db.rollback()
            raise HTTPException(status_code=500, detail="Erro interno ao resolver o ticket.")
        
    @staticmethod
    def get_all_tickets_admin(db: Session):
        try:
            # Traz todos os chats e pendências, ignorando os "avisos de sistema"
            return db.query(Message).filter(Message.message_type != "system").order_by(Message.created_at.desc()).all()
        except DatabaseError:
            raise HTTPException(status_code=500, detail="Erro interno ao buscar todos os tickets.")
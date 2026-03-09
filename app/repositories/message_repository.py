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
                message_type=message_in.message_type
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message)
            return new_message
        except DatabaseError as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="Erro interno ao salvar a mensagem.")

    @staticmethod
    def get_by_company(db: Session, company_id: str):
        try:
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
"""
Modelagem de Mensagens (Caixa de Entrada / Tickets / Chat).
Responsável pela comunicação entre Admin e Clientes e avisos do sistema.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.core.database import Base, generate_uuid

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # --- Relacionamentos Principais ---
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    company = relationship("app.models.company_model.Company", foreign_keys=[company_id])
    
    sender_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, doc="Null = Aviso do Sistema")
    sender = relationship("app.models.user_model.User", foreign_keys=[sender_id])

    # ---> O DETALHE MÁGICO PARA TICKETS (THREADS) <---
    parent_id = Column(String, ForeignKey("messages.id", ondelete="CASCADE"), nullable=True, doc="ID da mensagem original se esta for uma resposta (Ticket)")
    replies = relationship("Message", backref=backref("parent", remote_side=[id]))

    # --- Contexto e Anexos ---
    subject = Column(String, nullable=True, doc="Assunto do Ticket ou do Alerta do Sistema")
    related_document_id = Column(String, nullable=True, doc="ID do Documento/Certidão com pendência")
    attachment_path = Column(String, nullable=True, doc="Anexo (Ex: Print de erro enviado pelo cliente)")

    # --- Conteúdo e Flags ---
    content = Column(Text, nullable=False)
    message_type = Column(String, default="chat", doc="'chat' (ticket normal), 'system' (aviso) ou 'action_required' (pendência)") 
    
    is_read = Column(Boolean, default=False, doc="Se o destinatário já leu a mensagem/resposta")
    is_resolved = Column(Boolean, default=False, doc="True se o Ticket foi fechado ou a pendência resolvida")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
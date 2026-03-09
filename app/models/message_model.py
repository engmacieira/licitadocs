"""
Modelagem de Mensagens (Caixa de Entrada / Chat).
Responsável pela comunicação entre Admin e Clientes e avisos do sistema.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, generate_uuid

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Relação com a Empresa (Destinatário principal no contexto B2B)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    
    # Quem enviou? Se for nulo, consideramos que é um "Aviso Automático do Sistema"
    sender_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    
    # Tipo de mensagem: "chat" (conversa) ou "system" (aviso automático)
    message_type = Column(String, default="chat") 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos (Evitar circular imports usando strings)
    company = relationship("app.models.company_model.Company", foreign_keys=[company_id])
    sender = relationship("app.models.user_model.User", foreign_keys=[sender_id])
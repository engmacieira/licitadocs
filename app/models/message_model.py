"""
Modelagem de Mensagens (Central de Tickets e Alertas).
Responsável pela comunicação entre a Operação (Admin) e os Clientes.
Suporta threads de conversa (tickets) e avisos automáticos do sistema.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.core.database import Base, SoftDeleteMixin, generate_uuid

class Message(Base, SoftDeleteMixin):
    """
    Representa uma mensagem ou ticket no sistema LicitaDoc.
    Pode ser um chat direto, um alerta do sistema ou uma resposta a um ticket existente.
    """
    __tablename__ = "messages"

    # --- Identificador Único ---
    id = Column(
        String, 
        primary_key=True, 
        default=generate_uuid, 
        index=True,
        doc="ID único da mensagem (UUID)"
    )
    
    # --- Relacionamentos de Origem e Destino ---
    company_id = Column(
        String, 
        ForeignKey("companies.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        doc="Empresa vinculada a esta comunicação"
    )
    
    sender_id = Column(
        String, 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True, 
        doc="ID do usuário remetente. Nulo indica mensagem automática do sistema."
    )

    # --- Lógica de Tickets (Threads/Respostas) ---
    parent_id = Column(
        String, 
        ForeignKey("messages.id", ondelete="CASCADE"), 
        nullable=True, 
        doc="ID da mensagem original. Se preenchido, esta mensagem é uma resposta."
    )

    # --- Contexto e Conteúdo ---
    subject = Column(
        String, 
        nullable=True, 
        doc="Assunto principal (Ex: 'Pendência na CND Federal')"
    )
    
    related_document_id = Column(
        String, 
        nullable=True, 
        doc="Vínculo opcional com um documento/certidão específica"
    )
    
    attachment_path = Column(
        String, 
        nullable=True, 
        doc="Caminho para arquivo anexo (Ex: print de erro ou comprovante)"
    )

    content = Column(
        Text, 
        nullable=False,
        doc="Conteúdo textual da mensagem ou corpo do ticket"
    )
    
    message_type = Column(
        String, 
        default="chat", 
        doc="Categorias: 'chat' (ticket), 'system' (alerta) ou 'action_required' (pendência)"
    ) 
    
    # --- Controle de Status ---
    is_read = Column(
        Boolean, 
        default=False, 
        doc="Indica se o destinatário já visualizou a mensagem"
    )
    
    is_resolved = Column(
        Boolean, 
        default=False, 
        doc="Define se o ticket ou pendência foi finalizado"
    )
    
    # --- Auditoria ---
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        doc="Data e hora do envio"
    )

    # --- Relacionamentos (ORM) ---
    company = relationship("app.models.company_model.Company", foreign_keys=[company_id])
    sender = relationship("app.models.user_model.User", foreign_keys=[sender_id])
    
    # Configuração de auto-relacionamento para threads de mensagens
    replies = relationship(
        "Message", 
        backref=backref("parent", remote_side=[id]),
        cascade="all, delete-orphan"
    )
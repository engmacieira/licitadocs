"""
Schemas de Mensagens (Pydantic).
Define a estrutura de dados para envio e leitura de mensagens (Inbox/Tickets/Chat).
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    content: str = Field(..., description="Conteúdo da mensagem")
    message_type: str = Field(default="chat", description="Tipo da mensagem: 'chat', 'system' ou 'action_required'")
    
    # --- Contexto e Anexos ---
    subject: Optional[str] = Field(None, description="Assunto do ticket/alerta")
    related_document_id: Optional[str] = Field(None, description="ID do documento vinculado (ex: certidão com pendência)")
    attachment_path: Optional[str] = Field(None, description="Caminho do arquivo anexado")
    
    # --- Sistema de Threads (Tickets) ---
    parent_id: Optional[str] = Field(None, description="ID da mensagem original se for uma resposta a um ticket")

class MessageCreate(MessageBase):
    """
    Schema para envio de uma nova mensagem (abrir ticket ou responder).
    Nota: company_id e sender_id serão injetados pelo Backend via token de forma segura.
    """
    pass
    
class MessageResponse(MessageBase):
    """
    Schema de retorno (GET). Inclui todos os metadados gerados pela base de dados.
    """
    id: str
    company_id: str
    sender_id: Optional[str] = Field(None, description="ID do remetente. Nulo se for aviso do sistema.")
    is_read: bool
    is_resolved: bool
    created_at: datetime
    
    # UX Helper: Para o Frontend exibir o nome sem precisar fazer joins complexos na tela
    sender_name: Optional[str] = Field(None, description="Nome amigável de quem enviou a mensagem")

    model_config = ConfigDict(from_attributes=True)
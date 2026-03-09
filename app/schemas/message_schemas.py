"""
Schemas de Mensagens (Pydantic).
Define a estrutura de dados para envio e leitura de mensagens (Inbox/Chat).
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    content: str = Field(..., description="Conteúdo da mensagem")
    message_type: str = Field(default="chat", description="Tipo da mensagem: 'chat' ou 'system'")

class MessageCreate(MessageBase):
    """
    Schema para envio de uma nova mensagem.
    Nota: company_id e sender_id serão injetados pelo Backend via token/rota, 
    por isso não precisamos de os expor aqui por questões de segurança.
    """
    pass
    
class MessageResponse(MessageBase):
    """
    Schema de retorno (GET). Inclui metadados completos da mensagem gerados pela base de dados.
    """
    id: str
    company_id: str
    sender_id: Optional[str] = Field(None, description="ID do remetente. Nulo se for aviso do sistema.")
    is_read: bool
    created_at: datetime
    
    # Adicionamos este campo extra para facilitar a vida ao Frontend (UX)
    # Assim o Frontend não precisa de fazer um request extra para saber o nome do remetente
    sender_name: Optional[str] = Field(None, description="Nome amigável de quem enviou a mensagem")

    model_config = ConfigDict(from_attributes=True)
"""
Schemas de Mensagens (Pydantic).
Define os contratos para o sistema de Inbox, Tickets e Chat de Suporte.
Suporta mensagens individuais, threads de resposta e envios em massa (Broadcast).
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class MessageBase(BaseModel):
    """
    Base para comunicações no sistema.
    Define o conteúdo e o contexto (assunto, documentos e anexos).
    """
    content: str = Field(..., description="Conteúdo textual da mensagem ou ticket")
    message_type: str = Field(
        default="chat", 
        description="Tipo: 'chat' (suporte), 'system' (alerta) ou 'action_required' (pendência)"
    )
    
    # --- Contexto e Anexos ---
    subject: Optional[str] = Field(None, description="Assunto do ticket ou do alerta")
    related_document_id: Optional[str] = Field(
        None, 
        description="ID do documento vinculado (ex: certidão com erro)"
    )
    attachment_path: Optional[str] = Field(
        None, 
        description="Caminho do arquivo anexo no storage"
    )
    
    # --- Sistema de Threads (Tickets) ---
    parent_id: Optional[str] = Field(
        None, 
        description="ID da mensagem original caso esta seja uma resposta"
    )

    model_config = ConfigDict(populate_by_name=True)

class MessageCreate(MessageBase):
    """
    Contrato para envio de nova mensagem (POST).
    Nota: IDs de empresa e remetente são injetados via Token no Backend.
    """
    pass
    
class MessageResponse(MessageBase):
    """
    Schema de saída para o Frontend (Módulo 2 - Inbox).
    Inclui metadados de leitura, resolução e auxílios de UX.
    """
    id: str = Field(..., description="UUID da mensagem")
    company_id: str = Field(..., description="ID da empresa vinculada")
    sender_id: Optional[str] = Field(
        None, 
        description="ID do remetente. Nulo indica mensagem automática do sistema."
    )
    is_read: bool = Field(False, description="Indica se o destinatário já leu")
    is_resolved: bool = Field(False, description="Define se o ticket foi fechado")
    created_at: datetime = Field(..., description="Data e hora do envio")
    
    # UX Helpers: Evitam múltiplos pedidos ao Frontend para buscar nomes
    sender_name: Optional[str] = Field(None, description="Nome de quem enviou")
    company_name: Optional[str] = Field(None, description="Razão social da empresa")

    model_config = ConfigDict(from_attributes=True)

class MessageBroadcast(BaseModel):
    """
    Schema exclusivo para o Administrador enviar avisos globais.
    """
    subject: str = Field(..., description="Assunto do aviso em massa")
    content: str = Field(..., description="Conteúdo da mensagem")
    send_to_all: bool = Field(
        default=False, 
        description="Se True, envia para todas as empresas da base"
    )
    company_ids: Optional[List[str]] = Field(
        default_factory=list, 
        description="Lista de IDs de empresas específicas para receber o aviso"
    )

    model_config = ConfigDict(populate_by_name=True)
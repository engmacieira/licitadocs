"""
Router de Mensagens (Inbox/Tickets/Chat).
Gere a comunicação entre o Administrador e as Empresas (Clientes), bem como avisos do sistema.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_active_user, verify_company_access, require_role
from app.models.user_model import User, UserRole
from app.models.company_model import Company
from app.models.message_model import Message
from app.schemas.message_schemas import MessageCreate, MessageResponse
from app.repositories.message_repository import MessageRepository

router = APIRouter(prefix="/messages", tags=["Caixa de Mensagens (Inbox)"])

@router.post("/{company_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    company_id: str,
    message_in: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Envia uma nova mensagem/ticket para o chat da empresa. 
    O remetente é extraído automaticamente do token de segurança.
    """
    verify_company_access(company_id, current_user)
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    new_message = MessageRepository.create(db, company_id, current_user.id, message_in)
    
    response_data = new_message.__dict__.copy()
    response_data["sender_name"] = getattr(current_user, "nome", None) or current_user.email.split("@")[0]
    
    return response_data

@router.get("/{company_id}", response_model=List[MessageResponse])
def list_messages(
    company_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista o histórico completo de mensagens/tickets de uma empresa.
    """
    verify_company_access(company_id, current_user)
    
    messages = MessageRepository.get_by_company(db, company_id)
    
    results = []
    for msg in messages:
        msg_dict = msg.__dict__.copy()
        if msg.sender:
            msg_dict["sender_name"] = getattr(msg.sender, "nome", None) or msg.sender.email.split("@")[0]
        else:
            msg_dict["sender_name"] = "Aviso do Sistema"
        results.append(msg_dict)
        
    return results

@router.patch("/{message_id}/read", status_code=status.HTTP_200_OK)
def mark_as_read(
    message_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Marca uma mensagem específica como lida (para apagar a notificação visual).
    """
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Mensagem não encontrada.")
        
    verify_company_access(message.company_id, current_user)
    
    MessageRepository.mark_as_read(db, message_id)
    return {"status": "Mensagem lida com sucesso."}

# --- NOVA ROTA: RESOLVER TICKET ---
@router.patch("/{message_id}/resolve", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def resolve_ticket(
    message_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Marca um ticket/alerta como resolvido (arquivado).
    """
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Mensagem/Ticket não encontrado.")
        
    verify_company_access(message.company_id, current_user)
    
    resolved_message = MessageRepository.resolve_ticket(db, message_id)
    
    response_data = resolved_message.__dict__.copy()
    if resolved_message.sender:
        response_data["sender_name"] = getattr(resolved_message.sender, "nome", None) or resolved_message.sender.email.split("@")[0]
    else:
        response_data["sender_name"] = "Aviso do Sistema"
        
    return response_data

@router.get("/admin/all", response_model=List[MessageResponse])
def list_all_tickets_admin(
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Retorna todos os tickets de todas as empresas para a Inbox do Administrador."""
    messages = MessageRepository.get_all_tickets_admin(db)
    results = []
    for msg in messages:
        msg_dict = msg.__dict__.copy()
        msg_dict["sender_name"] = getattr(msg.sender, "nome", None) or (msg.sender.email.split("@")[0] if msg.sender else "Sistema")
        results.append(msg_dict)
    return results
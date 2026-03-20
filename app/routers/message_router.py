"""
Router de Mensagens (Inbox/Tickets/Chat).
Gere a comunicação entre o Administrador e as Empresas (Clientes), bem como os avisos automáticos do sistema.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_active_user, verify_company_access, require_role
from app.models.user_model import User, UserRole
from app.models.message_model import Message

# Repositórios e Schemas
from app.repositories.message_repository import MessageRepository
from app.repositories.company_repository import CompanyRepository
from app.schemas.message_schemas import MessageCreate, MessageResponse, MessageBroadcast

router = APIRouter(prefix="/messages", tags=["Caixa de Mensagens (Inbox e Tickets)"])

# ==========================================
# 💬 COMUNICAÇÃO CLIENTE <-> OPERAÇÃO
# ==========================================

@router.post(
    "/{company_id}", 
    response_model=MessageResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Enviar Mensagem / Abrir Ticket"
)
def send_message(
    company_id: str,
    message_in: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Envia uma nova mensagem/ticket para a Inbox da empresa. 
    O remetente é extraído automaticamente do token de segurança para evitar falsificações.
    """
    verify_company_access(company_id, current_user)
    
    # Substituído db.query direto pelo Repositório blindado contra Soft Delete
    company = CompanyRepository.get_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada ou excluída.")

    new_message = MessageRepository.create(db, company_id, current_user.id, message_in)
    
    response_data = new_message.__dict__.copy()
    response_data["sender_name"] = getattr(current_user, "nome", None) or current_user.email.split("@")[0]
    
    return response_data

@router.get(
    "/{company_id}", 
    response_model=List[MessageResponse],
    summary="Listar Histórico de Mensagens"
)
def list_messages(
    company_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista o histórico completo de mensagens ativas e tickets de uma empresa.
    Ignora mensagens que sofreram Soft Delete (Removidas pela moderação).
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

@router.patch(
    "/{message_id}/read", 
    status_code=status.HTTP_200_OK,
    summary="Marcar Mensagem como Lida"
)
def mark_as_read(
    message_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a notificação visual de não-lida (bolinha vermelha) da mensagem."""
    # Usando o get_by_id do Repositório (que já herda a verificação de Soft Delete)
    message = MessageRepository.get_by_id(db, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Mensagem não encontrada.")
        
    verify_company_access(message.company_id, current_user)
    
    MessageRepository.mark_as_read(db, message_id)
    return {"status": "Mensagem lida com sucesso."}

@router.patch(
    "/{message_id}/resolve", 
    response_model=MessageResponse, 
    status_code=status.HTTP_200_OK,
    summary="Resolver/Fechar Ticket"
)
def resolve_ticket(
    message_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Marca um ticket ou alerta pendente como 'Resolvido' e arquiva-o."""
    message = MessageRepository.get_by_id(db, message_id)
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


# ==========================================
# 🛡️ VISÃO DO ADMINISTRADOR E BROADCASTS
# ==========================================

@router.get(
    "/admin/all", 
    response_model=List[MessageResponse],
    summary="Caixa de Entrada Global (Admin)"
)
def list_all_tickets_admin(
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Retorna todos os tickets de todas as empresas (exceto avisos de sistema) para a Inbox do Administrador."""
    messages = MessageRepository.get_all_tickets_admin(db)
    results = []
    for msg in messages:
        msg_dict = msg.__dict__.copy()
        msg_dict["sender_name"] = getattr(msg.sender, "nome", None) or (msg.sender.email.split("@")[0] if msg.sender else "Sistema")
        msg_dict["company_name"] = msg.company.razao_social if msg.company else "Empresa Excluída"
        results.append(msg_dict)
    return results

@router.get(
    "/admin/alerts", 
    response_model=List[MessageResponse],
    summary="Monitoramento de Alertas do Sistema"
)
def list_all_alerts_admin(
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Retorna todos os avisos automáticos disparados pela plataforma (Ex: Vencimentos, Irregularidades)."""
    # Substituído o db.query direto pela herança inteligente get_active_query
    messages = MessageRepository.get_active_query(db)\
        .filter(Message.message_type == "system")\
        .order_by(Message.created_at.desc())\
        .all()
    
    results = []
    for msg in messages:
        msg_dict = msg.__dict__.copy()
        msg_dict["sender_name"] = getattr(msg.sender, "nome", None) or "Sistema"
        msg_dict["company_name"] = msg.company.razao_social if msg.company else "Empresa Excluída"
        results.append(msg_dict)
        
    return results

@router.post(
    "/admin/broadcast", 
    status_code=status.HTTP_201_CREATED,
    summary="Disparo de Aviso em Massa (Broadcast)"
)
def broadcast_alert(
    payload: MessageBroadcast,
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """
    Envia um aviso (Message) simultaneamente para várias empresas selecionadas, ou para TODAS.
    """
    target_company_ids = []
    
    if payload.send_to_all:
        # ⚠️ IMPORTANTE: Usa o Repositório para NÃO enviar mensagens para empresas com Soft Delete
        companies = CompanyRepository.get_active_query(db).all()
        target_company_ids = [c.id for c in companies]
    else:
        target_company_ids = payload.company_ids

    if not target_company_ids:
        raise HTTPException(status_code=400, detail="Nenhuma empresa selecionada (ou todas as empresas estão inativas).")

    # Disparo em massa
    for comp_id in target_company_ids:
        msg_in = MessageCreate(
            content=payload.content, 
            message_type="system", 
            subject=payload.subject
        )
        MessageRepository.create(db, comp_id, current_admin.id, msg_in)

    return {"status": f"Aviso disparado com sucesso para {len(target_company_ids)} empresa(s)."}
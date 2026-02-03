from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user_model import User
from app.services.ai_service import AIService
from app.schemas.ai_schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/ai", tags=["Inteligência Artificial"])

@router.post(
    "/chat", 
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Conversar com o Concierge (RAG)",
    description="""
    Envia uma mensagem para o Assistente Virtual.
    
    A IA terá acesso **apenas** à lista de documentos (nome e validade) da empresa do usuário atual.
    Ela atua como um 'Bibliotecário', ajudando a identificar o que falta ou o que venceu.
    """
)
def chat_with_concierge(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint simplificado: Apenas repassa a intenção para o Service.
    """
    # Delega toda a inteligência para o Service
    ia_reply = AIService.generate_concierge_response(
        db=db, 
        user=current_user, 
        user_message=request.message
    )

    return ChatResponse(response=ia_reply)
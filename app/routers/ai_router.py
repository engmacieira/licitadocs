"""
Router de Inteligência Artificial (AI).
Expõe o endpoint de comunicação com o Assistente Virtual Jurídico (Concierge).
"""
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user_model import User
from app.services.ai_service import AIService
from app.schemas.ai_schemas import ChatRequest, ChatResponse
from app.core.rate_limit import limiter

# A tag foi levemente ajustada para ficar mais descritiva no Swagger
router = APIRouter(prefix="/ai", tags=["Inteligência Artificial (Concierge)"])

@router.post(
    "/chat", 
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Conversar com o Concierge (RAG)",
    description=(
        "Envia uma mensagem para o Assistente Virtual (IA).\n\n"
        "A IA terá acesso **apenas** à lista de documentos ativos da empresa "
        "do usuário atual, garantindo isolamento de dados (Multi-tenant) e "
        "ignorando documentos removidos logicamente (Soft Delete)."
    )
)
@limiter.limit("5/minute")
def chat_with_concierge(
    request: Request,
    chat_request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint que atua estritamente como Controller.
    Recebe a requisição HTTP, injeta as dependências de banco de dados e usuário autenticado,
    e delega toda a complexidade de RAG e Prompt Engineering para o AIService.
    """
    
    # A mágica acontece no Service, que agora consome o DocumentRepository blindado
    ia_reply = AIService.generate_concierge_response(
        db=db, 
        user=current_user, 
        user_message=chat_request.message
    )

    return ChatResponse(response=ia_reply)
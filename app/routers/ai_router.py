from fastapi import APIRouter, Depends, HTTPException, status
from app.services.ai_service import ai_service
from app.schemas.ai_schemas import ChatRequest, ChatResponse
from app.dependencies import get_current_user # Proteção: Só logado entra

router = APIRouter(prefix="/ai", tags=["Consultor IA"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_consultant(
    request: ChatRequest,
    current_user = Depends(get_current_user) # Injeta o usuário logado
):
    """
    Envia uma pergunta para o Consultor Especialista em Licitações (Gemini AI).
    O Consultor tem acesso ao catálogo de documentos do sistema para traduzir termos de edital.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="A mensagem não pode estar vazia.")
    
    try:
        # Chama o serviço que criamos antes
        ai_answer = ai_service.ask_consultant(request.message)
        return ChatResponse(response=ai_answer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"O Consultor está indisponível no momento: {str(e)}"
        )
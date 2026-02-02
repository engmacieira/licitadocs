from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user_model import User
from app.repositories.document_repository import DocumentRepository
from app.core.ai_client import ai_client

router = APIRouter(prefix="/ai", tags=["Inteligência Artificial"])

# Modelo para receber a pergunta do frontend
class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat_with_concierge(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Agente Concierge: Analisa a pergunta e consulta o 'Cofre' do cliente.
    """
    if not current_user.company_id:
        raise HTTPException(400, "Usuário não possui empresa vinculada.")

    # 1. Busca o Contexto (Metadados dos Documentos)
    # Não lemos o PDF, lemos o NOME e a VALIDADE.
    documents = DocumentRepository.get_by_company(db, current_user.company_id)
    
    # Transforma a lista de objetos em um texto legível para a IA
    doc_list_text = "O cliente possui os seguintes documentos no cofre:\n"
    if not documents:
        doc_list_text += "- Nenhum documento cadastrado.\n"
    else:
        for doc in documents:
            validade = doc.expiration_date.strftime("%d/%m/%Y") if doc.expiration_date else "Indeterminada"
            doc_list_text += f"- Arquivo: '{doc.filename}' | Status: {doc.status} | Validade: {validade}\n"

    # 2. Definição da Persona e Regras de Filtro (System Prompt)
    system_instruction = f"""
    Você é o Assistente Virtual do LicitaDoc, um sistema de gestão de documentos.
    
    SUA MISSÃO:
    Ajudar o cliente a saber se ele tem os documentos necessários para uma licitação, baseando-se APENAS na lista fornecida abaixo.
    
    REGRAS DE CONDUTA (FILTROS):
    1. Se a pergunta for sobre documentos, certidões, validade ou licitações: Responda consultando a lista abaixo. Faça a correlação entre termos (ex: "Regularidade Social" = "CND Federal" ou "INSS").
    2. Se a pergunta NÃO FOR sobre o contexto do sistema (ex: política, futebol, receitas, código de programação, piadas): Responda EXATAMENTE: "Desculpe, sou um assistente focado apenas em seus documentos de licitação. Posso ajudar com isso?"
    3. Seja conciso e direto. Não invente documentos que não estão na lista.
    
    DADOS DO CLIENTE (O COFRE):
    {doc_list_text}
    """

    # 3. Envia para a IA
    response = ai_client.generate_chat_response(
        message=request.message,
        context=system_instruction # Enviamos o contexto no lugar certo
    )

    return {"response": response}
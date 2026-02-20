"""
Service de IA.
Centraliza a lógica de negócio do "Concierge" (Engenharia de Prompt e Contexto).
"""
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.repositories.document_repository import DocumentRepository
from app.core.ai_client import AIClient

class AIService:
    @staticmethod
    def generate_concierge_response(db: Session, user: User, user_message: str) -> str:
        """
        Orquestra o fluxo do Chatbot:
        1. Identifica a empresa do usuário.
        2. Busca documentos dessa empresa (Contexto RAG).
        3. Chama a IA.
        """
        
        # [CORREÇÃO DE COMPATIBILIDADE SPRINT 15]
        # Antes: company_id = user.company_id
        # Agora: Pegamos a primeira empresa vinculada (Regra: Cliente vê sua empresa)
        company_id = None
        
        # 1. Tenta pegar via link direto (Jeito Novo)
        if user.company_links:
            company_id = user.company_links[0].company_id
        
        # 2. Se não achou (ex: Admin sem vínculo explícito ou usuário legado), tenta lógica alternativa
        # Mas para o chat funcionar, PRECISA de uma empresa.
        if not company_id:
             return "Não consegui identificar sua empresa para consultar os documentos. Contate o suporte."

        # 3. Busca documentos dessa empresa para dar contexto à IA
        documents = DocumentRepository.get_unified_by_company(db, company_id)
        
        # Cria um mini-resumo dos docs para a IA saber o que existe
        doc_context = "\n".join([f"- {d.filename} (Status: {d.status})" for d in documents])
        
        if not doc_context:
            doc_context = "Nenhum documento encontrado no sistema para esta empresa."

        # 4. Monta o Prompt
        system_prompt = f"""
        Você é um consultor especialista em licitações chamado 'Licitador IA'.
        Você trabalha para a empresa ID: {company_id}.
        
        O usuário tem os seguintes documentos cadastrados no sistema:
        {doc_context}
        
        Responda à dúvida do usuário com base nesses documentos e no seu conhecimento sobre licitações.
        Se ele perguntar sobre um documento que não está na lista, avise que ele precisa fazer o upload.
        Seja cordial e profissional.
        """

        # 5. Chama o Cliente LLM (Gemini/OpenAI)
        try:
            return AIClient.generate_chat_response(
                system_instruction=system_prompt,
                user_message=user_message
            )
        except Exception as e:
            print(f"Erro na IA: {e}")
            return "Desculpe, meu cérebro digital está um pouco lento agora. Tente novamente em instantes."
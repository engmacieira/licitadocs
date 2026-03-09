"""
Service de IA.
Centraliza a lógica de negócio do Assistente Virtual do Cofre (Engenharia de Prompt e Contexto).
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
        3. Chama a IA com o Prompt Blindado.
        """
        
        # 1. Identifica a empresa do utilizador
        company_id = None
        if user.company_links:
            company_id = user.company_links[0].company_id
        
        if not company_id:
             return "Não consegui identificar sua empresa para consultar os documentos. Contate o suporte."

        # 2. Busca documentos dessa empresa para dar contexto à IA
        # Utilizamos try/except para prevenir que um erro no banco quebre a integração da IA
        try:
            documents = DocumentRepository.get_unified_by_company(db, company_id)
            doc_context = "\n".join([f"- {d.filename} (Status: {d.status})" for d in documents])
        except Exception as e:
            print(f"Erro ao buscar documentos para contexto: {e}")
            doc_context = ""
        
        if not doc_context:
            doc_context = "Nenhum documento encontrado no Cofre para esta empresa no momento."

        # 3. Monta o Prompt Blindado (Engenharia de Prompt US-2413)
        system_prompt = f"""
        Você é o Assistente Virtual Exclusivo do Cofre de Documentos da plataforma LicitaDocs.
        A sua ÚNICA função é ajudar o usuário a localizar, organizar e verificar o status dos documentos que estão guardados no sistema.

        DOCUMENTOS ATUAIS NO COFRE DA EMPRESA:
        {doc_context}

        REGRAS DE BLINDAGEM (SIGA RIGOROSAMENTE):
        1. Você NÃO é um consultor jurídico ou de licitações. NÃO analise editais, NÃO interprete leis e NÃO dê dicas de como vencer pregões.
        2. Se o usuário fizer perguntas fora do escopo do cofre de documentos, responda educadamente: "Desculpe, minha função é apenas auxiliar na gestão dos documentos do seu Cofre. Não realizo análise de editais ou consultorias."
        3. Responda APENAS com base na lista de documentos acima. Se o usuário perguntar sobre um documento que não está na lista, informe claramente que ele não se encontra no Cofre e que é necessário fazer o upload.
        4. FORMATAÇÃO: O seu texto deve ser limpo. Use parágrafos curtos, tópicos (bullet points) e SEMPRE adicione quebras de linha para facilitar a leitura.
        """

        # 4. Chama o Cliente LLM (Gemini/OpenAI)
       # 4. Chama o Cliente LLM (Gemini/OpenAI)
        try:
            # Correção: Criamos a instância da classe primeiro
            ai_instance = AIClient() 
            response = ai_instance.generate_chat_response(
                message=user_message,
                context=system_prompt
            )
            return str(response)
        except Exception as e:
            print(f"Erro na integração da IA: {e}")
            return "Desculpe, o meu servidor de IA está com instabilidade no momento. Por favor, tente novamente em alguns minutos."
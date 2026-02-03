"""
Service de IA.
Centraliza a lógica de negócio do "Concierge" (Engenharia de Prompt e Contexto).
"""
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.repositories.document_repository import DocumentRepository
from app.core.ai_client import ai_client

class AIService:
    @staticmethod
    def generate_concierge_response(db: Session, user: User, user_message: str) -> str:
        """
        Orquestra o fluxo do Chatbot:
        1. Valida permissão.
        2. Busca documentos da empresa no banco (Contexto RAG).
        3. Monta o Prompt de Sistema.
        4. Chama o Client do Gemini.
        """
        
        # 1. Validação Básica
        if not user.company_id:
            return "Erro: Você não está vinculado a uma empresa para consultar documentos."

        # 2. Busca o Contexto (Metadados dos Documentos Reais)
        documents = DocumentRepository.get_by_company(db, user.company_id)
        
        # Formata a lista para texto
        doc_list_text = "O cliente possui os seguintes documentos no cofre:\n"
        if not documents:
            doc_list_text += "- Nenhum documento cadastrado (Cofre Vazio).\n"
        else:
            for doc in documents:
                validade = doc.expiration_date.strftime("%d/%m/%Y") if doc.expiration_date else "Indeterminada"
                # Adicionamos emojis para ajudar a IA a entender o status visualmente
                status_icon = "✅" if doc.status == "valid" else "⚠️" if doc.status == "warning" else "❌"
                doc_list_text += f"- {status_icon} Arquivo: '{doc.filename}' | Validade: {validade} | Status: {doc.status}\n"

        # 3. Engenharia de Prompt (Persona + Contexto)
        system_instruction = f"""
        ATUE COMO: O 'Concierge LicitaDoc', um assistente especializado em gestão documental para licitações.
        
        SEU CONTEXTO (O COFRE DA EMPRESA):
        {doc_list_text}
        
        SUAS REGRAS:
        1. OBSERVAÇÃO: Responda APENAS com base na lista de documentos acima.
        2. ANÁLISE: Se o usuário perguntar "O que falta?", analise se ele tem as certidões básicas (CNPJ, FGTS, Trabalhista, Municipal, Estadual). Se faltar alguma, avise.
        3. STATUS: Se houver documentos vencidos (❌) ou vencendo (⚠️), alerte o usuário imediatamente.
        4. TOM DE VOZ: Profissional, prestativo e direto.
        5. PROTEÇÃO: Se a pergunta não for sobre licitações ou documentos, diga que não pode ajudar.
        
        PERGUNTA DO USUÁRIO:
        "{user_message}"
        """

        # 4. Chamada à IA (Usando o método correto do AIClient)
        try:
            response_text = ai_client.generate_chat_response(
                message=user_message,
                context=system_instruction
            )
            return response_text
        except Exception as e:
            print(f"Erro no AIService: {e}")
            return "Desculpe, meu sistema de processamento está indisponível momentaneamente. Tente novamente."
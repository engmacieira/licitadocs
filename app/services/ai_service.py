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
        2. Busca documentos completos (Contexto Rico RAG).
        3. Chama a IA com o Prompt Blindado.
        """
        
        # 1. Identifica a empresa do utilizador
        company_id = None
        if user.company_links:
            company_id = user.company_links[0].company_id
        
        if not company_id:
             return "Não consegui identificar a sua empresa para consultar os documentos. Por favor, contate o suporte."

        # 2. Busca documentos dessa empresa para dar CONTEXTO RICO à IA
        try:
            # Utilizamos a busca unificada que traz todos os metadados do repositório
            documents = DocumentRepository.get_unified_by_company(db, company_id)
            doc_lines = []
            
            for d in documents:
                # Extrai dados seguros do dicionário
                nome = d.get('title') or d.get('filename') or "Documento sem nome"
                categoria = d.get('category_name') or "Outros/Geral"
                status_raw = d.get('status')
                
                # Traduz o status do sistema para uma linguagem que a IA entenda perfeitamente
                if status_raw == 'valid': status_str = "✅ Válido (Regular)"
                elif status_raw == 'expired': status_str = "❌ Vencido"
                elif status_raw == 'warning': status_str = "⚠️ Vence em breve"
                elif status_raw == 'error': status_str = "🚨 Erro na Emissão (A prefeitura/órgão falhou em emitir)"
                elif status_raw == 'irregular': status_str = "⚠️ Irregular (A empresa possui débitos/pendências no órgão)"
                elif status_raw == 'archived': status_str = "📦 Armazenado (Histórico)"
                else: status_str = status_raw
                
                validade = d.get('expiration_date')
                validade_str = validade.strftime('%d/%m/%Y') if validade else "Permanente / Sem vencimento"
                
                # Monta a linha formatada para injetar no cérebro da IA
                doc_lines.append(f"- [{categoria}] {nome} | Status: {status_str} | Validade: {validade_str}")
                
            doc_context = "\n".join(doc_lines)
            
        except Exception as e:
            print(f"Erro ao buscar documentos para contexto: {e}")
            doc_context = ""
        
        if not doc_context:
            doc_context = "Nenhum documento encontrado no Cofre para esta empresa no momento."

        # 3. Monta o Prompt Blindado (Engenharia de Prompt Máxima)
        system_prompt = f"""
        Você é o Assistente Virtual Exclusivo do Cofre de Documentos da plataforma LicitaDocs.
        A sua ÚNICA E EXCLUSIVA função é informar o usuário sobre a organização, status e validade dos documentos que estão no cofre dele.

        DOCUMENTOS ATUAIS NO COFRE DA EMPRESA:
        {doc_context}

        REGRAS DE BLINDAGEM (DIRETRIZES MÁXIMAS - SIGA RIGOROSAMENTE):
        1. LIMITAÇÃO DE ESCOPO: Você NÃO é consultor jurídico, NÃO analisa editais, NÃO redige recursos e NÃO dá dicas de como vencer licitações.
        2. DESVIO DE ASSUNTO: Se o usuário perguntar qualquer coisa fora da gestão do cofre (ex: "Analise esse edital", "O que diz a lei 14.133?", "Como ganho um pregão?", "Escreva um e-mail"), você deve NEGAR A RESPOSTA e responder EXATAMENTE assim: "Desculpe, minha função é exclusivamente auxiliar na gestão, localização e verificação das validades dos documentos do seu Cofre LicitaDocs. Não realizo análise de editais ou consultoria jurídica/comercial."
        3. RESPOSTAS PRECISAS: Baseie-se APENAS na lista de documentos fornecida acima. Se o usuário perguntar sobre um documento que não está na lista, diga que ele não consta no cofre e oriente o usuário a fazer o upload ou aguardar a equipe da LicitaDocs emitir.
        4. TOM DE VOZ: Profissional, direto, prestativo e tranquilizador.
        5. FORMATO DE SAÍDA: O seu texto deve ser limpo e escaneável. Use tópicos (bullet points) sempre que listar documentos, use emojis (✅, ❌, ⚠️, 🚨) para representar os status, e SEMPRE utilize quebras de linha duplas (\\n\\n) entre parágrafos. NÃO utilize tabelas de Markdown.

        Responda à solicitação do usuário abaixo seguindo estritamente estas regras.
        """

        # 4. Chama o Cliente LLM
        try:
            ai_instance = AIClient() 
            response = ai_instance.generate_chat_response(
                message=user_message,
                context=system_prompt
            )
            return str(response)
        except Exception as e:
            print(f"Erro na integração da IA: {e}")
            return "Desculpe, o meu servidor de IA está a sofrer uma breve instabilidade. Por favor, tente novamente num minuto. 🙏"
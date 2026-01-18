from app.core.ai_client import ai_client
from app.core.catalog import get_catalog_as_text

class AIService:
    @staticmethod
    def ask_consultant(user_message: str) -> str:
        """
        Recebe a dúvida do licitante e consulta o Gemini usando o contexto do sistema.
        """
        
        # 1. Carrega o nosso "Cardápio" de documentos
        contexto_docs = get_catalog_as_text()
        
        # 2. Engenharia de Prompt (A "Personalidade" da IA)
        system_prompt = f"""
        ATUE COMO: Um Consultor Especialista em Licitações Públicas da plataforma 'LicitaDoc'.
        
        SEU OBJETIVO: Ajudar o usuário a identificar qual documento do nosso sistema atende à exigência do edital, ou redigir declarações quando solicitado.
        
        NOSSA BASE DE CONHECIMENTO (CATÁLOGO):
        {contexto_docs}
        
        REGRAS DE RESPOSTA:
        1. TRADUÇÃO: Se o usuário citar um termo estranho (ex: "Prova de Regularidade INSS"), procure nos "SINÔNIMOS" do catálogo e diga qual é o documento correspondente (ex: "Isso corresponde à CND Federal").
        2. GERAÇÃO: Se o usuário pedir para redigir ou gerar uma declaração que está no catálogo, escreva o texto formal completo para ele copiar.
        3. HONESTIDADE: Se o documento não estiver no catálogo, diga: "Não encontrei um correspondente exato na nossa base, verifique se o nome está correto".
        4. TOME: Seja profissional, direto e útil.
        
        PERGUNTA DO USUÁRIO:
        "{user_message}"
        
        SUA RESPOSTA:
        """

        # 3. Envia para o Cérebro
        return ai_client.generate_response(system_prompt)

# Instância pronta para uso
ai_service = AIService()
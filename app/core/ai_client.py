"""
Módulo de Integração com Inteligência Artificial (Google Gemini).
Responsável por encapsular a lógica de comunicação com o modelo generativo 
para suporte ao 'Tira-Dúvidas' de certidões.
"""

import os
import logging
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Configuração de Logger para o CORE de IA
logger = logging.getLogger(__name__)

# Garantir carregamento das variáveis para instâncias isoladas
load_dotenv()

class AIClient:
    """
    Wrapper especializado para o SDK do Google Gemini (v2).
    Implementa o padrão Singleton implícito através da exportação da instância.
    """

    def __init__(self):
        """
        Inicializa o cliente da API. 
        Realiza o 'Fail Fast' silencioso caso a chave não esteja presente, 
        prevenindo queda do servidor mas alertando nos logs.
        """
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.client = None
        self.model_name = "gemini-2.0-flash"
        
        if not self.api_key:
            logger.warning("⚠️ [IA_CORE] AVISO: GOOGLE_API_KEY ausente. Funcionalidades de IA desativadas.")
        else:
            try:
                # Inicialização da SDK v2 para suporte ao Gemini 2.0
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"❌ [IA_CORE] Erro na inicialização do cliente GenAI") # Suprimindo str(e) se sensivel

    def generate_chat_response(self, message: str, context: str = "") -> tuple[str, int]:
        """
        Envia uma instrução ao modelo Gemini e processa a resposta.
        
        Args:
            message (str): Pergunta direta do usuário sobre a certidão.
            context (str, opcional): Contexto jurídico ou conteúdo do documento 
                                     para basear a resposta (RAG).
            
        Returns:
            tuple[str, int]: Resposta textual processada e número total de tokens consumidos.
        """
        if not self.client:
            return "Erro Técnico: O motor de IA não foi configurado corretamente no servidor.", 0

        try:
            # Construção do Prompt (Mantendo a lógica de RAG Simplificado do LicitaDoc)
            full_prompt = message
            if context:
                full_prompt = (
                    f"--- CONTEXTO DO DOCUMENTO ---\n"
                    f"{context}\n\n"
                    f"--- PERGUNTA DO CLIENTE ---\n"
                    f"{message}\n\n"
                    f"Responda de forma técnica, porém clara, baseando-se apenas no contexto acima."
                )

            # Chamada de geração com parâmetros otimizados para documentos jurídicos
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=1024,
                    temperature=0.7  # Equilíbrio entre precisão técnica e fluidez
                )
            )
            
            # Validação de saída extraindo token counts
            tokens_used = 0
            if response.usage_metadata and hasattr(response.usage_metadata, "total_token_count"):
                tokens_used = response.usage_metadata.total_token_count

            if response.text:
                return response.text, tokens_used
            
            return "A IA não conseguiu gerar uma resposta para este documento. Revise o conteúdo enviado.", tokens_used
            
        except Exception as e:
            # Log técnico higienizado para produção
            logger.error(f"❌ [IA_CORE] Falha na chamada ao modelo {self.model_name}")
            return "Estou com dificuldades para analisar este documento agora. Por favor, tente novamente em instantes.", 0

# Instância única para importação global (Singleton Pattern)
# Uso: from app.core.ai_client import ai_client
ai_client = AIClient()
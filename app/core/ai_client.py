import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

class AIClient:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            print("⚠️ AVISO: GOOGLE_API_KEY não encontrada no .env")
            self.client = None
        else:
            # Nova inicialização da SDK v2
            self.client = genai.Client(api_key=self.api_key)

    def generate_chat_response(self, message: str, context: str = "") -> str:
        """
        Gera uma resposta usando o modelo Gemini 2.0 Flash (mais rápido e barato).
        """
        if not self.client:
            return "Erro: Chave de API da IA não configurada no backend."

        try:
            # Monta o prompt com contexto (RAG simplificado)
            full_prompt = message
            if context:
                full_prompt = f"Contexto do Documento:\n{context}\n\nPergunta do Usuário: {message}"

            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=500,
                    temperature=0.7
                )
            )
            return response.text
        except Exception as e:
            print(f"❌ Erro na IA: {str(e)}")
            return "Desculpe, não consegui processar sua solicitação no momento."

# Instância única para ser importada
ai_client = AIClient()
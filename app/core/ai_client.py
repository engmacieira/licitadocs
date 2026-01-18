"""
Módulo de Integração com Google Gemini AI.
Responsável por enviar prompts e receber respostas da IA.
"""
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Carrega variáveis de ambiente (garantia extra)
load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")

class AIClient:
    def __init__(self):
        if not API_KEY:
            raise ValueError("GOOGLE_API_KEY não configurada no .env")
        
        genai.configure(api_key=API_KEY)
        
        # Usamos o modelo 'gemini-pro' que é otimizado para texto/chat
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def generate_response(self, prompt: str) -> str:
        """
        Envia uma mensagem para o Gemini e retorna a resposta em texto.
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Erro ao consultar IA: {str(e)}"

# Instância global para ser importada
ai_client = AIClient()
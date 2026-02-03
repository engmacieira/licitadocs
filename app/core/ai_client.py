"""
Cliente de IA (Google Gemini).
Encapsula a comunicação com a API do Google GenAI (v2).
"""
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Carrega variáveis de ambiente (.env)
load_dotenv()

class AIClient:
    """
    Wrapper para o SDK do Google Gemini.
    Gerencia autenticação e chamadas de geração de texto.
    """
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.client = None
        
        if not self.api_key:
            print("⚠️ AVISO: GOOGLE_API_KEY não encontrada no .env. O Chatbot não funcionará.")
        else:
            try:
                # Inicialização da SDK v2
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"❌ Erro fatal ao iniciar client Gemini: {e}")

    def generate_chat_response(self, message: str, context: str = "") -> str:
        """
        Envia um prompt para o modelo Gemini 2.0 Flash.
        
        Args:
            message (str): A pergunta ou instrução do usuário.
            context (str): O contexto do sistema (lista de documentos, regras, persona).
            
        Returns:
            str: A resposta em texto puro ou uma mensagem de erro amigável.
        """
        if not self.client:
            return "Erro Técnico: Chave de API da IA não configurada no servidor."

        try:
            # Monta o prompt com contexto (RAG simplificado)
            # Se houver contexto, ele vem antes da pergunta para "preparar" a IA.
            full_prompt = message
            if context:
                full_prompt = f"CONTEXTO DO SISTEMA:\n{context}\n\nPERGUNTA DO USUÁRIO:\n{message}"

            # Chamada à API
            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=1000, # Aumentei para garantir respostas jurídicas completas
                    temperature=0.7 # Criatividade equilibrada
                )
            )
            
            # Retorno seguro
            if response.text:
                return response.text
            return "A IA processou a solicitação mas não retornou texto."
            
        except Exception as e:
            # Log do erro real para o desenvolvedor
            print(f"❌ Erro na chamada Gemini: {str(e)}")
            # Resposta amigável para o usuário final
            return "Desculpe, estou com dificuldades de conexão com meu cérebro digital agora. Tente novamente em instantes."

# Instância Singleton para ser importada nos Services/Routers
ai_client = AIClient()
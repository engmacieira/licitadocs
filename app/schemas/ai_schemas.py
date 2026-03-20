"""
Schemas de Integração com IA (Pydantic).
Define os contratos de dados para o Chatbot Jurídico do LicitaDoc.
Garante que as perguntas do usuário e as respostas da IA sigam o formato esperado pelo Frontend.
"""

from pydantic import BaseModel, ConfigDict, Field

class ChatRequest(BaseModel):
    """
    Contrato de entrada para perguntas à IA (Módulo 2 - US-04).
    """
    message: str = Field(
        ...,
        description="A pergunta ou instrução do usuário para a IA",
        examples=["O edital pede 'Prova de Regularidade com o FGTS'. O que é isso?"]
    )
    
    # Permite que o Pydantic aceite dados tanto pelo nome do campo quanto pelo alias (se houver)
    model_config = ConfigDict(populate_by_name=True)

class ChatResponse(BaseModel):
    """
    Contrato de saída da IA para exibição no Widget de Chat do Frontend.
    """
    response: str = Field(
        ...,
        description="A resposta processada pela IA formatada em Markdown",
        examples=["A **Prova de Regularidade** é um documento que comprova que a empresa..."]
    )

    model_config = ConfigDict(populate_by_name=True)
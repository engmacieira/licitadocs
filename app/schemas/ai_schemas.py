"""
Schemas de IA (Pydantic).
Define a estrutura de troca de mensagens com o Chatbot Jurídico.
"""
from pydantic import BaseModel, ConfigDict, Field

class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        description="A pergunta ou instrução do usuário para a IA",
        examples=["O edital pede 'Prova de Regularidade com o FGTS'. O que é isso?"]
    )
    
    model_config = ConfigDict(populate_by_name=True)

class ChatResponse(BaseModel):
    response: str = Field(
        ...,
        description="A resposta processada pela IA (Markdown)",
        examples=["A **Prova de Regularidade** é um documento que comprova que a empresa..."]
    )

    model_config = ConfigDict(populate_by_name=True)
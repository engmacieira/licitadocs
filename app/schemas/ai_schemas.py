from pydantic import BaseModel, ConfigDict

class ChatRequest(BaseModel):
    message: str
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "message": "O edital pede 'Prova de Regularidade com o FGTS'. O que é isso?"
        }
    })

class ChatResponse(BaseModel):
    response: str
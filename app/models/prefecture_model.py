"""
Modelagem de Municípios/Prefeituras.
Responsável por armazenar contatos manuais e links para emissão de certidões municipais.
"""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base, generate_uuid

class Prefecture(Base):
    __tablename__ = "prefectures"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Localização (Para fazer o match com os dados da Company)
    state = Column(String, nullable=False, index=True) # Ex: SP, RJ
    city = Column(String, nullable=False, index=True)  # Ex: São Paulo, Campinas
    
    # US-2408: Hiperlink dinâmico para o portal da prefeitura
    emission_link = Column(String, nullable=True)
    
    # US-2409: Contatos para solicitação manual (caso não tenha portal)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    contact_whatsapp = Column(String, nullable=True)
    
    # Campo livre para a equipe de operação (Ex: "A prefeitura só atende de terça e quinta")
    operation_notes = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
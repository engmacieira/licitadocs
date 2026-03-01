"""
Modelagem da Automação de Documentos (Motor Strategy).
Define as regras e qual robô/crawler deve buscar determinado tipo de documento.
"""
from sqlalchemy import Column, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base, generate_uuid

class DocumentAutomationConfig(Base):
    __tablename__ = "document_automation_configs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Vínculo 1:1 com o DocumentType (Se o Tipo for apagado, esta config vai junto)
    document_type_id = Column(String, ForeignKey("document_types.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # --- Flags e Configurações de Estratégia ---
    is_automatable = Column(Boolean, default=False, nullable=False)
    
    # O Nome exato da classe/estratégia no backend (Ex: "RECEITA_FEDERAL_API")
    strategy_name = Column(String, nullable=True) 
    
    # A URL oficial do portal para os robôs que precisam fazer web scraping
    source_url = Column(String, nullable=True)    
    
    # Flag para sabermos se o robô vai precisar do serviço de quebra de captcha (2Captcha / AntiCaptcha)
    requires_captcha = Column(Boolean, default=False, nullable=False)
    
    # De quanto em quanto tempo o sistema deve tentar buscar (Ex: "0 0 * * *" = Meia-noite)
    cron_schedule = Column(String, nullable=True) 
    
    # 🔥 A "Cereja no Bolo": Parâmetros extras dinâmicos
    # Ex: {"requires_inscricao_estadual": true, "timeout_seconds": 120}
    extra_params = Column(JSON, nullable=True)
    
    # Relacionamento Reverso
    document_type = relationship("app.models.document_type_model.DocumentType", back_populates="automation_config")
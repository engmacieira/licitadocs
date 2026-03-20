"""
Modelagem da Automação de Documentos (Motor Strategy).
Define as regras e qual robô/crawler deve buscar determinado tipo de documento.
Essencial para o Módulo 3: A Fábrica de Certidões.
"""

from sqlalchemy import Column, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base, SoftDeleteMixin, generate_uuid

class DocumentAutomationConfig(Base, SoftDeleteMixin):
    """
    Configurações de automação vinculadas a um tipo de documento específico.
    Determina se um documento pode ser emitido automaticamente e por qual meio.
    """
    __tablename__ = "document_automation_configs"

    # --- Identificadores ---
    id = Column(
        String, 
        primary_key=True, 
        default=generate_uuid, 
        index=True,
        doc="ID único da configuração de automação"
    )
    
    # Vínculo 1:1 com o DocumentType
    document_type_id = Column(
        String, 
        ForeignKey("document_types.id", ondelete="CASCADE"), 
        unique=True, 
        nullable=False,
        doc="Vínculo obrigatório com o tipo de documento (Ex: CND Federal)"
    )
    
    # --- Flags de Operação ---
    is_automatable = Column(
        Boolean, 
        default=False, 
        nullable=False,
        doc="Define se o sistema deve tentar buscar este documento via robô"
    )
    
    requires_captcha = Column(
        Boolean, 
        default=False, 
        nullable=False,
        doc="Informa se a estratégia exige serviços de quebra de captcha (2Captcha/AntiCaptcha)"
    )
    
    # --- Estratégia e Origem ---
    strategy_name = Column(
        String, 
        nullable=True,
        doc="Nome exato da classe/estratégia no backend (Ex: 'RECEITA_FEDERAL_API')"
    ) 
    
    source_url = Column(
        String, 
        nullable=True,
        doc="URL oficial do portal de origem para web scraping ou consulta"
    )    
    
    # --- Agendamento e Parâmetros ---
    cron_schedule = Column(
        String, 
        nullable=True,
        doc="Expressão Cron para agendamento (Ex: '0 0 * * *' para execução diária)"
    ) 
    
    extra_params = Column(
        JSON, 
        nullable=True,
        doc="Parâmetros dinâmicos (Ex: timeouts, flags específicas do órgão)"
    )
    
    # --- Relacionamentos (ORM) ---
    document_type = relationship(
        "app.models.document_type_model.DocumentType", 
        back_populates="automation_config"
    )
"""
Modelagem de Empresas (Tenant).
Entidade central responsável pelos dados da Pessoa Jurídica, 
configurações de Onboarding e gestão de membros.
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, SoftDeleteMixin, generate_uuid

class Company(Base, SoftDeleteMixin):
    """
    Representa uma Empresa Licitante no sistema.
    Gerencia o estado de conformidade (Onboarding) e o vínculo com os usuários.
    """
    __tablename__ = "companies"

    # --- Identificador Único ---
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # --- Dados Cadastrais (PJ) ---
    cnpj = Column(String, unique=True, index=True, nullable=False, doc="CNPJ da empresa (chave de busca principal)")
    razao_social = Column(String, nullable=False, doc="Nome jurídico oficial")
    nome_fantasia = Column(String, nullable=True)
    inscricao_estadual = Column(String, nullable=True)
    inscricao_municipal = Column(String, nullable=True)
    
    # --- Localização (Endereço Completo) ---
    cep = Column(String, nullable=True)
    logradouro = Column(String, nullable=True)
    numero = Column(String, nullable=True)
    complemento = Column(String, nullable=True)
    bairro = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    estado = Column(String, nullable=True, doc="UF da sede da empresa")
    
    # --- Contato e Responsabilidade Jurídica ---
    telefone = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    email_corporativo = Column(String, nullable=True)
    responsavel_nome = Column(String, nullable=True, doc="Nome do sócio/procurador responsável")
    responsavel_cpf = Column(String, nullable=True)

    # --- Propriedade e Auditoria ---
    owner_id = Column(
        String, 
        ForeignKey("users.id"), 
        nullable=True, 
        doc="Usuário que realizou o cadastro inicial"
    )
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, doc="Define se a empresa tem acesso ao sistema")
    
    # --- Fluxo de Onboarding (Flags de Regularidade) ---
    is_terms_accepted = Column(Boolean, default=False, doc="1. Aceite dos termos de uso")
    is_payment_active = Column(Boolean, default=False, doc="2. Status da assinatura/pagamento")
    is_data_completed = Column(Boolean, default=False, doc="3. Perfil da empresa 100% preenchido")
    is_contract_signed = Column(Boolean, default=False, doc="4. Procuração digital assinada")
    is_admin_verified = Column(Boolean, default=False, doc="5. Verificação manual da equipe LicitaDoc")

    # --- Assinatura e Recorrência (Infinite Pay) ---
    subscription_status = Column(String, default="pending", doc="Status da assinatura (pending, active, past_due, canceled, expired, refunded)")
    subscription_plan = Column(String, nullable=True, default="PRO", doc="Plano contratado")
    subscription_external_id = Column(String, nullable=True, index=True, doc="Identificador externo da assinatura/pedido")
    subscription_current_period_end = Column(DateTime(timezone=True), nullable=True, doc="Fim do período vigente da assinatura")
    last_payment_at = Column(DateTime(timezone=True), nullable=True, doc="Data/hora do último pagamento confirmado")
    
    # Registro de pendências apontadas pela moderação
    admin_pendencies = Column(Text, nullable=True)
    
    # --- Relacionamentos (ORM) ---
    # Vinculo com o criador
    owner = relationship(
        "app.models.user_model.User", 
        back_populates="owned_companies", 
        foreign_keys=[owner_id]
    )
    
    # Membros da empresa (N:N via tabela associativa)
    members = relationship(
        "app.models.user_model.UserCompanyLink", 
        back_populates="company", 
        cascade="all, delete-orphan"
    )
    
    # Documentos e Certidões vinculados
    documents = relationship(
        "app.models.document_model.Document", 
        back_populates="company", 
        cascade="all, delete-orphan"
    )
    
    @property
    def is_regular(self):
        """
        Lógica de Negócio: Retorna True apenas se a empresa cumprir os 
        requisitos críticos de operação (Contrato, Pagamento e Verificação Admin).
        """
        owner_email_verified = self.owner.is_email_verified if self.owner else False
        return self.is_contract_signed and self.is_payment_active and self.is_admin_verified and owner_email_verified
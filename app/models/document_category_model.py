"""
Modelagem de Categorias de Documentos.
Define os grandes grupos organizacionais do Cofre Digital (Ex: Jurídico, Fiscal).
Responsável por ditar a hierarquia visual e lógica no Dashboard de Conformidade.
"""

from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base, SoftDeleteMixin, generate_uuid

class DocumentCategory(Base, SoftDeleteMixin):
    """
    Representa uma categoria de alto nível para classificação de documentos.
    Utilizado para agrupar 'DocumentTypes' e facilitar a navegação do cliente.
    """
    __tablename__ = "document_categories"

    # --- Identificadores ---
    id = Column(
        String, 
        primary_key=True, 
        default=generate_uuid, 
        index=True,
        doc="ID único da categoria (UUID)"
    )
    
    # --- Dados de Exibição e Identificação ---
    name = Column(
        String, 
        nullable=False,
        doc="Nome amigável da categoria (Ex: 'Habilitação Jurídica')"
    )
    
    slug = Column(
        String, 
        unique=True, 
        index=True, 
        nullable=False,
        doc="Identificador textual único para uso em URLs ou filtros de código (slug)"
    )
    
    # --- Controle de Interface ---
    order = Column(
        Integer, 
        default=0,
        doc="Define a prioridade de exibição na lista do Frontend (ordem crescente)"
    )

    # --- Relacionamentos (ORM) ---
    # Uma categoria possui vários tipos de documentos vinculados.
    # Se a categoria for removida, seus tipos associados também serão (Cascade).
    types = relationship(
        "DocumentType", 
        back_populates="category", 
        cascade="all, delete-orphan"
    )
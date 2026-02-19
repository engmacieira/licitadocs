"""
Modelagem de Categorias de Documentos.
Define os grandes grupos do Cofre Digital (Ex: Jurídico, Fiscal, Técnico).
"""
from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base, generate_uuid

class DocumentCategory(Base):
    __tablename__ = "document_categories"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Ex: "Habilitação Jurídica"
    name = Column(String, nullable=False)
    
    # Ex: "juridica" (Para uso interno/código)
    slug = Column(String, unique=True, index=True, nullable=False)
    
    # Para ordenação visual no Frontend (1, 2, 3...)
    order = Column(Integer, default=0)

    # Relacionamento com Tipos
    types = relationship("DocumentType", back_populates="category", cascade="all, delete-orphan")
"""
Repositório Base (Genérico).
Implementa o princípio DRY (Don't Repeat Yourself) e centraliza a lógica de 
Soft Delete para todas as consultas do sistema.
"""

from typing import TypeVar, Generic, Type, Optional, List, Any
from sqlalchemy.orm import Session
from datetime import datetime

# Define um tipo genérico para os Modelos do SQLAlchemy
ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):
    """
    Classe pai para todos os repositórios.
    As classes filhas devem definir o atributo 'model'.
    """
    model: Type[ModelType]

    @classmethod
    def get_active_query(cls, db: Session):
        """
        O coração do Soft Delete. 
        Retorna uma query base que JÁ IGNORA automaticamente os registros deletados.
        """
        query = db.query(cls.model)
        if hasattr(cls.model, 'deleted_at'):
            return query.filter(cls.model.deleted_at.is_(None))
        return query

    @classmethod
    def get_by_id(cls, db: Session, id: Any) -> Optional[ModelType]:
        """Busca padrão por ID respeitando o Soft Delete."""
        return cls.get_active_query(db).filter(cls.model.id == id).first()

    @classmethod
    def get_all(cls, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Listagem padrão com paginação respeitando o Soft Delete."""
        return cls.get_active_query(db).offset(skip).limit(limit).all()

    @classmethod
    def soft_delete(cls, db: Session, id: Any) -> bool:
        """
        Executa a exclusão lógica (Soft Delete) marcando a data e hora atual.
        Se o modelo não suportar, faz o Hard Delete como fallback.
        """
        obj = cls.get_by_id(db, id)
        if not obj:
            return False
            
        try:
            if hasattr(obj, 'deleted_at'):
                obj.deleted_at = datetime.now() # Marca como deletado
            else:
                db.delete(obj) # Fallback para tabelas associativas
                
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise ValueError(f"Erro ao deletar registro: {str(e)}")
"""
Repositório Base (Genérico).
Implementa o princípio DRY (Don't Repeat Yourself) e centraliza a lógica de 
Soft Delete para todas as consultas do sistema.
"""

from typing import TypeVar, Generic, Type, Optional, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from datetime import datetime, timezone

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
        """
        Busca dinâmica por ID respeitando o Soft Delete.
        Identifica automaticamente a coluna de Chave Primária.
        """
        # Se o modelo tiver atributo 'id', usa ele diretamente (Performance)
        if hasattr(cls.model, 'id'):
            return cls.get_active_query(db).filter(cls.model.id == id).first()
        
        # Fallback dinâmico para PKs com nomes diferentes de 'id'
        try:
            mapper = inspect(cls.model)
            pk_column = mapper.primary_key[0]
            return cls.get_active_query(db).filter(pk_column == id).first()
        except (AttributeError, IndexError):
            # Fallback seguro: Caso o modelo não possua uma PK bem definida ou identidada
            return None

    @classmethod
    def get_all(cls, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Listagem padrão com paginação respeitando o Soft Delete."""
        return cls.get_active_query(db).offset(skip).limit(limit).all()

    @classmethod
    def soft_delete(cls, db: Session, id: Any) -> Any:
        """
        Executa a exclusão lógica (Soft Delete) marcando a data e hora atual (UTC Aware).
        Retorna o objeto modificado ou None se não encontrado.
        A responsabilidade do commit() é da camada superior (Unit of Work).
        """
        obj = cls.get_by_id(db, id)
        if not obj:
            return None
            
        if hasattr(obj, 'deleted_at'):
            obj.deleted_at = datetime.now(timezone.utc) # Timezone Awareness (UTC)
        else:
            db.delete(obj) # Fallback para tabelas sem Soft Delete
            
        db.flush() # Sincroniza o estado com a sessão sem efetivar a transação
        return obj
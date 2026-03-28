"""
Repositório Base (Genérico).
Implementa o princípio DRY (Don't Repeat Yourself) e centraliza a lógica de
Soft Delete para todas as consultas do sistema.
"""

from typing import TypeVar, Generic, Type, Optional, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from datetime import datetime, timezone
import asyncio

from app.core.context import request_id_var, user_id_var
from app.repositories.audit_repository import AuditRepository

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
    def create(cls, db: Session, obj_in: Any) -> Any:
        """
        Insere um novo registro genérico e aciona a auditoria.
        """
        # Convertemos obj_in que pode ser um Pydantic Schema para Dicionário
        obj_data = obj_in.dict(exclude_unset=True) if hasattr(obj_in, 'dict') else (obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, 'model_dump') else obj_in)

        db_obj = cls.model(**obj_data)
        db.add(db_obj)
        db.flush()  # Para obtermos o ID gerado (se for autoincremento/default db)

        new_data = cls._extract_model_dict(db_obj)
        entity_id = str(getattr(db_obj, 'id', ''))
        cls._trigger_audit("CREATE", entity_id, {}, new_data)

        return db_obj

    @classmethod
    def update(cls, db: Session, db_obj: Any, obj_in: Any) -> Any:
        """
        Atualiza um registro genérico e aciona a auditoria.
        """
        old_data = cls._extract_model_dict(db_obj)

        obj_data = obj_in.dict(exclude_unset=True) if hasattr(obj_in, 'dict') else (obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, 'model_dump') else obj_in)

        for field, value in obj_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        db.flush()

        new_data = cls._extract_model_dict(db_obj)
        entity_id = str(getattr(db_obj, 'id', ''))
        cls._trigger_audit("UPDATE", entity_id, old_data, new_data)

        return db_obj

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

        old_data = cls._extract_model_dict(obj)

        if hasattr(obj, 'deleted_at'):
            obj.deleted_at = datetime.now(timezone.utc) # Timezone Awareness (UTC)
        else:
            db.delete(obj) # Fallback para tabelas sem Soft Delete

        db.flush() # Sincroniza o estado com a sessão sem efetivar a transação

        new_data = cls._extract_model_dict(obj)
        entity_id = str(getattr(obj, 'id', id))
        cls._trigger_audit("DELETE", entity_id, old_data, new_data)

        return obj

    @classmethod
    def _extract_model_dict(cls, obj: Any) -> dict:
        """Helper para extrair dicionário de um modelo SQLAlchemy."""
        if not obj:
            return {}
        try:
            state = inspect(obj)
            data = {}
            for attr in state.mapper.column_attrs:
                val = getattr(obj, attr.key)
                if hasattr(val, 'isoformat'):
                    val = val.isoformat()
                elif isinstance(val, (memoryview, bytes)):
                    val = "<binary_data>"
                else:
                    val = str(val) if val is not None else None
                data[attr.key] = val
            return data
        except Exception:
            return {}

    @classmethod
    def _trigger_audit(cls, action: str, entity_id: str, old_data: dict, new_data: dict):
        """Envia log de auditoria via worker thread limpa do event loop ASGI para não bloquear a requisição HTTP."""
        req_id = request_id_var.get()
        user_id = user_id_var.get()
        entity_name = cls.model.__name__

        try:
            # Em vez de criar instâncias isoladas de threading que não acompanham hooks
            # de ciclo de vida do Uvicorn, enviamos pro pool global thread nativo do loop ASGI
            # (get_running_loop().run_in_executor ou asyncio.to_thread).
            # Fallback seguro para sincronicidade se não tivermos em um escopo asincrono
            try:
                loop = asyncio.get_running_loop()
                loop.run_in_executor(
                    None,
                    AuditRepository.create_audit_log_async,
                    entity_name, entity_id, action, user_id, old_data, new_data, req_id
                )
            except RuntimeError:
                # Caso chamado fora de um event loop async, fallback import thread daemon
                import threading
                threading.Thread(
                    target=AuditRepository.create_audit_log_async,
                    args=(entity_name, entity_id, action, user_id, old_data, new_data, req_id),
                    daemon=True
                ).start()
        except Exception:
            pass

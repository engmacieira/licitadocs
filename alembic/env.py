import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ------------------------------------------------------------------
# 1. Configurar o Python Path para encontrar a pasta 'app'
# Sem isso, o Alembic não consegue importar seus models.
# ------------------------------------------------------------------
sys.path.append(os.getcwd())

# ------------------------------------------------------------------
# 2. Carregar variáveis de ambiente (.env)
# ------------------------------------------------------------------
from dotenv import load_dotenv
load_dotenv()

# ------------------------------------------------------------------
# 3. Importar a Base e os Models
# IMPORTANTE: Importe TODOS os arquivos de modelo aqui.
# Se um modelo não for importado, o Alembic não detecta a tabela.
# ------------------------------------------------------------------
from app.core.database import Base
from app.models import user_model, company_model, document_model, certificate_model  

# ------------------------------------------------------------------
# 4. Configurações do Alembic
# ------------------------------------------------------------------
config = context.config

# Configura o Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Define o alvo para 'autogenerate' (nossos models)
target_metadata = Base.metadata

def get_url():
    """
    Busca a URL do banco de dados.
    Prioridade: Variável de ambiente DATABASE_URL ou DB_URL > Fallback SQLite
    """
    return os.getenv("DATABASE_URL", os.getenv("DB_URL", "sqlite:///./licita_doc.db"))

def run_migrations_offline() -> None:
    """Executa migrations no modo 'offline' (sem conexão, apenas gera SQL)."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Executa migrations no modo 'online' (conectado ao banco)."""
    
    # Injeta a URL dinâmica na configuração do Alembic
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            # Importante para SQLite (alterações de schema):
            render_as_batch=True 
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
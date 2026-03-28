from alembic.config import Config
from alembic import command

alembic_cfg = Config("alembic.ini")
command.revision(alembic_cfg, message="Add audit_logs table", autogenerate=False)

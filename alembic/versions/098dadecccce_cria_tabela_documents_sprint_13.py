"""cria tabela documents sprint 13

Revision ID: 098dadecccce
Revises: 4c5538cffadb
Create Date: 2026-02-05 16:54:49.232149

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '098dadecccce'
down_revision: Union[str, Sequence[str], None] = '4c5538cffadb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 1. Cria a tabela documents (Isso estava faltando!)
    op.create_table('documents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('expiration_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('company_id', sa.String(), nullable=False),
        sa.Column('uploaded_by_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 2. Cria índices para performance (Opcional, mas recomendado)
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)

    # 3. Ajuste de FK que o Alembic já tinha detectado (Mantemos aqui)
    with op.batch_alter_table('companies', schema=None) as batch_op:
        batch_op.create_foreign_key('fk_company_owner', 'users', ['owner_id'], ['id'], use_alter=True)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('companies', schema=None) as batch_op:
        batch_op.drop_constraint('fk_company_owner', type_='foreignkey')

    op.drop_index(op.f('ix_documents_id'), table_name='documents')
    op.drop_table('documents')
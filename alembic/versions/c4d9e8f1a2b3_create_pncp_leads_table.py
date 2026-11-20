"""create_pncp_leads_table

Revision ID: c4d9e8f1a2b3
Revises: bfa99cf9e4b4
Create Date: 2026-11-20 20:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4d9e8f1a2b3'
down_revision: Union[str, Sequence[str], None] = 'bfa99cf9e4b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'pncp_leads',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('cnpj', sa.String(length=14), nullable=False),
        sa.Column('razao_social', sa.String(), nullable=False),
        sa.Column('nome_fantasia', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('telefone', sa.String(), nullable=True),
        sa.Column('uf', sa.String(length=2), nullable=True),
        sa.Column('municipio', sa.String(), nullable=True),
        sa.Column('porte', sa.String(), nullable=True),
        sa.Column('origem_pncp', sa.String(), nullable=True),
        sa.Column('last_contacted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('contact_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_contact_channel', sa.String(length=50), nullable=True),
        sa.Column('last_contact_notes', sa.Text(), nullable=True),
        sa.Column('spam_cooldown_days', sa.Integer(), server_default='7', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_pncp_leads_id'), 'pncp_leads', ['id'], unique=False)
    op.create_index(op.f('ix_pncp_leads_cnpj'), 'pncp_leads', ['cnpj'], unique=True)
    op.create_index(op.f('ix_pncp_leads_uf'), 'pncp_leads', ['uf'], unique=False)
    op.create_index(op.f('ix_pncp_leads_last_contacted_at'), 'pncp_leads', ['last_contacted_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_pncp_leads_last_contacted_at'), table_name='pncp_leads')
    op.drop_index(op.f('ix_pncp_leads_uf'), table_name='pncp_leads')
    op.drop_index(op.f('ix_pncp_leads_cnpj'), table_name='pncp_leads')
    op.drop_index(op.f('ix_pncp_leads_id'), table_name='pncp_leads')
    op.drop_table('pncp_leads')

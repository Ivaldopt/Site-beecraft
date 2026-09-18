"""customs declaration audit and automatic numbering"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260917_04"
down_revision = "20260917_03"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE SEQUENCE customs_declaration_number_seq START WITH 1")
    op.create_table(
        "customs_declarations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("number", sa.String(40), nullable=False, unique=True),
        sa.Column("document_type", sa.String(30), nullable=False),
        sa.Column("recipient_name", sa.String(180), nullable=True),
        sa.Column("recipient_country", sa.String(3), nullable=True),
        sa.Column("total_value", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("payload", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("printed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_customs_declarations_number", "customs_declarations", ["number"], unique=True)
    op.create_index("ix_customs_declarations_created_by_id", "customs_declarations", ["created_by_id"])


def downgrade():
    op.drop_table("customs_declarations")
    op.execute("DROP SEQUENCE customs_declaration_number_seq")

"""fixed and variable business costs"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260917_05"
down_revision = "20260917_04"
branch_labels = None
depends_on = None


def upgrade():
    cost_type = postgresql.ENUM("FIXED", "VARIABLE", name="businesscosttype", create_type=False)
    cost_type.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "business_costs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("cost_type", cost_type, nullable=False),
        sa.Column("category", sa.String(80), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("reference_month", sa.Date(), nullable=False),
        sa.Column("due_day", sa.Integer(), nullable=True),
        sa.Column("recurring", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("paid", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    for column in ("name", "cost_type", "category", "reference_month", "paid", "created_by_id"):
        op.create_index(f"ix_business_costs_{column}", "business_costs", [column])


def downgrade():
    op.drop_table("business_costs")
    postgresql.ENUM(name="businesscosttype").drop(op.get_bind(), checkfirst=True)

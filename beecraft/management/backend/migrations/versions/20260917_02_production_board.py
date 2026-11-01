"""Add daily production board fields."""

import sqlalchemy as sa
from alembic import op

revision = "20260917_02"
down_revision = "20260903_01"
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Numa base nova, a migração 01 já cria o esquema atual (create_all), por isso
    # só se acrescenta o que ainda não existe. Bases antigas continuam a funcionar.
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("sales")}
    indexes = {index["name"] for index in inspector.get_indexes("sales")}
    if "production_status" not in columns:
        op.add_column("sales", sa.Column("production_status", sa.String(30), nullable=False, server_default="OPEN"))
    if "production_date" not in columns:
        op.add_column("sales", sa.Column("production_date", sa.Date(), nullable=True))
    if "ix_sales_production_status" not in indexes:
        op.create_index("ix_sales_production_status", "sales", ["production_status"])
    if "ix_sales_production_date" not in indexes:
        op.create_index("ix_sales_production_date", "sales", ["production_date"])
    op.execute("UPDATE sales SET production_date = CAST(sold_at AS date) WHERE production_date IS NULL")

def downgrade() -> None:
    op.drop_index("ix_sales_production_date", table_name="sales")
    op.drop_index("ix_sales_production_status", table_name="sales")
    op.drop_column("sales", "production_date")
    op.drop_column("sales", "production_status")

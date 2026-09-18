"""Add daily production board fields."""

import sqlalchemy as sa
from alembic import op

revision = "20260917_02"
down_revision = "20260903_01"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("sales", sa.Column("production_status", sa.String(30), nullable=False, server_default="OPEN"))
    op.add_column("sales", sa.Column("production_date", sa.Date(), nullable=True))
    op.create_index("ix_sales_production_status", "sales", ["production_status"])
    op.create_index("ix_sales_production_date", "sales", ["production_date"])
    op.execute("UPDATE sales SET production_date = CAST(sold_at AS date) WHERE production_date IS NULL")

def downgrade() -> None:
    op.drop_index("ix_sales_production_date", table_name="sales")
    op.drop_index("ix_sales_production_status", table_name="sales")
    op.drop_column("sales", "production_date")
    op.drop_column("sales", "production_status")

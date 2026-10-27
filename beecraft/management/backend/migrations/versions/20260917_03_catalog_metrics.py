"""catalog metrics

Revision ID: 20260917_03
Revises: 20260917_02
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260917_03"
down_revision = "20260917_02"
branch_labels = None
depends_on = None


def upgrade():
    if sa.inspect(op.get_bind()).has_table("catalog_events"):
        return  # já criada pela migração 01 (create_all) numa base nova
    event_type = postgresql.ENUM(
        "PAGE_VIEW", "PRODUCT_VIEW", "ADD_TO_CART", "WHATSAPP_CLICK",
        name="catalogeventtype", create_type=False,
    )
    event_type.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "catalog_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("event_type", event_type, nullable=False),
        sa.Column("visitor_id", sa.String(64), nullable=False),
        sa.Column("product_slug", sa.String(180), nullable=True),
        sa.Column("path", sa.String(300), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for column in ("event_type", "visitor_id", "product_slug", "occurred_at"):
        op.create_index(f"ix_catalog_events_{column}", "catalog_events", [column])


def downgrade():
    op.drop_table("catalog_events")
    postgresql.ENUM(name="catalogeventtype").drop(op.get_bind(), checkfirst=True)

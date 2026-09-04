from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Query
from sqlalchemy import case, func, select

from ..deps import DB, CurrentUser
from ..models import InventoryItem, MovementType, Product, Sale, SaleItem, StockMovement

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def dashboard(
    db: DB, _: CurrentUser, period: str = Query(default="daily", pattern="^(daily|weekly|monthly)$")
):
    now = datetime.now(UTC)
    month_start = datetime(now.year, now.month, 1, tzinfo=UTC)
    period_config = {
        "daily": ("day", now - timedelta(days=30)),
        "weekly": ("week", now - timedelta(weeks=12)),
        "monthly": ("month", now - timedelta(days=365)),
    }
    bucket, since = period_config[period]
    summary = (
        db.execute(
            select(
                func.coalesce(func.sum(Sale.total), 0).label("revenue"),
                func.coalesce(func.sum(Sale.net_profit), 0).label("profit"),
                func.count(Sale.id).label("sales_count"),
            ).where(Sale.sold_at >= month_start)
        )
        .mappings()
        .one()
    )
    active_customers = db.scalar(
        select(func.count(func.distinct(Sale.customer_id))).where(
            Sale.sold_at >= now - timedelta(days=90), Sale.customer_id.is_not(None)
        )
    )
    series = (
        db.execute(
            select(
                func.date_trunc(bucket, Sale.sold_at).label("date"),
                func.sum(Sale.total).label("sales"),
                func.sum(Sale.net_profit).label("profit"),
            )
            .where(Sale.sold_at >= since)
            .group_by("date")
            .order_by("date")
        )
        .mappings()
        .all()
    )
    stock_flow = (
        db.execute(
            select(
                func.date_trunc(bucket, StockMovement.occurred_at).label("date"),
                func.sum(
                    case(
                        (StockMovement.movement_type == MovementType.IN, StockMovement.quantity),
                        else_=0,
                    )
                ).label("incoming"),
                func.sum(
                    case(
                        (StockMovement.movement_type == MovementType.OUT, StockMovement.quantity),
                        else_=0,
                    )
                ).label("outgoing"),
            )
            .where(StockMovement.occurred_at >= since)
            .group_by("date")
            .order_by("date")
        )
        .mappings()
        .all()
    )
    top_products = (
        db.execute(
            select(
                SaleItem.product_id,
                Product.name.label("product_name"),
                func.sum(SaleItem.quantity).label("units"),
                func.sum((SaleItem.unit_price - SaleItem.unit_cost) * SaleItem.quantity).label(
                    "profit"
                ),
            )
            .join(Sale)
            .join(Product, Product.id == SaleItem.product_id)
            .where(Sale.sold_at >= month_start)
            .group_by(SaleItem.product_id, Product.name)
            .order_by(func.sum(SaleItem.quantity).desc())
            .limit(5)
        )
        .mappings()
        .all()
    )
    low_stock = db.scalars(
        select(InventoryItem)
        .where(
            InventoryItem.active.is_(True),
            InventoryItem.stock_quantity <= InventoryItem.minimum_stock,
        )
        .order_by(InventoryItem.stock_quantity)
        .limit(20)
    ).all()
    revenue = Decimal(summary["revenue"])
    count = summary["sales_count"]
    return {
        "indicators": {
            "monthly_revenue": revenue,
            "monthly_profit": summary["profit"],
            "average_ticket": revenue / count if count else 0,
            "active_customers": active_customers or 0,
        },
        "sales_series": series,
        "stock_flow": stock_flow,
        "top_products": top_products,
        "low_stock": low_stock,
    }

from datetime import UTC, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from ..deps import CurrentUser, DB
from ..models import CatalogEvent, CatalogEventType

router = APIRouter(tags=["Métricas do catálogo"])


class EventCreate(BaseModel):
    event_type: Literal["PAGE_VIEW", "PRODUCT_VIEW", "ADD_TO_CART", "WHATSAPP_CLICK"]
    visitor_id: str = Field(min_length=8, max_length=64)
    product_slug: str | None = Field(default=None, max_length=180)
    path: str | None = Field(default=None, max_length=300)


@router.post("/public/metrics/event", status_code=204)
def record_event(payload: EventCreate, db: DB):
    db.add(CatalogEvent(**payload.model_dump()))
    db.commit()


@router.get("/metrics/catalog")
def catalog_metrics(db: DB, _: CurrentUser, days: int = Query(default=30, ge=7, le=365)):
    since = datetime.now(UTC) - timedelta(days=days - 1)
    filters = CatalogEvent.occurred_at >= since
    totals = dict(db.execute(select(
        CatalogEvent.event_type, func.count(CatalogEvent.id)
    ).where(filters).group_by(CatalogEvent.event_type)).all())
    unique_visitors = db.scalar(select(func.count(func.distinct(CatalogEvent.visitor_id))).where(filters)) or 0
    series = db.execute(select(
        func.date(CatalogEvent.occurred_at).label("date"),
        func.count(CatalogEvent.id).label("visits"),
        func.count(func.distinct(CatalogEvent.visitor_id)).label("visitors"),
    ).where(filters, CatalogEvent.event_type == CatalogEventType.PAGE_VIEW).group_by("date").order_by("date")).mappings().all()
    top_products = db.execute(select(
        CatalogEvent.product_slug,
        func.count(CatalogEvent.id).label("views"),
    ).where(filters, CatalogEvent.event_type == CatalogEventType.PRODUCT_VIEW, CatalogEvent.product_slug.is_not(None)).group_by(CatalogEvent.product_slug).order_by(func.count(CatalogEvent.id).desc()).limit(8)).mappings().all()
    return {
        "days": days,
        "totals": {
            "visits": totals.get(CatalogEventType.PAGE_VIEW, 0),
            "unique_visitors": unique_visitors,
            "product_views": totals.get(CatalogEventType.PRODUCT_VIEW, 0),
            "add_to_cart": totals.get(CatalogEventType.ADD_TO_CART, 0),
            "whatsapp": totals.get(CatalogEventType.WHATSAPP_CLICK, 0),
        },
        "series": series,
        "top_products": top_products,
    }

import uuid
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..deps import DB, CurrentUser
from ..models import (
    InventoryItem,
    MovementReason,
    MovementType,
    Product,
    ProductMaterial,
    Purchase,
    PurchaseItem,
    Sale,
    SaleItem,
    StockMovement,
)
from ..schemas import PurchaseCreate, SaleCreate, StockMovementCreate
from .catalog import product_cost

router = APIRouter(tags=["Operações"])
CENT = Decimal("0.01")


def number(prefix: str) -> str:
    date = datetime.now(UTC).strftime("%Y%m%d")
    return f"{prefix}-{date}-{uuid.uuid4().hex[:8].upper()}"


def lock_item(db: DB, item_id: uuid.UUID) -> InventoryItem:
    item = db.scalar(select(InventoryItem).where(InventoryItem.id == item_id).with_for_update())
    if not item:
        raise HTTPException(404, "Item de stock não encontrado")
    return item


def change_stock(
    db: DB,
    item: InventoryItem,
    movement_type: MovementType,
    reason: MovementReason,
    quantity: Decimal,
    occurred_at: datetime,
    unit_cost: Decimal | None = None,
    reference_type: str | None = None,
    reference_id: uuid.UUID | None = None,
    notes: str | None = None,
) -> StockMovement:
    if movement_type == MovementType.OUT and item.stock_quantity < quantity:
        raise HTTPException(409, f"Stock insuficiente para {item.name}")
    item.stock_quantity += quantity if movement_type == MovementType.IN else -quantity
    movement = StockMovement(
        inventory_item_id=item.id,
        movement_type=movement_type,
        reason=reason,
        quantity=quantity,
        unit_cost=unit_cost,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
        occurred_at=occurred_at,
    )
    db.add(movement)
    return movement


@router.post("/stock/movements", status_code=201)
def manual_movement(payload: StockMovementCreate, db: DB, _: CurrentUser):
    try:
        item = lock_item(db, payload.inventory_item_id)
        movement = change_stock(
            db,
            item,
            payload.movement_type,
            payload.reason,
            payload.quantity,
            payload.occurred_at,
            payload.unit_cost,
            notes=payload.notes,
        )
        db.commit()
        db.refresh(movement)
        return movement
    except Exception:
        db.rollback()
        raise


@router.get("/stock/movements")
def movements(
    db: DB,
    _: CurrentUser,
    item_id: uuid.UUID | None = None,
    limit: int = Query(default=200, ge=1, le=1000),
):
    query = select(StockMovement).order_by(StockMovement.occurred_at.desc()).limit(limit)
    if item_id:
        query = query.where(StockMovement.inventory_item_id == item_id)
    return db.scalars(query).all()


@router.post("/purchases", status_code=201)
def create_purchase(payload: PurchaseCreate, db: DB, _: CurrentUser):
    try:
        purchase = Purchase(
            number=number("CMP"),
            supplier_id=payload.supplier_id,
            purchased_at=payload.purchased_at,
            notes=payload.notes,
            total=sum((line.quantity * line.unit_cost for line in payload.items), Decimal(0)),
        )
        db.add(purchase)
        db.flush()
        for line in payload.items:
            item = lock_item(db, line.inventory_item_id)
            old_value = item.stock_quantity * item.average_cost
            new_quantity = item.stock_quantity + line.quantity
            item.average_cost = (
                (old_value + line.quantity * line.unit_cost) / new_quantity
            ).quantize(Decimal("0.0001"), ROUND_HALF_UP)
            db.add(PurchaseItem(purchase_id=purchase.id, **line.model_dump()))
            change_stock(
                db,
                item,
                MovementType.IN,
                MovementReason.PURCHASE,
                line.quantity,
                payload.purchased_at,
                line.unit_cost,
                "purchase",
                purchase.id,
            )
        db.commit()
        db.refresh(purchase)
        return purchase
    except Exception:
        db.rollback()
        raise


@router.get("/purchases")
def purchases(db: DB, _: CurrentUser, limit: int = Query(default=100, ge=1, le=1000)):
    return db.scalars(
        select(Purchase)
        .options(selectinload(Purchase.supplier), selectinload(Purchase.items))
        .order_by(Purchase.purchased_at.desc())
        .limit(limit)
    ).all()


@router.post("/sales", status_code=201)
def create_sale(payload: SaleCreate, db: DB, _: CurrentUser):
    try:
        sale = Sale(
            number=number("VND"),
            customer_id=payload.customer_id,
            payment_method=payload.payment_method,
            sold_at=payload.sold_at,
            notes=payload.notes,
            total=0,
            total_cost=0,
            net_profit=0,
        )
        db.add(sale)
        db.flush()
        total = Decimal(0)
        total_cost = Decimal(0)
        for line in payload.items:
            product = db.scalar(
                select(Product)
                .options(
                    selectinload(Product.materials).selectinload(ProductMaterial.inventory_item)
                )
                .where(Product.id == line.product_id, Product.active.is_(True))
            )
            if not product:
                raise HTTPException(404, "Produto não encontrado")
            unit_price = line.unit_price if line.unit_price is not None else product.current_price
            unit_cost = product_cost(product)
            db.add(
                SaleItem(
                    sale_id=sale.id,
                    product_id=product.id,
                    quantity=line.quantity,
                    unit_price=unit_price,
                    unit_cost=unit_cost,
                    configuration=line.configuration,
                )
            )
            total += unit_price * line.quantity
            total_cost += unit_cost * line.quantity

            if product.materials:
                for material in product.materials:
                    required = (
                        material.quantity
                        * line.quantity
                        * (Decimal(1) + material.waste_percent / Decimal(100))
                    )
                    item = lock_item(db, material.inventory_item_id)
                    change_stock(
                        db,
                        item,
                        MovementType.OUT,
                        MovementReason.SALE,
                        required,
                        payload.sold_at,
                        item.average_cost,
                        "sale",
                        sale.id,
                    )
            elif product.finished_item_id:
                item = lock_item(db, product.finished_item_id)
                change_stock(
                    db,
                    item,
                    MovementType.OUT,
                    MovementReason.SALE,
                    Decimal(line.quantity),
                    payload.sold_at,
                    item.average_cost,
                    "sale",
                    sale.id,
                )
        sale.total = total.quantize(CENT, ROUND_HALF_UP)
        sale.total_cost = total_cost.quantize(CENT, ROUND_HALF_UP)
        sale.net_profit = sale.total - sale.total_cost
        db.commit()
        db.refresh(sale)
        return sale
    except Exception:
        db.rollback()
        raise


@router.get("/sales")
def sales(
    db: DB,
    _: CurrentUser,
    customer_id: uuid.UUID | None = None,
    product_id: uuid.UUID | None = None,
    limit: int = Query(default=100, ge=1, le=1000),
):
    query = (
        select(Sale)
        .options(selectinload(Sale.customer), selectinload(Sale.items))
        .order_by(Sale.sold_at.desc())
        .limit(limit)
    )
    if customer_id:
        query = query.where(Sale.customer_id == customer_id)
    if product_id:
        query = query.join(SaleItem).where(SaleItem.product_id == product_id)
    return db.scalars(query).unique().all()

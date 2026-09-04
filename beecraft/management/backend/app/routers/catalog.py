import uuid
from decimal import ROUND_HALF_UP, Decimal

from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..deps import DB, CurrentUser
from ..models import InventoryItem, PriceHistory, Product, ProductMaterial, Supplier
from ..schemas import (
    InventoryItemCreate,
    InventoryItemOut,
    PriceSimulation,
    ProductCreate,
    ProductOut,
    SupplierCreate,
    SupplierOut,
)

router = APIRouter(tags=["Catálogo"])
CENT = Decimal("0.01")


def product_cost(product: Product) -> Decimal:
    materials = sum(
        (
            row.inventory_item.average_cost
            * row.quantity
            * (Decimal(1) + row.waste_percent / Decimal(100))
            for row in product.materials
        ),
        Decimal(0),
    )
    return (materials + product.labor_cost + product.packaging_cost).quantize(CENT, ROUND_HALF_UP)


def price_from_margin(cost: Decimal, margin: Decimal) -> Decimal:
    return (cost / (Decimal(1) - margin / Decimal(100))).quantize(CENT, ROUND_HALF_UP)


@router.get("/suppliers", response_model=list[SupplierOut])
def suppliers(db: DB, _: CurrentUser):
    return db.scalars(select(Supplier).order_by(Supplier.name)).all()


@router.post("/suppliers", response_model=SupplierOut, status_code=201)
def create_supplier(payload: SupplierCreate, db: DB, _: CurrentUser):
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("/inventory", response_model=list[InventoryItemOut])
def inventory(db: DB, _: CurrentUser, low_stock: bool = False):
    query = select(InventoryItem).order_by(InventoryItem.name)
    if low_stock:
        query = query.where(InventoryItem.stock_quantity <= InventoryItem.minimum_stock)
    return db.scalars(query).all()


@router.post("/inventory", response_model=InventoryItemOut, status_code=201)
def create_inventory(payload: InventoryItemCreate, db: DB, _: CurrentUser):
    item = InventoryItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/products", response_model=list[ProductOut])
def products(db: DB, _: CurrentUser):
    return db.scalars(select(Product).order_by(Product.name)).all()


def load_product(db: DB, product_id: uuid.UUID) -> Product:
    product = db.scalar(
        select(Product)
        .options(selectinload(Product.materials).selectinload(ProductMaterial.inventory_item))
        .where(Product.id == product_id)
    )
    if not product:
        raise HTTPException(404, "Produto não encontrado")
    return product


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(payload: ProductCreate, db: DB, _: CurrentUser):
    product = Product(**payload.model_dump(exclude={"materials"}))
    product.materials = [ProductMaterial(**row.model_dump()) for row in payload.materials]
    db.add(product)
    db.flush()
    product = load_product(db, product.id)
    cost = product_cost(product)
    product.current_price = price_from_margin(cost, product.desired_margin)
    db.add(
        PriceHistory(
            product_id=product.id,
            cost=cost,
            margin_percent=product.desired_margin,
            price=product.current_price,
        )
    )
    db.commit()
    db.refresh(product)
    return product


@router.get("/products/{product_id}/cost")
def get_product_cost(product_id: uuid.UUID, db: DB, _: CurrentUser):
    product = load_product(db, product_id)
    cost = product_cost(product)
    return {
        "product_id": product.id,
        "material_cost": cost - product.labor_cost - product.packaging_cost,
        "labor_cost": product.labor_cost,
        "packaging_cost": product.packaging_cost,
        "total_cost": cost,
        "margin_percent": product.desired_margin,
        "price": product.current_price,
    }


@router.post("/products/{product_id}/simulate-price")
def simulate_price(product_id: uuid.UUID, payload: PriceSimulation, db: DB, _: CurrentUser):
    product = load_product(db, product_id)
    cost = product_cost(product) + payload.extra_cost
    return {
        "cost": cost,
        "margin_percent": payload.margin_percent,
        "price": price_from_margin(cost, payload.margin_percent),
    }


@router.post("/products/{product_id}/apply-price")
def apply_price(product_id: uuid.UUID, payload: PriceSimulation, db: DB, _: CurrentUser):
    product = load_product(db, product_id)
    cost = product_cost(product) + payload.extra_cost
    product.desired_margin = payload.margin_percent
    product.current_price = price_from_margin(cost, payload.margin_percent)
    db.add(
        PriceHistory(
            product_id=product.id,
            cost=cost,
            margin_percent=payload.margin_percent,
            price=product.current_price,
        )
    )
    db.commit()
    return {
        "cost": cost,
        "margin_percent": product.desired_margin,
        "price": product.current_price,
    }


@router.get("/products/{product_id}/price-history")
def price_history(product_id: uuid.UUID, db: DB, _: CurrentUser):
    return db.scalars(
        select(PriceHistory)
        .where(PriceHistory.product_id == product_id)
        .order_by(PriceHistory.changed_at.desc())
    ).all()

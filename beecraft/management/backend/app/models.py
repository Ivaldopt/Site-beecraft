import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class UserRole(str, enum.Enum):
    OWNER = "OWNER"
    STAFF = "STAFF"


class CustomerSegment(str, enum.Enum):
    NEW = "NEW"
    RECURRING = "RECURRING"
    VIP = "VIP"
    INACTIVE = "INACTIVE"


class ItemType(str, enum.Enum):
    RAW_MATERIAL = "RAW_MATERIAL"
    FINISHED_PRODUCT = "FINISHED_PRODUCT"


class MovementType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"


class MovementReason(str, enum.Enum):
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    LOSS = "LOSS"
    INTERNAL_USE = "INTERNAL_USE"
    ADJUSTMENT = "ADJUSTMENT"
    PRODUCTION = "PRODUCTION"


class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    CARD = "CARD"
    TRANSFER = "TRANSFER"
    MBWAY = "MBWAY"
    OTHER = "OTHER"


class CatalogEventType(str, enum.Enum):
    PAGE_VIEW = "PAGE_VIEW"
    PRODUCT_VIEW = "PRODUCT_VIEW"
    ADD_TO_CART = "ADD_TO_CART"
    WHATSAPP_CLICK = "WHATSAPP_CLICK"


class BusinessCostType(str, enum.Enum):
    FIXED = "FIXED"
    VARIABLE = "VARIABLE"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STAFF)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Customer(TimestampMixin, Base):
    __tablename__ = "customers"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), index=True)
    email: Mapped[str | None] = mapped_column(String(254), unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    social_media: Mapped[dict] = mapped_column(JSONB, default=dict)
    segment: Mapped[CustomerSegment] = mapped_column(
        Enum(CustomerSegment), default=CustomerSegment.NEW
    )
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    sales: Mapped[list["Sale"]] = relationship(back_populates="customer")
    notes: Mapped[list["CustomerNote"]] = relationship(
        back_populates="customer", cascade="all, delete-orphan"
    )
    reminders: Mapped[list["Reminder"]] = relationship(
        back_populates="customer", cascade="all, delete-orphan"
    )


class CustomerNote(Base):
    __tablename__ = "customer_notes"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    customer: Mapped[Customer] = relationship(back_populates="notes")


class Reminder(TimestampMixin, Base):
    __tablename__ = "reminders"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(160))
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    customer: Mapped[Customer] = relationship(back_populates="reminders")


class Supplier(TimestampMixin, Base):
    __tablename__ = "suppliers"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), index=True)
    contact_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    purchases: Mapped[list["Purchase"]] = relationship(back_populates="supplier")


class InventoryItem(TimestampMixin, Base):
    __tablename__ = "inventory_items"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(140), index=True)
    item_type: Mapped[ItemType] = mapped_column(Enum(ItemType))
    unit: Mapped[str] = mapped_column(String(30))
    stock_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0)
    minimum_stock: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0)
    average_cost: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    movements: Mapped[list["StockMovement"]] = relationship(back_populates="item")


class Product(TimestampMixin, Base):
    __tablename__ = "management_products"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(140), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    variations: Mapped[dict] = mapped_column(JSONB, default=dict)
    labor_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    packaging_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    desired_margin: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=30)
    current_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    finished_item_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("inventory_items.id"), nullable=True
    )
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    materials: Mapped[list["ProductMaterial"]] = relationship(cascade="all, delete-orphan")
    price_history: Mapped[list["PriceHistory"]] = relationship(cascade="all, delete-orphan")


class ProductMaterial(Base):
    __tablename__ = "product_materials"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("management_products.id", ondelete="CASCADE"), index=True
    )
    inventory_item_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("inventory_items.id"), index=True
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4))
    waste_percent: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=0)
    inventory_item: Mapped[InventoryItem] = relationship()


class PriceHistory(Base):
    __tablename__ = "price_history"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("management_products.id", ondelete="CASCADE"), index=True
    )
    cost: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    margin_percent: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Sale(TimestampMixin, Base):
    __tablename__ = "sales"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("customers.id"), nullable=True, index=True
    )
    payment_method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod))
    sold_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    net_profit: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    production_status: Mapped[str] = mapped_column(String(30), default="OPEN", index=True)
    production_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    customer: Mapped[Customer | None] = relationship(back_populates="sales")
    items: Mapped[list["SaleItem"]] = relationship(
        back_populates="sale", cascade="all, delete-orphan"
    )


class SaleItem(Base):
    __tablename__ = "sale_items"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sales.id", ondelete="CASCADE"), index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("management_products.id"), index=True)
    quantity: Mapped[int] = mapped_column()
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    configuration: Mapped[dict] = mapped_column(JSONB, default=dict)
    sale: Mapped[Sale] = relationship(back_populates="items")
    product: Mapped[Product] = relationship()


class CatalogEvent(Base):
    __tablename__ = "catalog_events"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type: Mapped[CatalogEventType] = mapped_column(Enum(CatalogEventType), index=True)
    visitor_id: Mapped[str] = mapped_column(String(64), index=True)
    product_slug: Mapped[str | None] = mapped_column(String(180), nullable=True, index=True)
    path: Mapped[str | None] = mapped_column(String(300), nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class CustomsDeclaration(Base):
    __tablename__ = "customs_declarations"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    document_type: Mapped[str] = mapped_column(String(30))
    recipient_name: Mapped[str | None] = mapped_column(String(180), nullable=True)
    recipient_country: Mapped[str | None] = mapped_column(String(3), nullable=True)
    total_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    created_by: Mapped[User] = relationship()
    printed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BusinessCost(TimestampMixin, Base):
    __tablename__ = "business_costs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160), index=True)
    cost_type: Mapped[BusinessCostType] = mapped_column(Enum(BusinessCostType), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    reference_month: Mapped[date] = mapped_column(Date, index=True)
    due_day: Mapped[int | None] = mapped_column(nullable=True)
    recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    paid: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    created_by: Mapped[User] = relationship()


class Purchase(TimestampMixin, Base):
    __tablename__ = "purchases"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    supplier_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("suppliers.id"), index=True)
    purchased_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    supplier: Mapped[Supplier] = relationship(back_populates="purchases")
    items: Mapped[list["PurchaseItem"]] = relationship(
        back_populates="purchase", cascade="all, delete-orphan"
    )


class PurchaseItem(Base):
    __tablename__ = "purchase_items"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    purchase_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("purchases.id", ondelete="CASCADE"), index=True
    )
    inventory_item_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("inventory_items.id"), index=True
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4))
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(14, 4))
    purchase: Mapped[Purchase] = relationship(back_populates="items")
    inventory_item: Mapped[InventoryItem] = relationship()


class StockMovement(Base):
    __tablename__ = "stock_movements"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_item_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("inventory_items.id"), index=True
    )
    movement_type: Mapped[MovementType] = mapped_column(Enum(MovementType))
    reason: Mapped[MovementReason] = mapped_column(Enum(MovementReason))
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4))
    unit_cost: Mapped[Decimal | None] = mapped_column(Numeric(14, 4), nullable=True)
    reference_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    reference_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    item: Mapped[InventoryItem] = relationship(back_populates="movements")

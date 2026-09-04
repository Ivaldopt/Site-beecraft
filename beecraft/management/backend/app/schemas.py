import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from .models import CustomerSegment, ItemType, MovementReason, MovementType, PaymentMethod, UserRole


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class Login(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserCreate(Login):
    name: str = Field(min_length=2, max_length=100)
    role: UserRole = UserRole.STAFF


class UserOut(ORMModel):
    id: uuid.UUID
    name: str
    email: str
    role: UserRole
    active: bool


class CredentialsUpdate(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    email: EmailStr | None = None
    new_password: str | None = Field(default=None, min_length=10, max_length=128)

    @model_validator(mode="after")
    def has_a_change(self):
        if self.email is None and self.new_password is None:
            raise ValueError("Indique o novo email ou a nova senha")
        return self


class CustomerBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=500)
    social_media: dict = Field(default_factory=dict)
    segment: CustomerSegment = CustomerSegment.NEW
    birthday: date | None = None
    active: bool = True


class CustomerCreate(CustomerBase):
    pass


class CustomerOut(CustomerBase, ORMModel):
    id: uuid.UUID
    created_at: datetime


class NoteCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class ReminderCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    due_at: datetime


class SupplierCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    contact_name: str | None = Field(default=None, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=2000)
    active: bool = True


class SupplierOut(SupplierCreate, ORMModel):
    id: uuid.UUID


class InventoryItemCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=60)
    name: str = Field(min_length=2, max_length=140)
    item_type: ItemType
    unit: str = Field(min_length=1, max_length=30)
    minimum_stock: Decimal = Field(default=0, ge=0)
    average_cost: Decimal = Field(default=0, ge=0)


class InventoryItemOut(InventoryItemCreate, ORMModel):
    id: uuid.UUID
    stock_quantity: Decimal
    active: bool


class StockMovementCreate(BaseModel):
    inventory_item_id: uuid.UUID
    movement_type: MovementType
    reason: MovementReason
    quantity: Decimal = Field(gt=0)
    unit_cost: Decimal | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=1000)
    occurred_at: datetime = Field(default_factory=datetime.now)


class MaterialInput(BaseModel):
    inventory_item_id: uuid.UUID
    quantity: Decimal = Field(gt=0)
    waste_percent: Decimal = Field(default=0, ge=0, le=100)


class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=60)
    name: str = Field(min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=2000)
    variations: dict = Field(default_factory=dict)
    labor_cost: Decimal = Field(default=0, ge=0)
    packaging_cost: Decimal = Field(default=0, ge=0)
    desired_margin: Decimal = Field(default=30, ge=0, lt=100)
    finished_item_id: uuid.UUID | None = None
    materials: list[MaterialInput] = Field(default_factory=list, max_length=100)


class ProductOut(ORMModel):
    id: uuid.UUID
    sku: str
    name: str
    description: str | None
    variations: dict
    labor_cost: Decimal
    packaging_cost: Decimal
    desired_margin: Decimal
    current_price: Decimal
    active: bool


class PriceSimulation(BaseModel):
    margin_percent: Decimal = Field(ge=0, lt=100)
    extra_cost: Decimal = Field(default=0, ge=0)


class SaleLineCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(gt=0, le=1000)
    unit_price: Decimal | None = Field(default=None, ge=0)
    configuration: dict = Field(default_factory=dict)


class SaleCreate(BaseModel):
    customer_id: uuid.UUID | None = None
    payment_method: PaymentMethod
    sold_at: datetime = Field(default_factory=datetime.now)
    notes: str | None = Field(default=None, max_length=2000)
    items: list[SaleLineCreate] = Field(min_length=1, max_length=100)


class PurchaseLineCreate(BaseModel):
    inventory_item_id: uuid.UUID
    quantity: Decimal = Field(gt=0)
    unit_cost: Decimal = Field(ge=0)


class PurchaseCreate(BaseModel):
    supplier_id: uuid.UUID
    purchased_at: datetime = Field(default_factory=datetime.now)
    notes: str | None = Field(default=None, max_length=2000)
    items: list[PurchaseLineCreate] = Field(min_length=1, max_length=100)

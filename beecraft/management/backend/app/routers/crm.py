import uuid

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from ..deps import DB, CurrentUser
from ..models import Customer, CustomerNote, Reminder, Sale
from ..schemas import CustomerCreate, CustomerOut, NoteCreate, ReminderCreate

router = APIRouter(prefix="/customers", tags=["CRM"])


@router.get("", response_model=list[CustomerOut])
def list_customers(
    db: DB, _: CurrentUser, search: str | None = Query(default=None, max_length=100)
):
    query = select(Customer).order_by(Customer.name)
    if search:
        term = f"%{search}%"
        query = query.where(
            or_(Customer.name.ilike(term), Customer.email.ilike(term), Customer.phone.ilike(term))
        )
    return db.scalars(query).all()


@router.post("", response_model=CustomerOut, status_code=201)
def create_customer(payload: CustomerCreate, db: DB, _: CurrentUser):
    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}")
def customer_detail(customer_id: uuid.UUID, db: DB, _: CurrentUser):
    customer = db.scalar(
        select(Customer)
        .options(selectinload(Customer.notes), selectinload(Customer.reminders))
        .where(Customer.id == customer_id)
    )
    if not customer:
        raise HTTPException(404, "Cliente não encontrado")
    sales = (
        db.execute(
            select(Sale.id, Sale.number, Sale.sold_at, Sale.total, Sale.net_profit)
            .where(Sale.customer_id == customer_id)
            .order_by(Sale.sold_at.desc())
        )
        .mappings()
        .all()
    )
    lifetime = db.scalar(
        select(func.coalesce(func.sum(Sale.total), 0)).where(Sale.customer_id == customer_id)
    )
    return {
        "customer": CustomerOut.model_validate(customer),
        "notes": customer.notes,
        "reminders": customer.reminders,
        "sales": sales,
        "lifetime_value": lifetime,
    }


@router.post("/{customer_id}/notes", status_code=201)
def add_note(customer_id: uuid.UUID, payload: NoteCreate, db: DB, _: CurrentUser):
    if not db.get(Customer, customer_id):
        raise HTTPException(404, "Cliente não encontrado")
    note = CustomerNote(customer_id=customer_id, text=payload.text.strip())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.post("/{customer_id}/reminders", status_code=201)
def add_reminder(customer_id: uuid.UUID, payload: ReminderCreate, db: DB, _: CurrentUser):
    if not db.get(Customer, customer_id):
        raise HTTPException(404, "Cliente não encontrado")
    reminder = Reminder(customer_id=customer_id, **payload.model_dump())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder

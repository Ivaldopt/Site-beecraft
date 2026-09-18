import uuid
from datetime import date
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from ..deps import CurrentUser, DB
from ..models import BusinessCost, BusinessCostType

router = APIRouter(prefix="/costs", tags=["Custos fixos e variáveis"])


class CostCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    cost_type: Literal["FIXED", "VARIABLE"]
    category: str = Field(min_length=2, max_length=80)
    amount: Decimal = Field(gt=0)
    reference_month: date
    due_day: int | None = Field(default=None, ge=1, le=31)
    recurring: bool = False
    paid: bool = False
    notes: str | None = Field(default=None, max_length=1000)


def row_data(row: BusinessCost):
    return {"id": row.id, "name": row.name, "cost_type": row.cost_type, "category": row.category, "amount": row.amount, "reference_month": row.reference_month, "due_day": row.due_day, "recurring": row.recurring, "paid": row.paid, "notes": row.notes, "created_by": {"name": row.created_by.name, "email": row.created_by.email}}


@router.get("")
def list_costs(db: DB, _: CurrentUser, month: date):
    month_start = month.replace(day=1)
    rows = db.scalars(select(BusinessCost).where(BusinessCost.reference_month == month_start).order_by(BusinessCost.cost_type, BusinessCost.name)).all()
    fixed = sum((row.amount for row in rows if row.cost_type == BusinessCostType.FIXED), Decimal(0))
    variable = sum((row.amount for row in rows if row.cost_type == BusinessCostType.VARIABLE), Decimal(0))
    pending = sum((row.amount for row in rows if not row.paid), Decimal(0))
    return {"items": [row_data(row) for row in rows], "summary": {"fixed": fixed, "variable": variable, "total": fixed + variable, "pending": pending}}


@router.post("", status_code=201)
def create_cost(payload: CostCreate, db: DB, user: CurrentUser):
    data = payload.model_dump(); data["reference_month"] = data["reference_month"].replace(day=1)
    row = BusinessCost(**data, created_by_id=user.id); db.add(row); db.commit(); db.refresh(row)
    return row_data(row)


@router.patch("/{cost_id}")
def update_cost(cost_id: uuid.UUID, payload: CostCreate, db: DB, _: CurrentUser):
    row = db.get(BusinessCost, cost_id)
    if not row: raise HTTPException(status_code=404, detail="Custo não encontrado")
    for key, value in payload.model_dump().items(): setattr(row, key, value.replace(day=1) if key == "reference_month" else value)
    db.commit(); db.refresh(row); return row_data(row)


@router.delete("/{cost_id}", status_code=204)
def delete_cost(cost_id: uuid.UUID, db: DB, _: CurrentUser):
    row = db.get(BusinessCost, cost_id)
    if not row: raise HTTPException(status_code=404, detail="Custo não encontrado")
    db.delete(row); db.commit()

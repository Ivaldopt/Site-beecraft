from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select

from ..deps import CurrentUser, DB
from ..models import CustomsDeclaration

router = APIRouter(prefix="/customs-declarations", tags=["Declarações aduaneiras"])


class DeclarationCreate(BaseModel):
    document_type: str = Field(max_length=30)
    recipient_name: str | None = Field(default=None, max_length=180)
    recipient_country: str | None = Field(default=None, max_length=3)
    total_value: Decimal = Field(default=0, ge=0)
    payload: dict


def serialize(row: CustomsDeclaration):
    return {
        "id": row.id,
        "number": row.number,
        "document_type": row.document_type,
        "recipient_name": row.recipient_name,
        "recipient_country": row.recipient_country,
        "total_value": row.total_value,
        "printed_at": row.printed_at,
        "created_by": {"name": row.created_by.name, "email": row.created_by.email},
    }


@router.post("")
def create_declaration(payload: DeclarationCreate, db: DB, user: CurrentUser):
    sequence = db.scalar(select(func.nextval("customs_declaration_number_seq")))
    number = f"BC-{datetime.now().year}-{sequence:06d}"
    data = payload.model_dump()
    data["payload"] = {**data["payload"], "generated_number": number, "issued_by": user.email}
    row = CustomsDeclaration(number=number, created_by_id=user.id, **data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return serialize(row)


@router.get("")
def list_declarations(db: DB, _: CurrentUser):
    rows = db.scalars(select(CustomsDeclaration).order_by(desc(CustomsDeclaration.printed_at)).limit(50)).all()
    return [serialize(row) for row in rows]

from contextlib import asynccontextmanager

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from .config import get_settings
from .database import SessionLocal
from .models import User, UserRole
from .routers import auth, catalog, costs, crm, customs, dashboard, metrics, reports, transactions, store_catalog
from .security import hash_password

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    command.upgrade(Config("alembic.ini"), "head")
    if settings.bootstrap_owner_email and settings.bootstrap_owner_password:
        with SessionLocal() as db:
            email = settings.bootstrap_owner_email.lower()
            if not db.scalar(select(User.id).where(User.email == email)):
                db.add(
                    User(
                        name="Proprietário BeeCraft",
                        email=email,
                        password_hash=hash_password(settings.bootstrap_owner_password),
                        role=UserRole.OWNER,
                    )
                )
                db.commit()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Gestão de vendas, compras, stock, preços e CRM da BeeCraft.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

for api_router in (
    auth.router,
    dashboard.router,
    catalog.router,
    crm.router,
    transactions.router,
    reports.router,
    store_catalog.router,
    metrics.router,
    customs.router,
    costs.router,
):
    app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["Sistema"])
def health():
    return {"status": "ok"}

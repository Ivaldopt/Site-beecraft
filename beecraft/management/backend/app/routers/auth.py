from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from ..deps import DB, CurrentUser, Owner
from ..models import User
from ..schemas import CredentialsUpdate, Token, UserCreate, UserOut
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=Token)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DB) -> Token:
    user = db.scalar(select(User).where(User.email == form.username.lower()))
    if not user or not user.active or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou senha incorretos"
        )
    return Token(access_token=create_access_token(str(user.id), user.role.value))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user


@router.patch("/me/credentials", response_model=UserOut)
def update_credentials(payload: CredentialsUpdate, db: DB, user: CurrentUser) -> User:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")

    if payload.email is not None:
        email = payload.email.lower()
        existing = db.scalar(select(User.id).where(User.email == email, User.id != user.id))
        if existing:
            raise HTTPException(status_code=409, detail="Email já registado")
        user.email = email

    if payload.new_password is not None:
        if verify_password(payload.new_password, user.password_hash):
            raise HTTPException(status_code=400, detail="A nova senha deve ser diferente da atual")
        user.password_hash = hash_password(payload.new_password)

    db.commit()
    db.refresh(user)
    return user


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: DB, _: Owner) -> User:
    if db.scalar(select(User.id).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="Email já registado")
    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

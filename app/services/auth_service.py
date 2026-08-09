from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..security import create_access_token, create_refresh_token, hash_password, verify_password


def register(db: Session, data: schemas.RegisterRequest) -> schemas.AuthResponse:
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"E-mail já cadastrado: {data.email}",
        )

    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=models.Role.CLIENT,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _build_auth_response(user)


def login(db: Session, data: schemas.LoginRequest) -> schemas.AuthResponse:
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    return _build_auth_response(user)


def _build_auth_response(user: models.User) -> schemas.AuthResponse:
    return schemas.AuthResponse(
        access_token=create_access_token(user.id, user.role.value),
        refresh_token=create_refresh_token(user.id, user.role.value),
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.value,
    )

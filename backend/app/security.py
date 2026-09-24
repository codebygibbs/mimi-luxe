
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import os

import bcrypt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Admin, Customer

import hashlib
import secrets

load_dotenv()


def create_password_reset_value():
    return secrets.token_urlsafe(48)

def hash_password_reset_value(token: str):
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()



def create_admin_password_reset_value():
    return secrets.token_urlsafe(32)


def hash_admin_password_reset_value(token: str):
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


# ============================================================
# SECURITY CONFIGURATION
# ============================================================

FRONTEND_BASE_URL = os.getenv(
    "FRONTEND_BASE_URL"
)

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY is not configured. "
        "Set a strong SECRET_KEY in the environment."
    )

if len(SECRET_KEY) < 32:
    raise RuntimeError(
        "SECRET_KEY must contain at least 32 characters."
    )


ALGORITHM = os.getenv("ALGORITHM", "HS256")

if ALGORITHM != "HS256":
    raise RuntimeError(
        "Unsupported JWT algorithm. Mimi Luxe currently requires HS256."
    )


try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv(
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            "60"
        )
    )
except ValueError:
    raise RuntimeError(
        "ACCESS_TOKEN_EXPIRE_MINUTES must be a valid integer."
    )


if ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
    raise RuntimeError(
        "ACCESS_TOKEN_EXPIRE_MINUTES must be greater than zero."
    )


# ============================================================
# JWT TOKEN TYPES
# ============================================================

ADMIN_TOKEN_TYPE = "admin"
CUSTOMER_TOKEN_TYPE = "customer"

PASSWORD_RESET_PURPOSE = "password_reset"
ADMIN_PASSWORD_RESET_PURPOSE = "admin_password_reset"


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/admins/login"
)


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(password: str):
    if not password:
        raise ValueError(
            "Password cannot be empty."
        )

    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    )

    return hashed_password.decode("utf-8")


# ============================================================
# PASSWORD VERIFICATION
# ============================================================

def verify_password(
    plain_password: str,
    hashed_password: str
):
    if not plain_password or not hashed_password:
        return False

    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


# ============================================================
# CREATE ADMIN ACCESS TOKEN
# ============================================================

def create_access_token(admin_email: str):

    now = datetime.now(timezone.utc)

    expire = (
        now
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": admin_email,
        "type": ADMIN_TOKEN_TYPE,
        "iat": now,
        "jti": str(uuid4()),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ============================================================
# VERIFY ADMIN TOKEN
# ============================================================

def verify_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        email = payload.get("sub")
        token_type = payload.get("type")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin token",
            )

        if token_type != ADMIN_TOKEN_TYPE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin token type",
            )

        return email

    except HTTPException:
        raise

    except JWTError as error:
        print("Mimi Luxe JWT verification error:", repr(error))

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin token",
        )

# ============================================================
# CURRENT ADMIN
# ============================================================

def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    email = verify_token(token)

    admin = (
        db.query(Admin)
        .filter(Admin.email == email)
        .first()
    )

    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin authentication"
        )

    return admin


# ============================================================
# CREATE CUSTOMER ACCESS TOKEN
# ============================================================

def customer_create_access_token(
    customer_email: str
):

    now = datetime.now(timezone.utc)

    expire = (
        now
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": customer_email,
        "type": CUSTOMER_TOKEN_TYPE,
        "iat": now,
        "jti": str(uuid4()),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ============================================================
# VERIFY CUSTOMER TOKEN
# ============================================================

def verify_customer_token(token: str):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")
        token_type = payload.get("type")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid customer token"
            )

        if token_type != CUSTOMER_TOKEN_TYPE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid customer token"
            )

        return email

    except HTTPException:
        raise

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired customer token"
        )


# ============================================================
# CURRENT CUSTOMER
# ============================================================

def get_current_customer(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    email = verify_customer_token(token)

    customer = (
        db.query(Customer)
        .filter(Customer.email == email)
        .first()
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid customer authentication"
        )

    return customer


# ============================================================
# PASSWORD RESET TOKEN
# ============================================================

def create_password_reset_token(email: str):

    now = datetime.now(timezone.utc)

    expire = (
        now
        + timedelta(minutes=30)
    )

    payload = {
        "sub": email,
        "purpose": PASSWORD_RESET_PURPOSE,
        "iat": now,
        "jti": str(uuid4()),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ============================================================
# VERIFY CUSTOMER PASSWORD RESET TOKEN
# ============================================================

def verify_password_reset_token(token: str):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        if payload.get("purpose") != PASSWORD_RESET_PURPOSE:
            return None

        return payload.get("sub")

    except JWTError:
        return None


# ============================================================
# ADMIN PASSWORD RESET TOKEN
# ============================================================

def create_admin_password_reset_token(email: str):

    now = datetime.now(timezone.utc)

    expire = (
        now
        + timedelta(minutes=30)
    )

    payload = {
        "sub": email,
        "purpose": ADMIN_PASSWORD_RESET_PURPOSE,
        "iat": now,
        "jti": str(uuid4()),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ============================================================
# VERIFY ADMIN PASSWORD RESET TOKEN
# ============================================================

def verify_admin_password_reset_token(token: str):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        if (
            payload.get("purpose")
            != ADMIN_PASSWORD_RESET_PURPOSE
        ):
            return None

        return payload.get("sub")

    except JWTError:
        return None



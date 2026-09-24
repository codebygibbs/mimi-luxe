import hashlib
import secrets
import os

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request

from backend.app.limiter import limiter

from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.customer import Customer

from backend.app.models.password_reset_token import PasswordResetToken
from backend.app.schemas.customer import ForgotPasswordRequest, ResetPasswordRequest

from backend.app.schemas.customer import CustomerCreate, CustomerLogin, CustomerResponse
from backend.app.security import verify_password_reset_token, verify_customer_token, hash_password, verify_password, customer_create_access_token, get_current_admin, get_current_customer

from backend.app.security import create_password_reset_token, hash_password_reset_value, create_password_reset_value

from datetime import timezone

router = APIRouter(
    prefix="/customer",
    tags=["Customers"]
)

FRONTEND_BASE_URL = os.getenv(
    "FRONTEND_BASE_URL"
)

@router.post("/register")
def register_customer(customer: CustomerCreate, db: Session = Depends(get_db)):

    existing_customer = (
        db.query(Customer).filter(Customer.email == customer.email).first()
    )

    if existing_customer:
            raise HTTPException(
                status_code=400,
                detail="Customer with this email already exists"
            )
    
    new_customer = Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone=customer.phone,
        hashed_password=hash_password(customer.password)
    )
    
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    
    return {
        "id": new_customer.id,
        "full_name": new_customer.full_name,
        "email": new_customer.email
    }

# ===================================================
# ===================================================
@router.post("/login")
@limiter.limit("5/minute")
def login_customer(customer: CustomerLogin, request: Request, db: Session = Depends(get_db)):

    db_customer = db.query(Customer).filter(Customer.email == customer.email).first()

    if (not db_customer or not verify_password(customer.password, db_customer.hashed_password)):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = customer_create_access_token(db_customer.email)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=CustomerResponse)
def get_current_customer_profile(current_customer: Customer = Depends(get_current_customer)):
    
    return current_customer



# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    reset_request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    email = reset_request.email.lower().strip()

    customer = db.query(Customer).filter(
        Customer.email == email
    ).first()

    # Always return the same message
    # so the endpoint does not reveal whether an account exists.
    message = {
        "message": "If an account exists for this email, a password reset link has been created."
    }

    if not customer:
        return message

    reset_token = create_password_reset_value()

    reset_token_hash = hash_password_reset_value(reset_token)

    reset_record = PasswordResetToken(
        customer_id=customer.id,
        token_hash=reset_token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
    )

    db.add(reset_record)
    db.commit()

    frontend_base_url = os.getenv(
        "FRONTEND_BASE_URL",
        "http://127.0.0.1:5500"
    ).rstrip("/")

    reset_link = (
        f"{frontend_base_url}/frontend/customer/reset-password.html"
        f"?token={reset_token}"
    )

    # DEVELOPMENT ONLY
    print("\n========================================")
    print("CUSTOMER PASSWORD RESET LINK")
    print(reset_link)
    print("========================================\n")

    return message


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post("/reset-password")
def reset_password(
    reset_request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    token_hash = hash_password_reset_value(
        reset_request.token
    )

    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > datetime.now(timezone.utc)
    ).first()

    if not reset_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset link"
        )

    customer = db.query(Customer).filter(
        Customer.id == reset_record.customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Account not found."
        )

    customer.hashed_password = hash_password(
        reset_request.new_password
    )

    reset_record.used_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "message": "Password reset successfully."
    }

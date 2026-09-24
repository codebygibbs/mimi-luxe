from fastapi import APIRouter, Depends, HTTPException, Request

from backend.app.limiter import limiter

from sqlalchemy.orm import Session

from backend.app.models.admin_password_reset_token import AdminPasswordResetToken 
from backend.app.database import get_db
from backend.app.models.admin import Admin 
from backend.app.schemas.admin import AdminResponse, AdminCreate, AdminLogin, Token
from .order import Order
from .customer import Customer

from backend.app.models.password_reset_token import PasswordResetToken
from backend.app.schemas.admin import AdminForgotPasswordRequest, AdminResetPasswordRequest
from backend.app.security import create_admin_password_reset_token, verify_admin_password_reset_token, verify_customer_token

from backend.app.security import create_admin_password_reset_value, hash_admin_password_reset_value, hash_password, verify_password, create_access_token, get_current_admin, create_password_reset_value, hash_password_reset_value

from datetime import datetime, timezone, timedelta

import os


router = APIRouter(
    prefix="/admins",
    tags=["Admins"]
)

FRONTEND_BASE_URL = os.getenv(
    "FRONTEND_BASE_URL"
)

ENVIRONMENT = os.getenv(
    "ENVIRONMENT"
)

# create admin
@router.post("/register", response_model=AdminResponse)
def register(admin: AdminCreate, db: Session = Depends(get_db)):

    environment = os.getenv("ENVIRONMENT", "development")

    if environment == "production":
        raise HTTPException(
            status_code=403,
            detail="Admin registration is disabled"
        )
    
    existing_admin = (
        db.query(Admin)
        .filter(Admin.email == admin.email)
        .first()
    )

    if existing_admin:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed = hash_password(admin.password)

    new_admin = Admin(
        full_name=admin.full_name,
        email=admin.email,
        hashed_password=hashed
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return new_admin


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(admin: AdminLogin, request: Request, db: Session = Depends(get_db)):

    db_admin = db.query(Admin).filter(Admin.email == admin.email).first()

    if (not db_admin or not verify_password(
        admin.password, db_admin.hashed_password
        )):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(db_admin.email)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }



@router.get("/customers/count")
def get_customer_count(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    total_customers = db.query(Customer).count()

    return {
        "total_customers": total_customers
    }


@router.get("/orders/{order_id}")
def get_admin_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    order_data = {
        "id": order.id,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "fulfillment_method": order.fulfillment_method,
        "total_amount": order.total_amount,
        "status": order.status,
        "items": []
    }
    
    for item in order.items:
        product = item.product
    
        item_data = {
            "product_id": item.product_id,
            "product_name": product.name if product else "Product",
            "quantity": item.quantity,
            "product_image_url": product.image_url if product else None,
            "unit_price": item.unit_price,
        }
    
        order_data["items"].append(item_data)
    
    return order_data


@router.post("/forgot-password")
@limiter.limit("5/minute")
def admin_forgot_password(
    request: Request,
    reset_request: AdminForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    email = reset_request.email.lower().strip()

    admin = db.query(Admin).filter(
        Admin.email == email
    ).first()

    message = {
        "message": "If an admin account exists for this email, a password reset link has been created."
    }

    if not admin:
        return message

    reset_token = create_admin_password_reset_value()

    reset_token_hash = hash_admin_password_reset_value(reset_token)

    reset_record = AdminPasswordResetToken(
        admin_id=admin.id,
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
        f"{frontend_base_url}/frontend/admin/admin-reset-password.html"
        f"?token={reset_token}"
    )

    # DEVELOPMENT ONLY
    print("\n========================================")
    print("ADMIN PASSWORD RESET LINK")
    print(reset_link)
    print("========================================\n")

    return message




    

# =========================================================
# RESET PASSWORD
# =========================================================

@router.post("/reset-password")
def admin_reset_password(
    reset_request: AdminResetPasswordRequest,
    db: Session = Depends(get_db)
):
    token_hash = hash_admin_password_reset_value(
        reset_request.token
    )

    reset_record = db.query(
        AdminPasswordResetToken
    ).filter(
        AdminPasswordResetToken.token_hash == token_hash,
        AdminPasswordResetToken.used_at.is_(None),
        AdminPasswordResetToken.expires_at > datetime.now(timezone.utc)
    ).first()

    if not reset_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset link"
        )

    admin = db.query(Admin).filter(
        Admin.id == reset_record.admin_id
    ).first()

    if not admin:
        raise HTTPException(
            status_code=404,
            detail="Admin account not found."
        )

    admin.hashed_password = hash_password(
        reset_request.new_password
    )

    reset_record.used_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "message": "Admin password reset successfully."
    }

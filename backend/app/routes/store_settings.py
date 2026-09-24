from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db

from ..models.store_settings import StoreSettings
from ..models.admin import Admin

from backend.app.schemas.store_settings import StoreSettingsResponse, StoreSettingsUpdate 
from ..security import get_current_admin


router = APIRouter(
    prefix="/store-settings",
    tags=["Store Settings"]
)


# =========================================================
# GET STORE SETTINGS
# Admin only
# =========================================================

@router.get(
    "/",
    response_model=StoreSettingsResponse
)
def get_store_settings(
    db: Session = Depends(get_db)
):
    settings = (
        db.query(StoreSettings)
        .filter(StoreSettings.id == 1)
        .first()
    )

    if not settings:
        settings = StoreSettings(
            id=1,
            store_name="Mimi Luxe",
            pickup_address=""
        )

        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


# =========================================================
# UPDATE STORE SETTINGS
# Admin only
# =========================================================

@router.put(
    "/",
    response_model=StoreSettingsResponse
)
def update_store_settings(
    settings_data: StoreSettingsUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    settings = (
        db.query(StoreSettings)
        .filter(StoreSettings.id == 1)
        .first()
    )

    if not settings:
        settings = StoreSettings(id=1)
        db.add(settings)

    settings.store_name = settings_data.store_name.strip()

    settings.pickup_address = (
        settings_data.pickup_address.strip()
    )

    settings.phone = (
        settings_data.phone.strip()
        if settings_data.phone
        else None
    )

    settings.whatsapp = (
        settings_data.whatsapp.strip()
        if settings_data.whatsapp
        else None
    )

    settings.email = (
        settings_data.email.strip()
        if settings_data.email
        else None
    )

    settings.business_hours = (
        settings_data.business_hours.strip()
        if settings_data.business_hours
        else None
    )

    settings.admin_notification_email = (
        settings_data.admin_notification_email.strip()
        if settings_data.admin_notification_email
        else None
    )

    settings.admin_notification_phone = (
        settings_data.admin_notification_phone.strip()
        if settings_data.admin_notification_phone
        else None
    )

    db.commit()
    db.refresh(settings)

    return settings


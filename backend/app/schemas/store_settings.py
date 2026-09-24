from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional

class StoreSettingsResponse(BaseModel):
    id: int
    store_name: str
    pickup_address: str
    phone: str | None = None
    whatsapp: str | None = None
    email: str | None = None
    business_hours: str | None = None
    admin_notification_email: Optional[EmailStr] = None
    admin_notification_phone: Optional[str] = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class StoreSettingsUpdate(BaseModel):
    store_name: str = Field(
        min_length=2,
        max_length=255
    )

    pickup_address: str = Field(
        min_length=2
    )

    phone: str | None = None

    whatsapp: str | None = None

    email: str | None = None

    admin_notification_email: Optional[EmailStr] = None

    admin_notification_phone: Optional[str] = None

    business_hours: str | None = None

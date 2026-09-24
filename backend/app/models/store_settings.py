from sqlalchemy import Column, Integer, String, Text, DateTime, func
from backend.app.database import Base

from datetime import datetime

class StoreSettings(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, default=1)
    store_name = Column(String(255), nullable=False, default="Mimi Luxe")
    pickup_address = Column(Text, nullable=False, default="")
    phone = Column(String(50), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    business_hours = Column(Text, nullable=True)
    admin_notification_email = Column(String(255), nullable=True)
    admin_notification_phone = Column(String(50), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
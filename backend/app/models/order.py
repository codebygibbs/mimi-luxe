from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    fulfillment_method = Column(String, nullable=False)
    delivery_address = Column(String, nullable=True)
    pickup_location = Column(String, nullable=True)
    total_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String, nullable=False, default="pending")
    client_order_id = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


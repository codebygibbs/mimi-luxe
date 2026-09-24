from backend.app.database import Base

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Integer, nullable=False)
    image_url = Column(String, nullable=True)
    stock_quantity = Column(Integer, nullable=False, default=0)
    is_available = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())
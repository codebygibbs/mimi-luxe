from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String(30), nullable=True)
    hashed_password = Column(String, nullable=False)

    password_reset_tokens = relationship(
        "PasswordResetToken",
        back_populates="customer",
        cascade="all, delete-orphan"
    )

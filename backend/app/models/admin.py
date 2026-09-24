from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship

from backend.app.database import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, nullable=False, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    password_reset_tokens = relationship(
        "AdminPasswordResetToken",
        back_populates="admin",
        cascade="all, delete-orphan"
    )
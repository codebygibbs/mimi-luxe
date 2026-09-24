from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from backend.app.database import Base


class AdminPasswordResetToken(Base):
    __tablename__ = "admin_password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)

    admin_id = Column(
        Integer,
        ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    token_hash = Column(
        String,
        unique=True,
        nullable=False
    )

    expires_at = Column(
        DateTime,
        nullable=False
    )

    used_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    admin = relationship(
        "Admin",
        back_populates="password_reset_tokens"
    )

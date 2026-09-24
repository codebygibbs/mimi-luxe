from pydantic import BaseModel, Field

from datetime import datetime

class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    brand: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=50)
    description: str  | None = None
    price: int = Field(gt=0)
    image_url: str  | None = None
    stock_quantity: int = Field(default=0, ge=0)
    is_available: bool = True


class ProductResponse(BaseModel):
    id: int
    name: str
    brand: str
    category: str
    description: str | None
    price: int
    image_url: str  | None 
    stock_quantity: int 
    is_available: bool
    created_at: datetime | None

    class Config:
        from_attribute = True

    
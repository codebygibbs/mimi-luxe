from pydantic import BaseModel, Field
from typing import List
from datetime import datetime


class OrderCreate(BaseModel):
    client_order_id: str | None = None
    customer_name: str = Field(min_length=2, max_length=100)
    customer_email: str = Field(min_length=5, max_length=150)
    fulfillment_method: str

    delivery_address: str | None = None
    pickup_location: str | None = None

    items: List[OrderItemCreate]


class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: str
    fulfillment_method: str
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=50) 

# order-Items validations 

class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)

class OrderItemResponse(BaseModel):
    product_id: int
    quantity: int
    unit_price: int

class CustomerOrderItemResponse(BaseModel):
    product_id: int
    product_name: str
    product_image_url: str | None = None
    quantity: int
    unit_price: float


class CustomerOrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: str
    fulfillment_method: str
    total_amount: float
    status: str
    created_at: datetime
    items: list[CustomerOrderItemResponse]


class CustomerOrderDetailItemResponse(BaseModel):
    product_id: int
    product_name: str
    product_image_url: str | None = None
    quantity: int
    unit_price: float


class CustomerOrderDetailResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: str
    fulfillment_method: str
    total_amount: float
    status: str
    created_at: datetime
    items: list[CustomerOrderDetailItemResponse]

    class Config:
        from_attributes = True
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.product import Product
from backend.app.models.order import Order
from backend.app.models.order_item import OrderItem
from backend.app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate, CustomerOrderDetailItemResponse, CustomerOrderDetailResponse
from backend.app.schemas.order import CustomerOrderItemResponse, CustomerOrderResponse

from ..models.store_settings import StoreSettings
from backend.app.models.customer import Customer
from backend.app.security import get_current_customer, get_current_admin
from typing import List

from ...notification import notify_order_status, notify_admin_new_order, send_new_order_notifications

ALLOWED_ORDER_STATUSES = {
    "pending",
    "confirmed",
    "processing",
    "ready",
    "out_for_delivery",
    "completed",
    "cancelled",
}

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

# get all orders
@router.get("/", response_model=List[CustomerOrderResponse])
def get_orders(
    db: Session = Depends(get_db), current_customer: Customer = Depends(get_current_customer)
    ):
    orders = db.query(Order).filter(Order.customer_id == current_customer.id).order_by(Order.id.desc()).all()
    result = []

    for order in orders:

        order_data = {
            "id": order.id,
            "customer_name": order.customer_name,
            "customer_email": order.customer_email,
            "fulfillment_method": order.fulfillment_method,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at,
            "items": []
        }

        for item in order.items:
            product = item.product

            item_data = {
                "product_id": item.product_id,
                "product_name": product.name if product else "Product",
                "quantity": item.quantity,
                "product_image_url": product.image_url if product else None,
                "unit_price": item.unit_price,
            }
            order_data["items"].append(item_data)
        result.append(order_data)
    return result

# Admin - get all orders
@router.get("/admin/all", response_model=List[OrderResponse])
def get_all_orders_for_admin(
    db: Session = Depends(get_db), current_admin = Depends(get_current_admin)
    ):
    orders = db.query(Order).order_by(Order.id.desc()).all()

    result = []

    for order in orders:
        result.append(
            {
                "id": order.id,
                "customer_name": order.customer_name,
                "customer_email": order.customer_email,
                "fulfillment_method": order.fulfillment_method,
                "total_amount": order.total_amount,
                "status": order.status,
                "created_at": order.created_at,
                "items": order.items,
            }
        )
    return result

# get one order
@router.get("/{order_id}", response_model=CustomerOrderDetailResponse)
def get_order(
    order_id: int,
      db: Session = Depends(get_db),
      current_customer: Customer = Depends(get_current_customer)
              ):

    order = db.query(Order).filter(
        Order.id == order_id, 
        Order.customer_id == current_customer.id
        ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    order_data = {
        "id": order.id,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "fulfillment_method": order.fulfillment_method,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "items": []
    }

    for item in order.items:
        product = item.product

        item_data = {
            "product_id": item.product_id,
            "product_name": product.name if product else "Product",
            "quantity": item.quantity,
            "product_image_url": product.image_url if product else None,
            "unit_price": item.unit_price,
        }

        order_data["items"].append(item_data)

    return order_data

# update order status
@router.patch("/{order_id}/status")
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
    ):

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    customer = (
        db.query(Customer)
        .filter(Customer.id == order.customer_id).first()
    )

    customer_phone = getattr(Customer, "phone", None)

    new_status = data.status.lower()

    if new_status not in ALLOWED_ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid order status. "
                f"Allowed statuses: {', '.join(sorted(ALLOWED_ORDER_STATUSES))}"
            )
        )
    old_status = order.status
    order.status = new_status

    db.commit()
    db.refresh(order)

    # =========================================================
    # CUSTOMER ORDER STATUS NOTIFICATION
    # =========================================================

    if old_status != order.status:
        background_tasks.add_task(
            notify_order_status,
            order_id=order.id,
            customer_email=order.customer_email,
            customer_phone=customer_phone,
            status=order.status,
            fulfillment_method=order.fulfillment_method,
            pickup_location=getattr(
                order,
                "pickup_location",
                None
            )
        )

    return order

# ============================================================
# CREATE ORDER
# ============================================================
@router.post("/", response_model=OrderResponse)
def create_order(
    order: OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    # ============================================================
    # 1. Validate fulfillment method
    # ============================================================
    fulfillment_method = order.fulfillment_method.lower()

    if fulfillment_method not in ["delivery", "pickup"]:
        raise HTTPException(
            status_code=400,
            detail="Fulfillment method must be either delivery or pickup."
        )

    # ============================================================
    # 2. Validate customer information
    # ============================================================
    customer_name = order.customer_name.strip()
    customer_email = str(order.customer_email).strip().lower()

    if not customer_name:
        raise HTTPException(
            status_code=400,
            detail="Customer name is required."
        )

    if not customer_email:
        raise HTTPException(
            status_code=400,
            detail="Customer email is required."
        )

    # ============================================================
    # 3. Validate delivery address
    # ============================================================
    delivery_address = None

    if fulfillment_method == "delivery":
        if (
            not order.delivery_address
            or not order.delivery_address.strip()
        ):
            raise HTTPException(
                status_code=400,
                detail="Delivery address is required for delivery orders."
            )

        delivery_address = order.delivery_address.strip()

    # ============================================================
    # 4. Get admin-controlled pickup location
    # ============================================================
    pickup_location = None

    if fulfillment_method == "pickup":
        store_settings = (
            db.query(StoreSettings)
            .filter(StoreSettings.id == 1)
            .first()
        )

        if (
            not store_settings
            or not store_settings.pickup_address
            or not store_settings.pickup_address.strip()
        ):
            raise HTTPException(
                status_code=400,
                detail="Pickup is currently unavailable."
            )

        pickup_location = store_settings.pickup_address.strip()

    # ============================================================
    # 5. Validate cart
    # ============================================================
    if not order.items:
        raise HTTPException(
            status_code=400,
            detail="Order must contain at least one product."
        )

    # ============================================================
    # 6. Validate idempotency key
    # ============================================================
    client_order_id = None

    if order.client_order_id:
        client_order_id = order.client_order_id.strip()

        if len(client_order_id) > 100:
            raise HTTPException(
                status_code=400,
                detail="Invalid order reference."
            )

    # ============================================================
    # 7. Check whether this order was already created
    # ============================================================
    if client_order_id:
        existing_order = (
            db.query(Order)
            .filter(
                Order.client_order_id == client_order_id,
                Order.customer_id == current_customer.id
            )
            .first()
        )

        if existing_order:
            return existing_order

    # ============================================================
    # 8. Combine duplicate product IDs
    # ============================================================
    requested_quantities = {}

    for item in order.items:

        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Quantity for product {item.product_id} "
                    "must be greater than zero."
                )
            )

        requested_quantities[item.product_id] = (
            requested_quantities.get(item.product_id, 0)
            + item.quantity
        )

    total_amount = 0
    order_items = []
    locked_products = {}

    # ============================================================
    # 9. Lock products and validate stock
    # ============================================================
    try:
        for product_id in sorted(requested_quantities.keys()):

            product = (
                db.query(Product)
                .filter(Product.id == product_id)
                .with_for_update()
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {product_id} not found."
                )

            if not product.is_available:
                raise HTTPException(
                    status_code=400,
                    detail=f"{product.name} is not available."
                )

            quantity = requested_quantities[product_id]

            if product.stock_quantity < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Not enough stock for {product.name}. "
                        f"Only {product.stock_quantity} available."
                    )
                )

            locked_products[product_id] = product

            item_total = product.price * quantity
            total_amount += item_total

            order_items.append(
                OrderItem(
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=product.price
                )
            )

        # ========================================================
        # 10. Create order
        # ========================================================
        new_order = Order(
            customer_id=current_customer.id,
            client_order_id=client_order_id,
            customer_name=customer_name,
            customer_email=customer_email,
            fulfillment_method=fulfillment_method,
            delivery_address=delivery_address,
            pickup_location=pickup_location,
            total_amount=total_amount,
            status="pending"
        )

        db.add(new_order)
        db.flush()

        # ========================================================
        # 11. Attach order items
        # ========================================================
        for order_item in order_items:
            order_item.order_id = new_order.id
            db.add(order_item)

        # ========================================================
        # 12. Reduce locked product stock
        # ========================================================
        for product_id, quantity in requested_quantities.items():

            product = locked_products[product_id]

            product.stock_quantity -= quantity

            if product.stock_quantity == 0:
                product.is_available = False

        # ========================================================
        # 13. Commit transaction
        # ========================================================
        db.commit()
        db.refresh(new_order)

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        print(
            "Mimi Luxe order creation database error:",
            error
        )

        # A unique client_order_id can mean another request
        # created the order at almost exactly the same time.
        if client_order_id:
            existing_order = (
                db.query(Order)
                .filter(
                    Order.client_order_id == client_order_id,
                    Order.customer_id == current_customer.id
                )
                .first()
            )

            if existing_order:
                return existing_order

        raise HTTPException(
            status_code=500,
            detail="Unable to create order. Please try again."
        )

    # ============================================================
    # 14. Load notification settings
    # ============================================================
    store_settings = (
        db.query(StoreSettings)
        .filter(StoreSettings.id == 1)
        .first()
    )

    # ============================================================
    # BACKGROUND NOTIFICATIONS
    # ============================================================
    if store_settings:
        background_tasks.add_task(
            send_new_order_notifications,
            order_id=new_order.id,
            customer_name=new_order.customer_name,
            customer_email=new_order.customer_email,
            customer_phone=getattr(
                current_customer,
                "phone",
                None
            ),
            fulfillment_method=new_order.fulfillment_method,
            delivery_address=getattr(
                new_order,
                "delivery_address",
                None
            ),
            pickup_location=getattr(
                new_order,
                "pickup_location",
                None
            ),
            total_amount=new_order.total_amount,
            status=new_order.status,
            created_at=new_order.created_at,
            admin_email=(
                store_settings.admin_notification_email
            ),
            admin_phone=(
                store_settings.admin_notification_phone
            ),
        )

    return new_order

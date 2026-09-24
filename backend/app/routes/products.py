from fastapi import Depends, HTTPException, APIRouter, Query, Response

from backend.app.database import get_db
from backend.app.models.product import Product
from backend.app.schemas.product import ProductResponse, ProductCreate

from backend.app.security import get_current_admin
from backend.app.models.admin import Admin
from backend.app.models.order_item import OrderItem

from sqlalchemy.orm import Session

from fastapi import UploadFile, File
from pathlib import Path
import shutil
import uuid

from io import BytesIO
from PIL import Image, UnidentifiedImageError

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

# create product
@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
    ):

    new_product = Product(
        name=product.name,
        brand=product.brand,
        category=product.category,
        description=product.description,
        price=product.price,
        image_url=product.image_url,
        stock_quantity=product.stock_quantity,
        is_available=product.stock_quantity > 0
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product

# get all products
@router.get("/", response_model=list[ProductResponse])
def get_products(
    category: str | None = None,
    brand: str | None = None,
    search: str | None = None,
    max_price: int | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=50),
    response: Response = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(
        Product.is_available == True
    )

    if category:
        query = query.filter(
            Product.category == category
        )

    if brand:
        query = query.filter(
            Product.brand == brand
        )

    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%")
        )

    if max_price is not None:
        query = query.filter(
            Product.price <= max_price
        )

    total = query.count()

    if response is not None:
        response.headers["X-Total-Count"] = str(total)

    products = (
        query
        .order_by(Product.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return products

# get one product
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
      db: Session = Depends(get_db)
      ):

    product = db.query(Product).filter(Product.id == product_id).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
    return product

# update products
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int, data: ProductCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
    ):

    product = db.query(Product).filter(
        Product.id == product_id
        ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product.name = data.name
    product.brand = data.brand
    product.category = data.category
    product.description = data.description
    product.price = data.price
    product.image_url = data.image_url
    product.stock_quantity = data.stock_quantity
    product.is_available = data.stock_quantity > 0

    db.commit()
    db.refresh(product)

    return product

# delete product
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    existing_order_item = db.query(OrderItem).filter(
        OrderItem.product_id == product_id
    ).first()

    if existing_order_item:
        raise HTTPException(
            status_code=400,
            detail=(
                "This product cannot be deleted because it is "
                "associated with an existing order. "
                "Set its stock to 0 instead."
            )
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }


UPLOAD_DIR = Path("uploads/products")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

@router.post("/upload-image")
def upload_product_image(
    file: UploadFile = File(...),
    current_admin: Admin = Depends(get_current_admin)
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, WEBP or GIF image."
        )

    extension = ALLOWED_IMAGE_TYPES[file.content_type]

    file.file.seek(0)

    data = file.file.read(MAX_IMAGE_SIZE + 1)

    if len(data) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image file is too large. Maximum size is 5 MB."
        )

    if not data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    try:
        image = Image.open(BytesIO(data))

        image.verify()

    except (
        UnidentifiedImageError,
        OSError,
        SyntaxError
    ):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image."
        )

    file_path = (
        UPLOAD_DIR /
        f"{uuid.uuid4().hex}{extension}"
    )

    with file_path.open("wb") as buffer:
        buffer.write(data)

    return {
        "image_url": f"/uploads/products/{file_path.name}"
    }
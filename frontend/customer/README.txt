MIMI LUXE CUSTOMER FRONTEND — BACKEND ALIGNED

This package is a customer-facing frontend built around the routes and schemas supplied for the Mimi Luxe backend.

BACKEND BASE URL
http://127.0.0.1:8000

ROUTES USED

Customers
POST /customers/register
POST /customers/login

Products
GET /products
GET /products/{product_id}

Orders
GET /orders/                 -> authenticated customer's orders with item details
GET /orders/{order_id}       -> authenticated customer's single order with item details
POST /orders/                -> authenticated checkout/order creation

ORDER PAYLOAD
The checkout sends the exact OrderCreate shape:
{
  "customer_name": "...",
  "customer_email": "...",
  "fulfillment_method": "delivery" | "pickup",
  "delivery_address": "..." | null,
  "pickup_location": "..." | null,
  "items": [
    {"product_id": 1, "quantity": 2}
  ]
}

CUSTOMER ORDER RESPONSE
The order pages consume:
id, customer_name, customer_email, fulfillment_method, total_amount, status, items
and item fields:
product_id, product_name, product_image_url, quantity, unit_price

IMPORTANT
No backend route, schema, database model, status list, or payment endpoint is invented by this frontend.
The cart is stored locally in localStorage and converted into OrderCreate.items at checkout.

AUTH STORAGE
customer_access_token = customer JWT
mimi_luxe_cart       = cart contents
mimi_luxe_language   = selected language

LANGUAGES
The selector provides broad global language coverage, including English, French, Spanish, German, Portuguese, Italian, Arabic, Chinese, Japanese, Korean, Hindi, Turkish, Dutch, Russian, Swahili, Yoruba, Igbo, Hausa, Amharic, Bengali, Indonesian, Malay, Vietnamese, Thai, Polish, Ukrainian, Greek, Hebrew, Persian, Romanian, Czech, Hungarian, Swedish, Norwegian, Danish and Finnish.
The main storefront UI has translated packs for the most important initial markets; languages without a complete pack safely fall back to English instead of showing broken translation keys.

DESIGN / UX UPDATES
- One footer per page. The previous index/footer duplication issue is avoided.
- Footer is pushed naturally to the bottom on short pages.
- Shared navigation and footer are used consistently across customer pages.
- Language selector is available throughout the customer frontend, including login/register.
- Mobile language selector remains visible.
- Mobile navigation closes after a link is selected.
- Index has a single continuous page with hero, featured products, customer service, trust section and one footer.
- A back-to-top control is available on the homepage and footer links provide back-to-top navigation on all pages.
- Hero imagery no longer depends on a missing local JPG asset; it is rendered as a self-contained CSS product visual.
- Product/order item images use backend image_url / product_image_url when supplied and a safe placeholder otherwise.
- Product stock and availability are respected before adding to cart.
- Cart quantities are capped using stock_quantity stored with the cart item.
- Checkout validates login, empty cart, fulfillment selection and required location fields before sending to the backend.
- 401 responses clear the customer token and return the user to login.

FILES
index.html
products.html
product.html
cart.html
checkout.html
login.html
register.html
orders.html
order-details.html
css/customer.css
js/customer-common.js
js/index.js
js/products.js
js/product.js
js/cart.js
js/checkout.js
js/login.js
js/register.js
js/orders.js
js/order-details.js

IF YOUR ROUTER PREFIXES DIFFER
Only the customer router prefix needs to be adjusted in the two authentication calls if your actual FastAPI include_router() prefix is different from /customers. Product and order paths are based directly on the routes supplied.

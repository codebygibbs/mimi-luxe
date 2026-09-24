import os
import smtplib

from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()



# =========================================================
# EMAIL SETTINGS
# =========================================================

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

SMTP_FROM_EMAIL = os.getenv(
    "SMTP_FROM_EMAIL"
)

SMTP_FROM_NAME = os.getenv(
    "SMTP_FROM_NAME",
    "Mimi Luxe"
)


# =========================================================
# SMS SETTINGS
# =========================================================

SMS_ENABLED = os.getenv(
    "SMS_ENABLED",
    "false"
).lower() == "true"

SMS_PROVIDER = os.getenv("SMS_PROVIDER")
SMS_API_KEY = os.getenv("SMS_API_KEY")
SMS_API_SECRET = os.getenv("SMS_API_SECRET")
SMS_FROM = os.getenv("SMS_FROM")


# =========================================================
# EMAIL
# =========================================================

def send_notification_email(
    recipient_email: str,
    subject: str,
    body: str,
):
    if not recipient_email:
        print(
            "Mimi Luxe email notification skipped: "
            "no recipient email."
        )
        return

    if (
        not SMTP_HOST
        or not SMTP_USERNAME
        or not SMTP_PASSWORD
    ):
        print(
            "Mimi Luxe email notification skipped: "
            "SMTP settings are not configured."
        )
        return

    message = EmailMessage()

    message["Subject"] = subject
    message["From"] = (
        f"{SMTP_FROM_NAME} "
        f"<{SMTP_FROM_EMAIL or SMTP_USERNAME}>"
    )
    message["To"] = recipient_email

    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(
            SMTP_USERNAME,
            SMTP_PASSWORD
        )
        server.send_message(message)

    print(
        f"Mimi Luxe email notification sent to "
        f"{recipient_email}"
    )



# =========================================================
# SMS
# =========================================================


def send_notification_sms(
    recipient_phone: str,
    message: str,
):
    if not recipient_phone:
        print(
            "Mimi Luxe SMS notification skipped: "
            "no recipient phone."
        )
        return

    if not SMS_ENABLED:
        print(
            "Mimi Luxe SMS development notification "
            f"-> {recipient_phone}:"
        )
        print(message)
        return

    if not SMS_PROVIDER:
        print(
            "Mimi Luxe SMS notification skipped: "
            "SMS_PROVIDER is not configured."
        )
        return

    if not SMS_API_KEY:
        print(
            "Mimi Luxe SMS notification skipped: "
            "SMS_API_KEY is not configured."
        )
        return

    print(
        f"Mimi Luxe SMS provider '{SMS_PROVIDER}' "
        "is enabled, but its API integration has not "
        "yet been configured."
    )




# =========================================================
# ORDER STATUS MESSAGES
# =========================================================

def get_order_notification(
    status: str,
    order_id,
    fulfillment_method: str | None = None,
    pickup_location: str | None = None
):
    """
    Return the customer-facing notification title and message
    for an order status.
    """

    status = (
        status or "pending"
    ).lower().strip()

    order_number = f"#{order_id}"

    fulfillment = (
        fulfillment_method or ""
    ).lower().strip()


    # -----------------------------------------------------
    # ORDER RECEIVED
    # -----------------------------------------------------

    if status == "pending":

        return (
            "Order Received",
            (
                f"Hi,\n\n"
                f"We've received your Mimi Luxe order "
                f"{order_number}.\n\n"
                f"Your order is now being reviewed and "
                f"we'll keep you updated as it progresses.\n\n"
                f"Thank you for shopping with Mimi Luxe."
            )
        )


    # -----------------------------------------------------
    # CONFIRMED
    # -----------------------------------------------------

    if status == "confirmed":

        return (
            "Order Confirmed",
            (
                f"Hi,\n\n"
                f"Your Mimi Luxe order {order_number} "
                f"has been confirmed.\n\n"
                f"We'll let you know when your order "
                f"is being prepared."
            )
        )


    # -----------------------------------------------------
    # PROCESSING
    # -----------------------------------------------------

    if status == "processing":

        return (
            "Order Being Prepared",
            (
                f"Hi,\n\n"
                f"Your Mimi Luxe order {order_number} "
                f"is now being prepared.\n\n"
                f"We'll update you again when it is ready."
            )
        )


    # -----------------------------------------------------
    # READY
    # -----------------------------------------------------

    if status == "ready":

        if fulfillment == "pickup":

            location_text = (
                pickup_location
                or "our pickup location"
            )

            return (
                "Order Ready for Pickup",
                (
                    f"Hi,\n\n"
                    f"Your Mimi Luxe order {order_number} "
                    f"is ready for pickup.\n\n"
                    f"Pickup location:\n"
                    f"{location_text}\n\n"
                    f"Please collect your order when convenient."
                )
            )

        return (
            "Order Ready",
            (
                f"Hi,\n\n"
                f"Your Mimi Luxe order {order_number} "
                f"is ready and will proceed to delivery."
            )
        )


    # -----------------------------------------------------
    # OUT FOR DELIVERY
    # -----------------------------------------------------

    if status == "out_for_delivery":

        return (
            "Order On The Way",
            (
                f"Hi,\n\n"
                f"Your Mimi Luxe order {order_number} "
                f"is now out for delivery.\n\n"
                f"Please keep your phone available "
                f"so our delivery team can reach you."
            )
        )


    # -----------------------------------------------------
    # COMPLETED
    # -----------------------------------------------------

    if status == "completed":

        return (
            "Order Completed",
            (
                f"Hi,\n\n"
                f"Your Mimi Luxe order {order_number} "
                f"has been completed.\n\n"
                f"Thank you for shopping with Mimi Luxe."
            )
        )


    # -----------------------------------------------------
    # CANCELLED
    # -----------------------------------------------------

    if status == "cancelled":

        return (
            "Order Cancelled",
            (
                f"Hi,\n\n"
                f"Your Mimi Luxe order {order_number} "
                f"has been cancelled.\n\n"
                f"If you believe this was unexpected, "
                f"please contact customer service."
            )
        )


    # -----------------------------------------------------
    # UNKNOWN STATUS
    # -----------------------------------------------------

    return (
        "Order Update",
        (
            f"Hi,\n\n"
            f"Your Mimi Luxe order {order_number} "
            f"has been updated.\n\n"
            f"Current status: {status}"
        )
    )


# =========================================================
# MAIN ORDER NOTIFICATION FUNCTION
# =========================================================

def notify_order_status(
    *,
    order_id,
    customer_email: str | None,
    customer_phone: str | None,
    status: str,
    fulfillment_method: str | None = None,
    pickup_location: str | None = None
):
    """
    Send both email and SMS notifications.

    Notification failures are caught so that an email/SMS
    problem can NEVER cause the order itself to fail.
    """

    subject, message = get_order_notification(
        status=status,
        order_id=order_id,
        fulfillment_method=fulfillment_method,
        pickup_location=pickup_location
    )


    # =====================================================
    # EMAIL
    # =====================================================

    if customer_email:

        try:

            send_notification_email(
                recipient_email=customer_email,
                subject=f"Mimi Luxe — {subject}",
                body=message
            )

        except Exception as error:

            print(
                "Mimi Luxe email notification failed:",
                error
            )


    # =====================================================
    # SMS
    # =====================================================

    if customer_phone:

        try:

            send_notification_sms(
                recipient_phone=customer_phone,
                message=(
                    f"Mimi Luxe: {subject}. "
                    f"Order #{order_id}. "
                    f"Please check your email/account "
                    f"for more details."
                )
            )

        except Exception as error:

            print(
                "Mimi Luxe SMS notification failed:",
                error
            )



def notify_admin_new_order(
    order_id,
    customer_name,
    customer_email,
    customer_phone,
    fulfillment_method,
    delivery_address,
    pickup_location,
    total_amount,
    status,
    created_at,
    admin_email,
    admin_phone,
):
    location = (
        delivery_address
        if fulfillment_method == "delivery"
        else pickup_location
    )

    created_at_text = (
        created_at.strftime("%d %B %Y, %I:%M %p")
        if created_at
        else "Not available"
    )

    method = (
        fulfillment_method
        .replace("_", " ")
        .title()
    )

    admin_message = f"""
Mimi Luxe - New Order Received

Order Number: #{order_id}

Customer:
Name: {customer_name}
Email: {customer_email}
Phone: {customer_phone or "Not provided"}

Fulfillment:
Method: {method}
Location: {location or "Not provided"}

Order Total:
₦{total_amount}

Status:
{status.title()}

Order Date:
{created_at_text}

Please log in to the Mimi Luxe admin dashboard
to process this order.
""".strip()

    # Admin email
    try:
        send_notification_email(
            recipient_email=admin_email,
            subject=f"Mimi Luxe - New Order #{order_id}",
            body=admin_message,
        )
    except Exception as error:
        print(
            "Mimi Luxe admin email notification error:",
            error
        )

    # Admin SMS
    try:
        sms_message = (
            f"Mimi Luxe: New order #{order_id} received. "
            f"Customer: {customer_name}. "
            f"Total: ₦{total_amount}. "
            f"Status: {status.title()}."
        )

        send_notification_sms(
            recipient_phone=admin_phone,
            message=sms_message,
        )
    except Exception as error:
        print(
            "Mimi Luxe admin SMS notification error:",
            error
        )






def send_new_order_notifications(
    order_id,
    customer_name,
    customer_email,
    customer_phone,
    fulfillment_method,
    delivery_address,
    pickup_location,
    total_amount,
    status,
    created_at,
    admin_email,
    admin_phone,
):
    # ============================================================
    # ADMIN NEW ORDER NOTIFICATION
    # ============================================================
    try:
        notify_admin_new_order(
            order_id=order_id,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            fulfillment_method=fulfillment_method,
            delivery_address=delivery_address,
            pickup_location=pickup_location,
            total_amount=total_amount,
            status=status,
            created_at=created_at,
            admin_email=admin_email,
            admin_phone=admin_phone,
        )

    except Exception as error:
        print(
            "Mimi Luxe background admin notification error:",
            error
        )

    # ============================================================
    # CUSTOMER ORDER RECEIVED NOTIFICATION
    # ============================================================
    try:
        notify_order_status(
            order_id=order_id,
            customer_email=customer_email,
            customer_phone=customer_phone,
            status=status,
            fulfillment_method=fulfillment_method,
            pickup_location=pickup_location,
        )

    except Exception as error:
        print(
            "Mimi Luxe background customer notification error:",
            error
        )
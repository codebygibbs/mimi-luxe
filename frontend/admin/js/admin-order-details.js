
const API_URL = "http://127.0.0.1:8000";

const token =
    localStorage.getItem("admin_access_token");


const orderDetailsContainer =
    document.getElementById(
        "order-details-container"
    );


const orderDetailsMessage =
    document.getElementById(
        "order-details-message"
    );


/* =========================================
   ORDER STATUS OPTIONS
========================================= */

const ORDER_STATUSES = [
    "pending",
    "confirmed",
    "processing",
    "ready",
    "out_for_delivery",
    "completed",
    "cancelled"
];


/* =========================================
   CHECK ADMIN LOGIN
========================================= */

if (!token) {

    window.location.href =
        "login.html";

}


/* =========================================
   GET ORDER ID
========================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const orderId =
    params.get("id");


/* =========================================
   CHECK ORDER ID
========================================= */

if (!orderId) {

    if (orderDetailsMessage) {

        orderDetailsMessage.textContent =
            "No order was selected.";

        orderDetailsMessage.className =
            "admin-error";

    }

} else {

    loadOrderDetails();

}


/* =========================================
   LOAD ONE ORDER
========================================= */

async function loadOrderDetails() {

    try {

        if (orderDetailsMessage) {

            orderDetailsMessage.textContent =
                "Loading order details...";

            orderDetailsMessage.className =
                "admin-loading-message";

        }


        const response =
            await fetch(
                `${API_URL}/admins/orders/${orderId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        /* =====================================
           TOKEN EXPIRED
        ===================================== */

        if (response.status === 401) {

            localStorage.removeItem(
                "admin_access_token"
            );

            window.location.href =
                "login.html";

            return;
        }


        /* =====================================
           OTHER ERROR
        ===================================== */

        if (!response.ok) {

            let errorMessage =
                "Unable to load order.";


            try {

                const errorData =
                    await response.json();


                if (errorData.detail) {

                    errorMessage =
                        errorData.detail;

                }

            } catch (error) {

                // Ignore JSON parsing error

            }


            throw new Error(
                errorMessage
            );
        }


        /* =====================================
           GET ORDER DATA
        ===================================== */

        const order =
            await response.json();


        console.log(
            "ORDER DETAILS:",
            order
        );


        /* =====================================
           DISPLAY ORDER
        ===================================== */

        displayOrder(order);

    }

    catch (error) {

        console.error(
            "Error loading order:",
            error
        );


        if (orderDetailsMessage) {

            orderDetailsMessage.textContent =
                error.message ||
                "Unable to load order.";

            orderDetailsMessage.className =
                "admin-error";

        }

    }

}


/* =========================================
   DISPLAY ORDER
========================================= */

function displayOrder(order) {

    if (!orderDetailsContainer) {

        console.error(
            "order-details-container was not found."
        );

        return;
    }


    /* =====================================
       GET ITEMS
    ===================================== */

    const items =
        Array.isArray(order.items)
            ? order.items
            : [];


    console.log(
        "ORDER ITEMS:",
        items
    );


    /* =====================================
       BUILD ITEMS HTML
    ===================================== */

    const itemsHTML =
        items
            .map((item) => {

                return `

                    <div class="admin-order-item">

                        <div class="admin-order-item-info">

                            <h3>
                                ${
                                    item.product_name ||
                                    "Product"
                                }
                            </h3>

                            <p>
                                Product ID:
                                ${
                                    item.product_id ??
                                    "-"
                                }
                            </p>

                        </div>


                        <div class="admin-order-item-quantity">

                            <strong>
                                Quantity
                            </strong>

                            <span>
                                ${
                                    item.quantity ??
                                    0
                                }
                            </span>

                        </div>


                        <div class="admin-order-item-price">

                            <strong>
                                Unit Price
                            </strong>

                            <span>
                                ₦${Number(
                                    item.unit_price || 0
                                ).toLocaleString()}
                            </span>

                        </div>

                    </div>

                `;

            })
            .join("");


    /* =====================================
       STATUS
    ===================================== */

    const currentStatus =
        String(
            order.status ||
            "pending"
        ).toLowerCase();


    const statusOptions =
        ORDER_STATUSES
            .map((status) => {

                const selected =
                    status === currentStatus
                        ? "selected"
                        : "";


                return `
                    <option
                        value="${status}"
                        ${selected}
                    >
                        ${status.replaceAll(
                            "_",
                            " "
                        )}
                    </option>
                `;

            })
            .join("");


    /* =====================================
       DISPLAY ORDER
    ===================================== */

    orderDetailsContainer.innerHTML = `

        <div class="admin-order-details-card">


            <!-- ORDER HEADER -->

            <div class="admin-order-details-header">

                <div>

                    <p class="admin-order-label">
                        Order
                    </p>

                    <h1>
                        #${order.id}
                    </h1>

                </div>


                <select
                    id="order-status-select"
                    class="
                        admin-order-status-select
                        ${currentStatus}
                    "
                    data-order-id="${order.id}"
                >

                    ${statusOptions}

                </select>

            </div>


            <!-- CUSTOMER INFORMATION -->

            <div class="admin-order-section">

                <h2>
                    Customer Information
                </h2>


                <div class="admin-order-info-grid">


                    <div>

                        <span>
                            Customer
                        </span>

                        <strong>
                            ${
                                order.customer_name ||
                                "-"
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Email
                        </span>

                        <strong>
                            ${
                                order.customer_email ||
                                "-"
                            }
                        </strong>

                    </div>


                </div>

            </div>


            <!-- ORDER INFORMATION -->

            <div class="admin-order-section">

                <h2>
                    Order Information
                </h2>


                <div class="admin-order-info-grid">


                    <div>

                        <span>
                            Fulfillment
                        </span>

                        <strong>
                            ${
                                order.fulfillment_method ||
                                "-"
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Total Amount
                        </span>

                        <strong>
                            ₦${Number(
                                order.total_amount || 0
                            ).toLocaleString()}
                        </strong>

                    </div>


                </div>

            </div>


            <!-- ITEMS -->

            <div class="admin-order-section">

                <h2>
                    Items
                </h2>


                <div class="admin-order-items">

                    ${
                        itemsHTML ||

                        `
                            <div class="admin-empty">

                                <h3>
                                    No items found
                                </h3>

                                <p>
                                    This order does not contain
                                    any items.
                                </p>

                            </div>
                        `
                    }

                </div>

            </div>


            <!-- FOOTER -->

            <div class="admin-order-details-footer">

                <a
                    href="dashboard.html"
                    class="admin-secondary-button"
                >
                    ← Back to Dashboard
                </a>

            </div>


        </div>

    `;


    /* =====================================
       CLEAR LOADING MESSAGE
    ===================================== */

    if (orderDetailsMessage) {

        orderDetailsMessage.textContent =
            "";

    }


    /* =====================================
       STATUS CHANGE
    ===================================== */

    const statusSelect =
        document.getElementById(
            "order-status-select"
        );


    if (statusSelect) {

        statusSelect.dataset.previousStatus =
            currentStatus;


        statusSelect.addEventListener(
            "change",
            updateOrderStatus
        );

    }

}


/* =========================================
   UPDATE ORDER STATUS
========================================= */

async function updateOrderStatus(event) {

    const select =
        event.target;


    const orderId =
        select.dataset.orderId;


    const newStatus =
        select.value;


    const previousStatus =
        select.dataset.previousStatus;


    if (!orderId || !newStatus) {
        return;
    }


    const confirmed =
        window.confirm(
            `Change order #${orderId} status to "${newStatus.replaceAll("_", " ")}"?`
        );


    if (!confirmed) {

        select.value =
            previousStatus;

        return;
    }


    select.disabled =
        true;


    try {

        const response =
            await fetch(
                `${API_URL}/orders/${orderId}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );


        if (response.status === 401) {

            localStorage.removeItem(
                "admin_access_token"
            );

            window.location.href =
                "login.html";

            return;
        }


        if (!response.ok) {

            let message =
                "Unable to update order status.";


            try {

                const data =
                    await response.json();


                if (data.detail) {

                    message =
                        data.detail;

                }

            } catch (error) {

                // Ignore JSON parsing error

            }


            throw new Error(message);
        }


        select.dataset.previousStatus =
            newStatus;


        select.className =
            `admin-order-status-select ${newStatus}`;


    }

    catch (error) {

        console.error(
            "Status update error:",
            error
        );


        alert(
            error.message ||
            "Unable to update order status."
        );


        select.value =
            previousStatus;

        select.className =
            `admin-order-status-select ${previousStatus}`;

    }

    finally {

        select.disabled =
            false;

    }

}

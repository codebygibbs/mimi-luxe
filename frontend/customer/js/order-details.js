/* =========================================================
   MIMI LUXE — CUSTOMER ORDER DETAILS
   Backend route used:
   GET /orders/{order_id}

   This route is protected by current_customer on the
   backend, so a customer can only view their own order.
   ========================================================= */

document.addEventListener("DOMContentLoaded", loadOrderDetails);

async function loadOrderDetails() {
    const container = document.getElementById("order-detail");
    const orderId = new URLSearchParams(window.location.search).get("id");

    if (!container) {
        return;
    }

    if (!getCustomerToken()) {
        window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
    }

    if (!orderId) {
        container.innerHTML = `
            <div class="empty">
                <h3>${escapeHtml(t("noOrder"))}</h3>
                <a class="btn btn-primary" href="orders.html">
                    ${escapeHtml(t("backToOrders"))}
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="empty">
            ${escapeHtml(t("loadingOrder"))}
        </div>
    `;

    try {
        const response = await fetch(
            `${API_URL}/orders/${encodeURIComponent(orderId)}`,
            {
                method: "GET",
                headers: authHeaders()
            }
        );

        const data = await readApiResponse(response);

        if (response.status === 401) {
            logoutCustomer(
                `login.html?next=${encodeURIComponent(
                    `order-details.html?id=${orderId}`
                )}`
            );
            return;
        }

        if (!response.ok) {
            throw new Error(
                apiMessage(data, "This order is not available for this account.")
            );
        }

        renderOrder(data);

    } catch (error) {
        console.error("Mimi Luxe order details error:", error);

        container.innerHTML = `
            <div class="empty">
                <h3>${escapeHtml(t("orderDetails"))}</h3>
                <p>Please return to My Orders and select an order from your account.</p>
                <a class="btn btn-primary" href="orders.html">
                    ${escapeHtml(t("backToOrders"))}
                </a>
            </div>
        `;
    }
}

function renderOrder(order) {
    const container = document.getElementById("order-detail");
    const status = String(order.status || "pending");

    container.innerHTML = `
        <div class="order-head">
            <div>
                <p class="eyebrow">${escapeHtml(t("orderLabel"))}</p>
                <h3>#${escapeHtml(order.id)}</h3>
                <p class="muted-text">
                    ${escapeHtml(order.customer_name || "")}
                </p>
            </div>

            <span class="status ${escapeHtml(status)}">
                ${escapeHtml(status.replaceAll("_", " "))}
            </span>
        </div>

        <div class="order-meta">
            <div class="meta-box">
                <span>${escapeHtml(t("email"))}</span>
                <strong>${escapeHtml(order.customer_email || "-")}</strong>
            </div>

            <div class="meta-box">
                <span>${escapeHtml(t("fulfillment"))}</span>
                <strong>${escapeHtml(order.fulfillment_method || "-")}</strong>
            </div>

            <div class="meta-box">
                <span>${escapeHtml(t("total"))}</span>
                <strong>${money(order.total_amount)}</strong>
            </div>
        </div>

        <div class="order-items">
            <h2>${escapeHtml(t("items"))}</h2>

            ${(order.items || []).length
                ? order.items.map(item => `
                    <div class="order-item">
                        <img
                            src="${imageOrPlaceholder(item.product_image_url, item.product_name)}"
                            alt="${escapeHtml(item.product_name)}"
                            loading="lazy"
                        >

                        <div>
                            <strong>${escapeHtml(item.product_name)}</strong>
                            <div class="muted-small">
                                ${escapeHtml(t("productId"))} ${escapeHtml(item.product_id)}
                                · ${escapeHtml(t("quantity"))} ${Number(item.quantity)}
                            </div>
                        </div>

                        <strong>
                            ${money(Number(item.unit_price) * Number(item.quantity))}
                        </strong>
                    </div>
                `).join("")
                : `
                    <div class="empty">
                        ${escapeHtml(t("noProducts"))}
                    </div>
                `}
        </div>

        <div class="form-actions">
            <a class="btn btn-secondary" href="orders.html">
                ${escapeHtml(t("backToOrders"))}
            </a>
            <a class="btn btn-primary" href="products.html">
                ${escapeHtml(t("continueShopping"))}
            </a>
        </div>
    `;
}

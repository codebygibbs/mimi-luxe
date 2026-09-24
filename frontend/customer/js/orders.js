/* =========================================================
   FORMAT ORDER DATE
========================================================= */
function formatOrderDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}


/* =========================================================
   MIMI LUXE — CUSTOMER ORDERS
   Backend route used:
   GET /orders/

   The backend automatically limits this result to the
   currently authenticated customer.
   ========================================================= */

document.addEventListener("DOMContentLoaded", loadOrders);

async function loadOrders() {
    const container = document.getElementById("orders-list");

    if (!container) {
        return;
    }

    if (!getCustomerToken()) {
        window.location.href = "login.html?next=orders.html";
        return;
    }

    container.innerHTML = `
        <div class="empty">
            ${escapeHtml(t("loadingOrders"))}
        </div>
    `;

    try {
        const response = await fetch(
            `${API_URL}/orders/`,
            {
                method: "GET",
                headers: authHeaders()
            }
        );

        const data = await readApiResponse(response);

        if (response.status === 401) {
            logoutCustomer("login.html?next=orders.html");
            return;
        }

        if (!response.ok) {
            throw new Error(
                apiMessage(data, "Your orders are not available right now.")
            );
        }

        renderOrders(Array.isArray(data) ? data : []);

    } catch (error) {
        console.error("Mimi Luxe customer orders error:", error);

        container.innerHTML = `
            <div class="card empty">
                <h3>${escapeHtml(t("orders"))}</h3>
                <p>Please refresh this page to view your latest orders.</p>
                <button class="btn btn-secondary" type="button" id="retry-orders">
                    Try again
                </button>
            </div>
        `;

        document.getElementById("retry-orders")?.addEventListener(
            "click",
            loadOrders
        );
    }
}

function renderOrders(orders) {
    const container = document.getElementById("orders-list");

    if (!orders.length) {
        container.innerHTML = `
            <div class="card empty">
                <h3>${escapeHtml(t("noOrders"))}</h3>
                <p>${escapeHtml(t("trackOrders"))}</p>
                <a class="btn btn-primary" href="products.html">
                    ${escapeHtml(t("shopNow"))}
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => {
        const status = String(order.status || "pending");
        const itemCount = (order.items || []).reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
        );
        const orderDate = formatOrderDate(order.created_at);

        return `
            <article class="card order-card">
                <div class="order-head">
                    <div>
                        <p class="eyebrow">${escapeHtml(t("orderLabel"))}</p>
                        <h3>#${escapeHtml(order.id)}</h3>
                    </div>

                    <span class="status ${escapeHtml(status)}">
                        ${escapeHtml(status.replaceAll("_", " "))}
                    </span>
                </div>

                <div class="order-meta">
                    <div class="meta-box">
                        <span>${escapeHtml(t("total"))}</span>
                        <strong>${money(order.total_amount)}</strong>
                    </div>

                    <div class="meta-box">
                        <span>${escapeHtml(t("fulfillment"))}</span>
                        <strong>${escapeHtml(order.fulfillment_method || "-")}</strong>
                    </div>

                    <div class="meta-box">
                        <span>${escapeHtml(t("items"))}</span>
                        <strong>${itemCount}</strong>
                    </div>

                    <div class="meta-box">
                        <span>${escapeHtml(t("orderDate"))}</span>
                        <strong>${escapeHtml(t(orderDate))}</strong>
                    </div>
                </div>

                <div class="order-items">
                    ${(order.items || []).slice(0, 3).map(item => `
                        <div class="order-item">
                            <img
                                src="${imageOrPlaceholder(item.product_image_url, item.product_name)}"
                                alt="${escapeHtml(item.product_name)}"
                                loading="lazy"
                            >

                            <div>
                                <strong>${escapeHtml(item.product_name)}</strong>
                                <div class="muted-small">
                                    ${escapeHtml(t("quantity"))} ${Number(item.quantity)}
                                    · ${money(item.unit_price)}
                                </div>
                            </div>

                            <strong>
                                ${money(Number(item.unit_price) * Number(item.quantity))}
                            </strong>
                        </div>
                    `).join("")}
                </div>

                <div class="form-actions">
                    <a
                        class="btn btn-secondary"
                        href="order-details.html?id=${encodeURIComponent(order.id)}"
                    >
                        ${escapeHtml(t("details"))}
                    </a>
                </div>
            </article>
        `;
    }).join("");
}

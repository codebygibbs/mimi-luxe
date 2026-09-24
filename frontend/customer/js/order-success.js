/* =========================================================
   MIMI LUXE — ORDER SUCCESS
   Shared customer logic is loaded before this file.
========================================================= */

const token = getCustomerToken();

const params = new URLSearchParams(window.location.search);
const orderId = params.get("order_id");
const content = document.getElementById("order-success-content");

let loadedOrder = null;

/* =========================================================
   LOGGED-IN CUSTOMER CHECK
========================================================= */

if (!token) {
    window.location.href = "login.html";
}

/* =========================================================
   LANGUAGE REFRESH
   Re-render the server-loaded order when the customer changes
   language on this page.
========================================================= */

const languageSelect = document.getElementById("language-select");

if (languageSelect) {
    languageSelect.addEventListener("change", () => {
        if (loadedOrder) {
            renderOrder(loadedOrder);
        }
    });
}

/* =========================================================
   LOAD ORDER
========================================================= */

if (!orderId) {
    showError(t("noOrder"));
} else {
    loadOrder();
}

async function loadOrder() {
    try {
        const response = await fetch(
            `${API_URL}/orders/${encodeURIComponent(orderId)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || t("reviewOrder"));
        }

        loadedOrder = data;
        renderOrder(data);
    } catch (error) {
        console.error("Order confirmation error:", error);
        showError(t("reviewOrder"));
    }
}

/* =========================================================
   RENDER ORDER
========================================================= */

function renderOrder(order) {
    const items = Array.isArray(order.items) ? order.items : [];

    const itemsHTML = items.map(item => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unit_price || 0);
        const subtotal = quantity * unitPrice;
        const productName = item.product_name || "Product";
        const imageURL = imageOrPlaceholder(item.product_image_url, productName);

        return `
            <article class="order-success-item">
                <div class="order-success-item-image-wrap">
                    <img
                        class="order-success-item-image"
                        src="${imageURL}"
                        alt="${escapeHtml(productName)}"
                        loading="lazy"
                    >
                </div>

                <div class="order-success-item-info">
                    <strong>${escapeHtml(productName)}</strong>
                    <span>
                        ${escapeHtml(t("quantity"))}: ${quantity}
                        <span aria-hidden="true"> · </span>
                        ${formatCurrency(unitPrice)} ${escapeHtml(t("each"))}
                    </span>
                </div>

                <strong class="order-success-item-total">
                    ${formatCurrency(subtotal)}
                </strong>
            </article>
        `;
    }).join("");

    const fulfillment = String(order.fulfillment_method || "delivery").toLowerCase();
    const isPickup = fulfillment === "pickup";

    const fulfillmentHTML = `
        <div class="order-success-info-row">
            <span>${escapeHtml(t("fulfillment"))}</span>
            <strong>${escapeHtml(t(isPickup ? "pickup" : "delivery"))}</strong>
        </div>

        ${isPickup
            ? order.pickup_location
                ? `
                    <div class="order-success-location">
                        <span>${escapeHtml(t("pickupLocation"))}</span>
                        <strong>${escapeHtml(order.pickup_location)}</strong>
                    </div>
                `
                : ""
            : order.delivery_address
                ? `
                    <div class="order-success-location">
                        <span>${escapeHtml(t("deliveryAddress"))}</span>
                        <strong>${escapeHtml(order.delivery_address)}</strong>
                    </div>
                `
                : ""
        }
    `;

    content.innerHTML = `
        <div class="order-success-summary">

            <div class="order-success-order-number">
                <div>
                    <span class="order-success-label">${escapeHtml(t("orderLabel"))}</span>
                    <strong>#${escapeHtml(String(order.id))}</strong>
                </div>
                <span class="order-success-status ${escapeHtml(String(order.status || "pending").toLowerCase())}">
                    ${escapeHtml(formatStatus(order.status))}
                </span>
            </div>

            <div class="order-success-info">
                <div class="order-success-info-row">
                    <span>${escapeHtml(t("status"))}</span>
                    <strong>${escapeHtml(formatStatus(order.status))}</strong>
                </div>

                ${fulfillmentHTML}

                <div class="order-success-info-row order-success-total-row">
                    <span>${escapeHtml(t("total"))}</span>
                    <strong>${formatCurrency(order.total_amount)}</strong>
                </div>
            </div>

            <section class="order-success-items" aria-labelledby="order-success-items-title">
                <div class="order-success-items-heading">
                    <div>
                        <p class="eyebrow">${escapeHtml(t("orderLabel"))}</p>
                        <h2 id="order-success-items-title">${escapeHtml(t("items"))}</h2>
                    </div>
                    <span class="order-success-item-count">
                        ${items.length}
                    </span>
                </div>

                <div class="order-success-item-list">
                    ${itemsHTML || `
                        <div class="order-success-empty-items">
                            ${escapeHtml(t("noProduct"))}
                        </div>
                    `}
                </div>
            </section>
        </div>
    `;
}

/* =========================================================
   STATUS LABELS
========================================================= */

const statusTranslations = {
    en: {
        pending: "Order received",
        confirmed: "Confirmed",
        processing: "Processing",
        ready: "Ready",
        out_for_delivery: "Out for delivery",
        completed: "Completed",
        cancelled: "Cancelled"
    },
    fr: {
        pending: "Commande reçue",
        confirmed: "Confirmée",
        processing: "En préparation",
        ready: "Prête",
        out_for_delivery: "En livraison",
        completed: "Terminée",
        cancelled: "Annulée"
    },
    es: {
        pending: "Pedido recibido",
        confirmed: "Confirmado",
        processing: "En preparación",
        ready: "Listo",
        out_for_delivery: "En camino",
        completed: "Completado",
        cancelled: "Cancelado"
    },
    de: {
        pending: "Bestellung eingegangen",
        confirmed: "Bestätigt",
        processing: "In Vorbereitung",
        ready: "Bereit",
        out_for_delivery: "Unterwegs",
        completed: "Abgeschlossen",
        cancelled: "Storniert"
    },
    pt: {
        pending: "Pedido recebido",
        confirmed: "Confirmado",
        processing: "Em preparação",
        ready: "Pronto",
        out_for_delivery: "A caminho",
        completed: "Concluído",
        cancelled: "Cancelado"
    },
    it: {
        pending: "Ordine ricevuto",
        confirmed: "Confermato",
        processing: "In preparazione",
        ready: "Pronto",
        out_for_delivery: "In consegna",
        completed: "Completato",
        cancelled: "Annullato"
    },
    ar: {
        pending: "تم استلام الطلب",
        confirmed: "تم التأكيد",
        processing: "قيد التجهيز",
        ready: "جاهز",
        out_for_delivery: "في الطريق",
        completed: "مكتمل",
        cancelled: "ملغى"
    },
    zh: {
        pending: "已收到订单",
        confirmed: "已确认",
        processing: "准备中",
        ready: "已准备好",
        out_for_delivery: "配送中",
        completed: "已完成",
        cancelled: "已取消"
    },
    ja: {
        pending: "注文受付済み",
        confirmed: "確認済み",
        processing: "準備中",
        ready: "準備完了",
        out_for_delivery: "配送中",
        completed: "完了",
        cancelled: "キャンセル済み"
    },
    ko: {
        pending: "주문 접수",
        confirmed: "확인됨",
        processing: "준비 중",
        ready: "준비 완료",
        out_for_delivery: "배송 중",
        completed: "완료됨",
        cancelled: "취소됨"
    },
    hi: {
        pending: "ऑर्डर प्राप्त हुआ",
        confirmed: "पुष्टि हुई",
        processing: "तैयार किया जा रहा है",
        ready: "तैयार है",
        out_for_delivery: "रास्ते में",
        completed: "पूरा हुआ",
        cancelled: "रद्द किया गया"
    },
    tr: {
        pending: "Sipariş alındı",
        confirmed: "Onaylandı",
        processing: "Hazırlanıyor",
        ready: "Hazır",
        out_for_delivery: "Yolda",
        completed: "Tamamlandı",
        cancelled: "İptal edildi"
    },
    nl: {
        pending: "Bestelling ontvangen",
        confirmed: "Bevestigd",
        processing: "In voorbereiding",
        ready: "Klaar",
        out_for_delivery: "Onderweg",
        completed: "Voltooid",
        cancelled: "Geannuleerd"
    },
    ru: {
        pending: "Заказ получен",
        confirmed: "Подтверждён",
        processing: "Готовится",
        ready: "Готов",
        out_for_delivery: "В пути",
        completed: "Завершён",
        cancelled: "Отменён"
    },
    sw: {
        pending: "Oda imepokelewa",
        confirmed: "Imethibitishwa",
        processing: "Inaandaliwa",
        ready: "Iko tayari",
        out_for_delivery: "Iko njiani",
        completed: "Imekamilika",
        cancelled: "Imeghairiwa"
    }
};

function formatStatus(status) {
    const normalized = String(status || "pending").toLowerCase();
    const language = currentLanguage();

    return (
        statusTranslations[language]?.[normalized] ||
        statusTranslations.en[normalized] ||
        normalized.replaceAll("_", " ")
    );
}

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(value) {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2
    }).format(amount);
}

/* =========================================================
   ERROR
========================================================= */

function showError(message) {
    content.innerHTML = `
        <div class="auth-message error">
            ${escapeHtml(message)}
        </div>
    `;
}

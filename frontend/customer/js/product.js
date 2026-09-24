/* =========================================================
   MIMI LUXE — SINGLE PRODUCT PAGE
   Backend route used:
   GET /products/{product_id}
   ========================================================= */

document.addEventListener("DOMContentLoaded", loadProduct);

async function loadProduct() {
    const container = document.getElementById("product-detail");
    const productId = new URLSearchParams(window.location.search).get("id");

    if (!container) {
        return;
    }

    if (!productId) {
        container.innerHTML = `
            <div class="empty">
                <h3>${escapeHtml(t("noProduct"))}</h3>
                <p>Choose a product from the catalogue to view its details.</p>
                <a class="btn btn-primary" href="products.html">
                    ${escapeHtml(t("shop"))}
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = `<div class="empty">${escapeHtml(t("loadingProducts"))}</div>`;

    try {
        const response = await fetch(
            `${API_URL}/products/${encodeURIComponent(productId)}`,
            { method: "GET" }
        );

        const data = await readApiResponse(response);

        if (!response.ok) {
            throw new Error(
                apiMessage(data, t("productNotFound"))
            );
        }

        renderProduct(data);

    } catch (error) {
        console.error("Mimi Luxe product page error:", error);

        container.innerHTML = `
            <div class="empty">
                <h3>${escapeHtml(t("productNotFound"))}</h3>
                <p>We could not display that product. Please return to the catalogue.</p>
                <a class="btn btn-primary" href="products.html">
                    ${escapeHtml(t("shop"))}
                </a>
            </div>
        `;
    }
}

function renderProduct(product) {
    const container = document.getElementById("product-detail");

    const available =
        product.is_available === true &&
        Number(product.stock_quantity) > 0;

    const maximumQuantity = Math.max(
        1,
        Number(product.stock_quantity) || 1
    );

    container.innerHTML = `
        <div>
            <img
                class="product-detail-image"
                src="${imageOrPlaceholder(product.image_url, product.name)}"
                alt="${escapeHtml(product.name)}"
                onerror="this.onerror=null;this.src='${imageOrPlaceholder("", product.name)}';"
            >
        </div>

        <div>
            <p class="product-brand">${escapeHtml(product.brand)}</p>
            <h1>${escapeHtml(product.name)}</h1>
            <p class="product-category">${escapeHtml(product.category)}</p>
            <div class="product-detail-price">${money(product.price)}</div>

            <p class="product-description">
                ${escapeHtml(
                    product.description ||
                    "Product details are provided directly from the Mimi Luxe catalogue."
                )}
            </p>

            <p class="stock-note ${available ? "" : "unavailable"}">
                ${available
                    ? `${Number(product.stock_quantity)} ${escapeHtml(t("available"))}`
                    : escapeHtml(t("currentlyUnavailable"))}
            </p>

            <div class="quantity-control" aria-label="${escapeHtml(t("quantity"))}">
                <button class="qty-btn" type="button" id="minus" aria-label="Decrease quantity">−</button>
                <span class="qty-value" id="qty">1</span>
                <button class="qty-btn" type="button" id="plus" aria-label="Increase quantity">+</button>
            </div>

            <div class="hero-actions">
                <button
                    class="btn btn-primary"
                    type="button"
                    id="add"
                    ${available ? "" : "disabled"}
                >
                    ${escapeHtml(t("add"))}
                </button>

                <a class="btn btn-secondary" href="cart.html">
                    ${escapeHtml(t("cart"))}
                </a>
            </div>
        </div>
    `;

    let quantity = 1;
    const quantityElement = document.getElementById("qty");

    const minusButton = document.getElementById("minus");
    const plusButton = document.getElementById("plus");
    const addButton = document.getElementById("add");

    if (minusButton) {
        minusButton.addEventListener("click", () => {
            quantity = Math.max(1, quantity - 1);
            quantityElement.textContent = quantity;
        });
    }

    if (plusButton) {
        plusButton.addEventListener("click", () => {
            quantity = Math.min(
                maximumQuantity,
                quantity + 1
            );
            quantityElement.textContent = quantity;
        });
    }

    if (addButton) {
        addButton.addEventListener("click", () => {
            if (!available) {
                return;
            }

            if (!addToCart(product, quantity)) {
                return;
            }

            addButton.textContent = "Added";
            updateCartCount();

            window.setTimeout(() => {
                addButton.textContent = t("add");
            }, 900);
        });
    }
}

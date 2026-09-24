/* =========================================================
   MIMI LUXE — HOME PAGE
   =========================================================

   Backend route used:
   GET /products/

   The products endpoint is public, so the home page does
   not require a customer token to load the catalogue.
========================================================= */

document.addEventListener("DOMContentLoaded", loadFeaturedProducts);



/* =========================================================
   LOAD FEATURED PRODUCTS
========================================================= */

async function loadFeaturedProducts() {

    const grid = document.getElementById("featured-products");

    if (!grid) {
        console.error("featured-products container was not found.");
        return;
    }

    grid.innerHTML = `
        <div class="empty">
            <p>${escapeHtml(t("loadingProducts"))}</p>
        </div>
    `;

    try {
        const response = await fetch(
            `${API_URL}/products/?skip=0&limit=8`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const data = await readApiResponse(response);

        if (!response.ok) {
            throw new Error(
                apiMessage(
                    data,
                    "The product catalogue is not available right now."
                )
            );
        }

        if (!Array.isArray(data)) {
            throw new Error(
                "The product catalogue returned an unexpected response."
            );
        }

        renderFeaturedProducts(data.slice(0, 8));

    } catch (error) {
        console.error("Mimi Luxe home catalogue error:", error);
        showFeaturedProductsError(grid);
    }
}


/* =========================================================
   RENDER FEATURED PRODUCTS
========================================================= */
function imageOrPlaceholder(imageURL, productName = "Product") {

    /*
     * No image supplied:
     * return a simple built-in placeholder.
     */
    if (!imageURL) {

        const placeholderSVG = `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="600"
                height="600"
                viewBox="0 0 600 600"
            >
                <rect
                    width="600"
                    height="600"
                    fill="#f3f0f4"
                />

                <text
                    x="300"
                    y="285"
                    text-anchor="middle"
                    font-family="Arial, sans-serif"
                    font-size="28"
                    fill="#777"
                >
                    Mimi Luxe
                </text>

                <text
                    x="300"
                    y="325"
                    text-anchor="middle"
                    font-family="Arial, sans-serif"
                    font-size="18"
                    fill="#999"
                >
                    ${productName}
                </text>
            </svg>
        `;

        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
            placeholderSVG
        )}`;
    }

    /*
     * External image URL
     */
    if (
        imageURL.startsWith("http://") ||
        imageURL.startsWith("https://")
    ) {
        return imageURL;
    }

    /*
     * Image uploaded to our own backend
     */
    return `${API_URL}${imageURL}`;
}


function renderFeaturedProducts(products) {

    const grid = document.getElementById("featured-products");

    if (!grid) {
        return;
    }

    if (!products.length) {
        grid.innerHTML = `
            <div class="empty">
                <h3>${escapeHtml(t("featured"))}</h3>
                <p>${escapeHtml(t("noProducts"))}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(product => {

        const available =
            product.is_available === true &&
            Number(product.stock_quantity) > 0;

        const productId = encodeURIComponent(product.id);
        const productName = product.name || "Product";

        return `
            <article class="product-card">

                <a
                    class="product-image-link"
                    href="product.html?id=${productId}"
                >
                    <img
                        class="product-image"
                        src="${imageOrPlaceholder(
                            product.image_url,
                            productName
                        )}"
                        alt="${escapeHtml(productName)}"
                        loading="lazy"
                        onerror="this.onerror=null;this.src='${imageOrPlaceholder("", productName)}';"
                    >
                </a>

                <div class="product-content">

                    <p class="product-brand">
                        ${escapeHtml(product.brand || "")}
                    </p>

                    <h3 class="product-name">
                        ${escapeHtml(productName)}
                    </h3>

                    <p class="product-category">
                        ${escapeHtml(product.category || "")}
                    </p>

                    <p class="product-price">
                        ${money(product.price)}
                    </p>

                    <div class="product-actions">

                        <a
                            class="btn btn-secondary"
                            href="product.html?id=${productId}"
                        >
                            ${escapeHtml(t("view"))}
                        </a>

                        <button
                            class="btn btn-primary add-btn"
                            type="button"
                            data-id="${product.id}"
                            ${available ? "" : "disabled"}
                        >
                            ${escapeHtml(
                                available
                                    ? t("add")
                                    : t("currentlyUnavailable")
                            )}
                        </button>

                    </div>

                </div>

            </article>
        `;

    }).join("");


    /* =====================================================
       ADD TO CART BUTTONS
    ===================================================== */

    grid.querySelectorAll(".add-btn").forEach(button => {

        button.addEventListener("click", () => {

            const product = products.find(
                item =>
                    Number(item.id) ===
                    Number(button.dataset.id)
            );

            if (!product) {
                return;
            }

            if (!addToCart(product, 1)) {
                return;
            }

            button.textContent = "Added";
            updateCartCount();

            window.setTimeout(() => {
                button.textContent = t("add");
            }, 900);
        });
    });
}


/* =========================================================
   FEATURED PRODUCT ERROR STATE
========================================================= */

function showFeaturedProductsError(grid) {

    grid.innerHTML = `
        <div class="empty">
            <h3>${escapeHtml(t("featured"))}</h3>
            <p>
                We could not load the products right now.
                Please try again.
            </p>
            <button
                class="btn btn-secondary"
                type="button"
                id="retry-featured"
            >
                Try again
            </button>
        </div>
    `;

    document
        .getElementById("retry-featured")
        ?.addEventListener(
            "click",
            loadFeaturedProducts
        );
}

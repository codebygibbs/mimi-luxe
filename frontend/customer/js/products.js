/* =========================================================
   MIMI LUXE — PRODUCTS PAGE
   Backend route used:
   GET /products

   Query parameters supported by your backend:
   category
   brand
   search
   max_price
   skip
   limit
   ========================================================= */

document.addEventListener("DOMContentLoaded", initialiseProductsPage);

function initialiseProductsPage() {
    const form = document.getElementById("filter-form");
    const clearButton = document.getElementById("clear-filters");

    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();
            loadProducts();
        });
    }

    if (clearButton) {
        clearButton.addEventListener("click", () => {
            form?.reset();
            loadProducts();
        });
    }

    loadProducts();
}

async function loadProducts() {
    const grid = document.getElementById("products-grid");

    if (!grid) {
        return;
    }

    grid.innerHTML = `<div class="empty">${escapeHtml(t("loadingProducts"))}</div>`;

    const params = new URLSearchParams();

    params.set("skip", "0");
    params.set("limit", "50");

    const search = document.getElementById("search")?.value.trim();
    const category = document.getElementById("category")?.value;
    const brand = document.getElementById("brand")?.value;
    const maxPrice = document.getElementById("max-price")?.value;

    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (maxPrice) params.set("max_price", maxPrice);

    try {
        const response = await fetch(`${API_URL}/products?${params.toString()}`);
        const data = await readApiResponse(response);

        if (!response.ok) {
            throw new Error(
                apiMessage(
                    data,
                    "The product catalogue could not be displayed right now."
                )
            );
        }

        const products = Array.isArray(data) ? data : [];

        populateProductFilters(products);
        renderProducts(products);

    } catch (error) {
        console.error("Mimi Luxe products catalogue error:", error);

        grid.innerHTML = `
            <div class="empty">
                <h3>${escapeHtml(t("shop"))}</h3>
                <p>We are checking the product catalogue. Please try again.</p>
                <button class="btn btn-secondary" id="retry-products" type="button">
                    Try again
                </button>
            </div>
        `;

        document.getElementById("retry-products")?.addEventListener(
            "click",
            loadProducts
        );
    }
}

function populateProductFilters(products) {
    const categorySelect = document.getElementById("category");
    const brandSelect = document.getElementById("brand");

    if (!categorySelect || !brandSelect) {
        return;
    }

    const currentCategory = categorySelect.value;
    const currentBrand = brandSelect.value;

    const categories = [...new Set(
        products.map(product => product.category).filter(Boolean)
    )].sort();

    const brands = [...new Set(
        products.map(product => product.brand).filter(Boolean)
    )].sort();

    categorySelect.innerHTML = `
        <option value="">${escapeHtml(t("allCategories"))}</option>
        ${categories.map(category => `
            <option value="${escapeHtml(category)}">
                ${escapeHtml(category)}
            </option>
        `).join("")}
    `;

    brandSelect.innerHTML = `
        <option value="">${escapeHtml(t("allBrands"))}</option>
        ${brands.map(brand => `
            <option value="${escapeHtml(brand)}">
                ${escapeHtml(brand)}
            </option>
        `).join("")}
    `;

    categorySelect.value = currentCategory;
    brandSelect.value = currentBrand;
}

function renderProducts(products) {
    const grid = document.getElementById("products-grid");

    if (!products.length) {
        grid.innerHTML = `
            <div class="empty">
                <h3>${escapeHtml(t("shop"))}</h3>
                <p>${escapeHtml(t("noProducts"))}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(product => {
        const available =
            product.is_available === true &&
            Number(product.stock_quantity) > 0;

        return `
            <article class="product-card">
                <a href="product.html?id=${encodeURIComponent(product.id)}">
                    <img
                        class="product-image"
                        src="${imageOrPlaceholder(product.image_url, product.name)}"
                        alt="${escapeHtml(product.name)}"
                        loading="lazy"
                    >
                </a>

                <div class="product-content">
                    <p class="product-brand">${escapeHtml(product.brand)}</p>
                    <h3 class="product-name">${escapeHtml(product.name)}</h3>
                    <p class="product-category">${escapeHtml(product.category)}</p>
                    <p class="product-price">${money(product.price)}</p>

                    <div class="product-actions">
                        <a
                            class="btn btn-secondary"
                            href="product.html?id=${encodeURIComponent(product.id)}"
                        >
                            ${escapeHtml(t("view"))}
                        </a>

                        <button
                            class="btn btn-primary add-btn"
                            type="button"
                            data-id="${product.id}"
                            ${available ? "" : "disabled"}
                        >
                            ${escapeHtml(t("add"))}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    grid.querySelectorAll(".add-btn").forEach(button => {
        button.addEventListener("click", () => {
            const product = products.find(
                item => Number(item.id) === Number(button.dataset.id)
            );

            if (product && addToCart(product)) {
                button.textContent = "Added";
                window.setTimeout(() => {
                    button.textContent = t("add");
                }, 900);
            }
        });
    });
}

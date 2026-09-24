/* =========================================================
   MIMI LUXE - CART PAGE
   =========================================================
   This file handles:

   - Loading the cart from localStorage
   - Displaying cart products
   - Increasing quantity
   - Decreasing quantity
   - Removing products
   - Calculating totals
   - Updating the navigation cart count
   - Mobile-friendly button interaction

   ========================================================= */


/* =========================================================
   CART STORAGE KEY
   ========================================================= */

const MIMI_LUXE_CART_KEY = "mimi_luxe_cart";


/* =========================================================
   PAGE START
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("Mimi Luxe cart page loaded.");

    initialiseCartPage();

});


/* =========================================================
   INITIALISE CART PAGE
========================================================= */

function initialiseCartPage() {

    const cartList =
        document.getElementById("cart-list");

    const cartSummary =
        document.getElementById("cart-summary");


    if (!cartList || !cartSummary) {

        console.error(
            "Cart page elements were not found.",
            {
                cartList: !!cartList,
                cartSummary: !!cartSummary
            }
        );

        return;
    }


    /*
     * Use ONE click listener on the cart list.
     * This is important because renderCart() replaces
     * the buttons with new HTML.
     */

    cartList.addEventListener(
        "click",
        handleCartClick
    );


    renderCart();

}


/* =========================================================
   HANDLE CART BUTTON CLICKS
========================================================= */

function handleCartClick(event) {

    /*
     * closest() allows the user to click the actual
     * button or anything inside the button.
     */

    const button =
        event.target.closest(
            "button[data-action]"
        );


    if (!button) {
        return;
    }


    /*
     * Stop the click from reaching links or other
     * elements around the cart.
     */

    event.preventDefault();
    event.stopPropagation();


    const action =
        button.getAttribute("data-action");


    const productId =
        button.getAttribute("data-id");


    if (!productId) {

        console.error(
            "Cart button does not have a product ID."
        );

        return;
    }


    console.log(
        "Cart action:",
        action,
        "Product:",
        productId
    );


    /* =====================================================
       INCREASE
    ===================================================== */

    if (action === "increase") {

        changeCartQuantity(
            productId,
            1
        );

        return;
    }


    /* =====================================================
       DECREASE
    ===================================================== */

    if (action === "decrease") {

        changeCartQuantity(
            productId,
            -1
        );

        return;
    }


    /* =====================================================
       REMOVE
    ===================================================== */

    if (action === "remove") {

        removeCartProduct(productId);

        return;
    }

}


/* =========================================================
   GET CART
========================================================= */

function getMimiLuxeCart() {

    const storedCart =
        localStorage.getItem(
            MIMI_LUXE_CART_KEY
        );


    if (!storedCart) {

        return [];
    }


    try {

        const cart =
            JSON.parse(storedCart);


        if (!Array.isArray(cart)) {

            return [];
        }


        return cart;

    }

    catch (error) {

        console.error(
            "Mimi Luxe cart storage could not be read:",
            error
        );


        /*
         * If the old cart data is corrupted,
         * remove it so the page can start cleanly.
         */

        localStorage.removeItem(
            MIMI_LUXE_CART_KEY
        );


        return [];
    }

}


/* =========================================================
   SAVE CART
========================================================= */

function saveMimiLuxeCart(cart) {

    try {

        localStorage.setItem(
            MIMI_LUXE_CART_KEY,
            JSON.stringify(cart)
        );


        /*
         * Update any cart counter that exists
         * in the navigation.
         */

        updateMimiLuxeCartCount(cart);


    }

    catch (error) {

        console.error(
            "Unable to save Mimi Luxe cart:",
            error
        );

    }

}


/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {

    const cartList =
        document.getElementById("cart-list");


    const cartSummary =
        document.getElementById("cart-summary");


    if (!cartList || !cartSummary) {

        return;
    }


    const cart =
        getMimiLuxeCart();


    /* =====================================================
       EMPTY CART
    ===================================================== */

    if (!cart.length) {

        cartList.innerHTML = `

            <div class="empty">

                <h3>
                    Your cart is empty
                </h3>

                <p>
                    Add products to your cart and they will appear here.
                </p>

                <a
                    class="btn btn-primary"
                    href="products.html"
                >
                    Continue Shopping
                </a>

            </div>

        `;


        cartSummary.innerHTML = "";


        updateMimiLuxeCartCount(
            cart
        );


        return;
    }


    /* =====================================================
       CART PRODUCTS
    ===================================================== */

    cartList.innerHTML =
        cart.map(function (item) {

            const productId =
                String(item.id);


            const quantity =
                Math.max(
                    1,
                    Number(item.quantity) || 1
                );


            const price =
                Number(item.price) || 0;


            const stock =
                Number(item.stock_quantity);


            const hasStock =
                Number.isFinite(stock) &&
                stock > 0;


            const canIncrease =
                !hasStock ||
                quantity < stock;


            const image =
                item.image_url ||
                "images/placeholder.jpg";


            return `

                <article
                    class="cart-item"
                    data-product-id="${productId}"
                >

                    <img
                        class="cart-item-image"
                        src="${escapeCartHtml(image)}"
                        alt="${escapeCartHtml(item.name || "Product")}"
                        loading="lazy"
                    >


                    <div class="cart-item-main">

                        <h3>
                            ${escapeCartHtml(
                                item.name || "Product"
                            )}
                        </h3>


                        ${
                            item.brand
                            ? `
                                <p>
                                    ${escapeCartHtml(
                                        item.brand
                                    )}
                                </p>
                            `
                            : ""
                        }


                        ${
                            item.category
                            ? `
                                <p>
                                    ${escapeCartHtml(
                                        item.category
                                    )}
                                </p>
                            `
                            : ""
                        }


                        <p>
                            ${formatMimiLuxeMoney(price)}
                            each
                        </p>


                        <div
                            class="quantity-control cart-quantity-control"
                        >

                            <button
                                type="button"
                                class="qty-btn"
                                data-action="decrease"
                                data-id="${productId}"
                                aria-label="Decrease quantity"
                                ${quantity <= 1 ? "disabled" : ""}
                            >
                                −
                            </button>


                            <span
                                class="qty-value"
                            >
                                ${quantity}
                            </span>


                            <button
                                type="button"
                                class="qty-btn"
                                data-action="increase"
                                data-id="${productId}"
                                aria-label="Increase quantity"
                                ${canIncrease ? "" : "disabled"}
                            >
                                +
                            </button>

                        </div>


                        <button
                            type="button"
                            class="btn btn-danger cart-remove-btn"
                            data-action="remove"
                            data-id="${productId}"
                        >
                            Remove
                        </button>

                    </div>


                    <div class="cart-item-price">

                        ${formatMimiLuxeMoney(
                            price * quantity
                        )}

                    </div>

                </article>

            `;

        }).join("");


    /* =====================================================
       TOTAL
    ===================================================== */

    const total =
        cart.reduce(
            function (sum, item) {

                const price =
                    Number(item.price) || 0;


                const quantity =
                    Number(item.quantity) || 0;


                return sum +
                    (price * quantity);

            },
            0
        );


    /* =====================================================
       TOTAL NUMBER OF PRODUCTS
    ===================================================== */

    const itemCount =
        cart.reduce(
            function (sum, item) {

                return sum +
                    (Number(item.quantity) || 0);

            },
            0
        );


    /* =====================================================
       SUMMARY
    ===================================================== */

    cartSummary.innerHTML = `

        <h2>
            Order Summary
        </h2>


        <div class="summary-row">

            <span>
                Items
            </span>

            <strong>
                ${itemCount}
            </strong>

        </div>


        <div class="summary-total">

            <span>
                Total
            </span>

            <strong>
                ${formatMimiLuxeMoney(total)}
            </strong>

        </div>


        <div class="hero-actions">

            <a
                class="btn btn-primary full-width"
                href="checkout.html"
            >
                Checkout
            </a>


            <a
                class="btn btn-secondary full-width"
                href="products.html"
            >
                Continue Shopping
            </a>

        </div>

    `;


    updateMimiLuxeCartCount(
        cart
    );

}


/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeCartQuantity(productId, amount) {

    const cart = getMimiLuxeCart();

    const id = String(productId);

    const item = cart.find(function (product) {

        return String(product.id) === id;

    });


    if (!item) {

        console.error(
            "Product was not found in cart:",
            id,
            cart
        );

        return;
    }


    let quantity =
        Number(item.quantity) || 1;


    quantity += Number(amount);


    if (quantity < 1) {

        quantity = 1;

    }


    const stock =
        Number(item.stock_quantity);


    if (
        Number.isFinite(stock) &&
        stock > 0 &&
        quantity > stock
    ) {

        quantity = stock;

    }


    item.quantity = quantity;


    saveMimiLuxeCart(cart);


    renderCart();

}


/* =========================================================
   REMOVE PRODUCT
========================================================= */

function removeCartProduct(productId) {

    const id = String(productId);


    const cart =
        getMimiLuxeCart();


    const updatedCart =
        cart.filter(function (item) {

            return String(item.id) !== id;

        });


    saveMimiLuxeCart(
        updatedCart
    );


    renderCart();

}

/* =========================================================
   CART COUNT
========================================================= */

function updateMimiLuxeCartCount(
    cart
) {

    if (!Array.isArray(cart)) {

        cart =
            getMimiLuxeCart();

    }


    const count =
        cart.reduce(
            function (total, item) {

                return total +
                    (
                        Number(item.quantity) || 0
                    );

            },
            0
        );


    /*
     * Support the different cart-counter names
     * used by the frontend.
     */

    const counters =
        document.querySelectorAll(
            "#cart-count, .cart-count, [data-cart-count]"
        );


    counters.forEach(function (counter) {

        counter.textContent =
            count;

        /*
         * Keep zero hidden if the CSS expects
         * the aria-hidden state.
         */

        counter.setAttribute(
            "data-count",
            count
        );

    });

}


/* =========================================================
   MONEY
========================================================= */

function formatMimiLuxeMoney(
    amount
) {

    const number =
        Number(amount) || 0;


    return `₦${number.toLocaleString(
        "en-NG",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    )}`;

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeCartHtml(
    value
) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   COMPATIBILITY
========================================================= */

/*
 * If the rest of your frontend already uses these
 * functions, expose the new cart functions under the
 * old names as well.
 */

window.renderCart =
    renderCart;


window.changeQuantity =
    changeCartQuantity;


window.removeCartItem =
    removeCartProduct;


window.getCart =
    getMimiLuxeCart;


window.saveCart =
    saveMimiLuxeCart;


window.updateCartCount =
    function () {

        updateMimiLuxeCartCount(
            getMimiLuxeCart()
        );

    };
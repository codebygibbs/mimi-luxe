let orderSubmissionInProgress = false;

function getClientOrderId() {
  const key = "mimi_luxe_pending_order_id";

  let orderId =
    localStorage.getItem(key);

  if (!orderId) {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      orderId = window.crypto.randomUUID();
    } else {
      orderId =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;
    }

    localStorage.setItem(
      key,
      orderId
    );
  }

  return orderId;
}

function clearClientOrderId() {
  localStorage.removeItem(
    "mimi_luxe_pending_order_id"
  );
}




let adminPickupLocation = "";

document.addEventListener(
  "DOMContentLoaded",
  initialiseCheckout
);


/* =========================================================
   INITIALISE CHECKOUT
========================================================= */

function initialiseCheckout() {

  /*
   * Checkout is only available to logged-in customers.
   */

  if (!getCustomerToken()) {

    window.location.href =
      "login.html?next=checkout.html";

    return;
  }


  /*
   * There must be something in the cart
   * before checkout can continue.
   */

  const cart = getCart();

  if (!cart.length) {

    window.location.href =
      "cart.html";

    return;
  }


  const form =
    document.getElementById(
      "checkout-form"
    );


  if (!form) {
    return;
  }


  /*
   * Submit order.
   */

  form.addEventListener(
    "submit",
    submitOrder
  );


  /*
   * Listen for Delivery / Pickup changes.
   */

  document
    .querySelectorAll(
      "input[name='fulfillment']"
    )
    .forEach(input => {

      input.addEventListener(
        "change",
        toggleFulfillment
      );

    });


  /*
   * Display the correct fulfillment section.
   */

  toggleFulfillment();


  /*
   * Display cart summary.
   */

  renderCheckoutSummary(cart);


  /*
   * Load the pickup address saved by the admin.
   *
   * This runs in the background because the
   * customer may choose Pickup immediately.
   */

  loadPickupLocation();

}


/* =========================================================
   FULFILLMENT TOGGLE
========================================================= */

function toggleFulfillment() {

  const selected =
    document.querySelector(
      "input[name='fulfillment']:checked"
    );


  if (!selected) {
    return;
  }


  const isDelivery =
    selected.value === "delivery";


  const deliveryGroup =
    document.getElementById(
      "delivery-group"
    );


  const pickupGroup =
    document.getElementById(
      "pickup-group"
    );


  const deliveryAddress =
    document.getElementById(
      "delivery-address"
    );


  /*
   * Show Delivery section only when
   * Delivery is selected.
   */

  deliveryGroup?.classList.toggle(
    "hidden",
    !isDelivery
  );


  /*
   * Show Pickup section only when
   * Pickup is selected.
   */

  pickupGroup?.classList.toggle(
    "hidden",
    isDelivery
  );


  /*
   * Delivery address is required only
   * for delivery orders.
   */

  if (deliveryAddress) {

    deliveryAddress.required =
      isDelivery;

  }

}


/* =========================================================
   LOAD ADMIN PICKUP LOCATION
========================================================= */

async function loadPickupLocation() {

  const pickupLocation =
    document.getElementById(
      "pickup-location"
    );


  if (!pickupLocation) {
    return;
  }


  pickupLocation.textContent =
    "Loading pickup location...";


  try {

    const response =
      await fetch(
        `${API_URL}/store-settings/`,
        {
          method: "GET"
        }
      );


    const data =
      await readApiResponse(
        response
      );


    if (!response.ok) {

      throw new Error(
        apiMessage(
          data,
          "Pickup information is currently unavailable."
        )
      );

    }


    /*
     * The admin-controlled address.
     */

    const pickupAddress =
      String(
        data?.pickup_address || ""
      ).trim();


    if (!pickupAddress) {
      adminPickupLocation = "";
      pickupLocation.textContent =
        "Pickup location will be provided by the store.";

      return;
    }

    adminPickupLocation = pickupAddress;

    /*
     * Display the address safely.
     */

    pickupLocation.textContent =
      pickupAddress;


  } catch (error) {

    console.error(
      "Mimi Luxe pickup location error:",
      error
    );

    adminPickupLocation = ""
    /*
     * We don't make the customer type the
     * store address manually.
     *
     * The backend remains the source of truth.
     */

    pickupLocation.textContent =
      "Pickup location is currently unavailable.";

  }

}


/* =========================================================
   CHECKOUT SUMMARY
========================================================= */

function renderCheckoutSummary(cart) {

  const summary =
    document.getElementById(
      "checkout-summary"
    );


  if (!summary) {
    return;
  }


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
        Number(item.quantity),
      0
    );


  summary.innerHTML = `

    <h2>
      ${escapeHtml(t("summary"))}
    </h2>


    ${cart.map(item => `

      <div class="summary-row">

        <span>
          ${escapeHtml(item.name)}
          ×
          ${Number(item.quantity)}
        </span>

        <strong>
          ${money(
            Number(item.price) *
            Number(item.quantity)
          )}
        </strong>

      </div>

    `).join("")}


    <div class="summary-total">

      <span>
        ${escapeHtml(t("total"))}
      </span>

      <strong>
        ${money(total)}
      </strong>

    </div>

  `;

}


/* ============================================================
   ORDER SUBMISSION LOCK
============================================================ */
let orderSubmissionInProgress = false;


/* ============================================================
   SUBMIT ORDER
============================================================ */
async function submitOrder(event) {
  event.preventDefault();

  /*
   * Prevent duplicate submissions even if the submit event
   * fires more than once before the browser disables the button.
   */
  if (orderSubmissionInProgress) {
    return;
  }

  const form =
    document.getElementById(
      "checkout-form"
    );

  const message =
    document.getElementById(
      "checkout-message"
    );

  if (!form || !message) {
    return;
  }

  const submitButton =
    form.querySelector(
      "button[type='submit']"
    );

  /*
   * Read the current cart again immediately before
   * creating the order.
   */
  const cart = getCart();

  /*
   * The cart must still contain products.
   */
  if (!cart.length) {
    message.innerHTML = `
      <div class="alert error">
        Your cart is empty.
      </div>
    `;
    return;
  }

  const selectedFulfillment =
    document.querySelector(
      "input[name='fulfillment']:checked"
    );

  if (!selectedFulfillment) {
    message.innerHTML = `
      <div class="alert error">
        Please select a fulfillment method.
      </div>
    `;
    return;
  }

  const fulfillmentMethod =
    selectedFulfillment.value;

  /* ============================================================
     CUSTOMER INFORMATION
  ============================================================ */
  const customerName =
    document
      .getElementById("customer-name")
      ?.value
      ?.trim();

  const customerEmail =
    document
      .getElementById("customer-email")
      ?.value
      ?.trim();

  if (!customerName) {
    message.innerHTML = `
      <div class="alert error">
        Please enter your name.
      </div>
    `;

    document
      .getElementById("customer-name")
      ?.focus();

    return;
  }

  if (!customerEmail) {
    message.innerHTML = `
      <div class="alert error">
        Please enter your email address.
      </div>
    `;

    document
      .getElementById("customer-email")
      ?.focus();

    return;
  }

  /* ============================================================
     DELIVERY ADDRESS
  ============================================================ */
  const deliveryAddress =
    document
      .getElementById("delivery-address")
      ?.value
      ?.trim();

  if (
    fulfillmentMethod === "delivery" &&
    !deliveryAddress
  ) {
    message.innerHTML = `
      <div class="alert error">
        Please enter your delivery address.
      </div>
    `;

    document
      .getElementById("delivery-address")
      ?.focus();

    return;
  }

  /* ============================================================
     PICKUP LOCATION
  ============================================================ */
  let pickupLocation =
    adminPickupLocation;

  if (fulfillmentMethod === "pickup") {

    /*
     * If the pickup address has not loaded yet,
     * load it before allowing checkout.
     */
    if (!pickupLocation) {
      message.innerHTML = `
        <div class="alert">
          Loading pickup location...
        </div>
      `;

      await loadPickupLocation();

      pickupLocation =
        adminPickupLocation;
    }

    if (!pickupLocation) {
      message.innerHTML = `
        <div class="alert error">
          Pickup information is currently unavailable.
          Please try again in a moment.
        </div>
      `;

      return;
    }
  }

  /* ============================================================
     VALIDATE CART ITEMS
  ============================================================ */
  const orderItems = [];

  for (const item of cart) {

    const productId =
      Number(item.id);

    const quantity =
      Number(item.quantity);

    /*
     * Do not send invalid product IDs.
     */
    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      message.innerHTML = `
        <div class="alert error">
          One of the products in your cart is invalid.
          Please return to your cart and try again.
        </div>
      `;

      return;
    }

    /*
     * Do not send zero, negative, decimal,
     * or otherwise invalid quantities.
     */
    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      message.innerHTML = `
        <div class="alert error">
          One of the quantities in your cart is invalid.
          Please return to your cart and try again.
        </div>
      `;

      return;
    }

    orderItems.push({
      product_id: productId,
      quantity: quantity
    });
  }

  /* ============================================================
     ORDER PAYLOAD
  ============================================================ */
  const clientOrderId = getClientOrderId();

  const payload = {
    client_order_id: 
      clientOrderId,

    customer_name:
      customerName,

    customer_email:
      customerEmail,

    fulfillment_method:
      fulfillmentMethod,

    delivery_address:
      fulfillmentMethod === "delivery"
        ? deliveryAddress
        : null,

    items:
      orderItems
  };

  /* ============================================================
     LOCK ORDER SUBMISSION
  ============================================================ */
  orderSubmissionInProgress = true;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.setAttribute(
      "aria-disabled",
      "true"
    );
  }

  message.innerHTML = `
    <div class="alert">
      ${escapeHtml(t("loading"))}
    </div>
  `;

  /* ============================================================
     SEND ORDER TO FASTAPI
  ============================================================ */
  try {
    const response =
      await fetch(
        `${API_URL}/orders/`,
        {
          method: "POST",

          headers: {
            ...authHeaders(true),
            "Content-Type": "application/json"
          },

          body:
            JSON.stringify(payload)
        }
      );

    const data =
      await readApiResponse(
        response
      );

    /* ============================================================
       CUSTOMER SESSION EXPIRED
    ============================================================ */
    if (
      response.status === 401
    ) {
      logoutCustomer(
        "login.html?next=checkout.html"
      );

      return;
    }

    /* ============================================================
       ORDER FAILED
    ============================================================ */
    if (!response.ok) {
      throw new Error(
        apiMessage(
          data,
          "Please check the order details and try again."
        )
      );
    }

    /* ============================================================
       ORDER SUCCESS
    ============================================================ */

    /*
     * Only clear the cart AFTER the backend has confirmed
     * successful order creation.
     */
    localStorage.removeItem(
      CART_KEY
    );

    clearClientOrderId();

    updateCartCount();

    message.innerHTML = `
      <div class="alert success">
        ${escapeHtml(
          t("orderPlaced")
        )}
      </div>
    `;

    /*
     * Keep the submission locked while redirecting.
     */
    window.setTimeout(() => {

      if (data?.id) {
        window.location.href =
          `order-success.html?order_id=${encodeURIComponent(
            data.id
          )}`;
      } else {
        window.location.href =
          "orders.html";
      }

    }, 700);

  } catch (error) {

    console.error(
      "Mimi Luxe checkout error:",
      error
    );

    /*
     * If the order failed, DO NOT clear the cart.
     * The customer can correct the problem and retry.
     */
    message.innerHTML = `
      <div class="alert error">
        ${escapeHtml(
          error.message ||
          networkMessage(
            "We could not place your order. Please try again."
          )
        )}
      </div>
    `;

    /*
     * Allow another attempt after failure.
     */
    orderSubmissionInProgress = false;

    if (submitButton) {
      submitButton.disabled = false;

      submitButton.removeAttribute(
        "aria-disabled"
      );
    }
  }
}    


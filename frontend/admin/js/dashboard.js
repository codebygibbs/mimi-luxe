

/* =========================================================
   HTML ESCAPE HELPER
========================================================= */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


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



const API_URL = "https://menus-tournaments-pix-structures.trycloudflare.vom";

const adminToken =
    localStorage.getItem("admin_access_token");


const ADMIN_PRODUCTS_PER_PAGE = 12;

let adminProductsPage = 1;
let adminProductsTotal = 0;


if (!adminToken) {

    window.location.href = "login.html";

}


/* =========================================
   AUTH HEADERS
========================================= */

function adminHeaders() {

    return {
        "Authorization":
            `Bearer ${adminToken}`
    };

}


function getProductImageURL(imageURL) {
    if (!imageURL) {
        return "";
    }

    if (
        imageURL.startsWith("http://") ||
        imageURL.startsWith("https://")
    ) {
        return imageURL;
    }

    return `${API_URL}${imageURL}`;
}



/* =========================================
   LOAD PRODUCTS
========================================= */

async function loadAdminProducts() {

    const productsBody =
        document.getElementById("products-body");

    try {

        const skip =
            (adminProductsPage - 1) *
            ADMIN_PRODUCTS_PER_PAGE;

        const response = await fetch(
            `${API_URL}/products?skip=${skip}&limit=${ADMIN_PRODUCTS_PER_PAGE}`,
            {
                headers: adminHeaders()
            }
        );

        if (response.status === 401) {
            logoutAdmin();
            return;
        }

        if (!response.ok) {
            throw new Error(
                "Unable to load products."
            );
        }

        const products =
            await response.json();

        const totalHeader =
            response.headers.get("X-Total-Count");

        adminProductsTotal =
            totalHeader !== null
                ? Number(totalHeader)
                : products.length;

        document.getElementById(
            "total-products"
        ).textContent =
            adminProductsTotal;

        displayAdminProducts(products);

        renderAdminProductPagination();

    } catch (error) {

        console.error(
            "Error loading products:",
            error
        );

        productsBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load products.
                </td>
            </tr>
        `;

        const pagination =
            document.getElementById(
                "admin-products-pagination"
            );

        if (pagination) {
            pagination.innerHTML = "";
        }
    }
}


/* =========================================
   DISPLAY PRODUCTS
========================================= */

function displayAdminProducts(products) {

    const productsBody =
        document.getElementById("products-body");


    productsBody.innerHTML = "";


    if (!products.length) {

        productsBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="admin-empty">
                        <h3>No products yet</h3>
                        <p>Add your first product to the catalogue.</p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    products.forEach(product => {

    const row =
        document.createElement("tr");


    const stockQuantity =
        Number(product.stock_quantity) || 0;


    const isAvailable =
        stockQuantity > 0;
        
        row.innerHTML = `
        
        <td>
            <div class="admin-product-cell">
                ${
                    product.image_url
                        ? `
                            <img
                                src="${getProductImageURL(product.image_url)}"
                                alt="${escapeHtml(product.name || "Product")}"
                                class="admin-product-image">
                        `
                        : `
                            <div class="admin-product-image-placeholder">No image</div>
                        `
                }

                <div class="admin-product-name">${escapeHtml(product.name) || "-"}</div>
            
            </div>

        </td>


        <td>
            ${product.brand || "-"}
        </td>


        <td>
            ${product.category || "-"}
        </td>


        <td>
            ₦${Number(
                product.price || 0
            ).toLocaleString()}
        </td>


        <td>
            ${stockQuantity}
        </td>


        <td>

            <span class="
                admin-availability
                ${
                    isAvailable
                        ? "available"
                        : "unavailable"
                }
            ">

                ${
                    isAvailable
                        ? "Available"
                        : "Unavailable"
                }

            </span>

        </td>


        <td>

            <div class="admin-actions">

                <a
                    href="edit-product.html?id=${product.id}"
                    class="admin-btn admin-btn-edit"
                >
                    Edit
                </a>


                <button
                    type="button"
                    class="admin-btn admin-btn-danger"
                    onclick="deleteProduct(${product.id})"
                >
                    Delete
                </button>

            </div>

        </td>
        `;
        
        productsBody.appendChild(row);
    });
}



function renderAdminProductPagination() {

    const container =
        document.getElementById(
            "admin-products-pagination"
        );

    if (!container) {
        return;
    }

    const totalPages =
        Math.ceil(
            adminProductsTotal /
            ADMIN_PRODUCTS_PER_PAGE
        );

    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <button
            type="button"
            class="admin-btn admin-btn-secondary"
            ${adminProductsPage <= 1 ? "disabled" : ""}
            id="admin-products-prev"
        >
            Previous
        </button>

        <span class="admin-pagination-info">
            Page ${adminProductsPage} of ${totalPages}
        </span>

        <button
            type="button"
            class="admin-btn admin-btn-secondary"
            ${adminProductsPage >= totalPages ? "disabled" : ""}
            id="admin-products-next"
        >
            Next
        </button>
    `;

    const previousButton =
        document.getElementById(
            "admin-products-prev"
        );

    const nextButton =
        document.getElementById(
            "admin-products-next"
        );

    if (previousButton) {
        previousButton.addEventListener(
            "click",
            () => {
                if (adminProductsPage > 1) {
                    adminProductsPage--;
                    loadAdminProducts();
                }
            }
        );
    }

    if (nextButton) {
        nextButton.addEventListener(
            "click",
            () => {
                if (adminProductsPage < totalPages) {
                    adminProductsPage++;
                    loadAdminProducts();
                }
            }
        );
    }
}





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
   LOAD ORDERS
========================================= */

async function loadAdminOrders() {

    const ordersBody =
        document.getElementById("orders-body");

    try {

        const response = await fetch(
            `${API_URL}/orders/admin/all`,
            {
                method: "GET",
                headers: adminHeaders()
            }
        );


        if (response.status === 401) {

            logoutAdmin();

            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load admin orders."
            );
        }


        const orders =
            await response.json();


        document.getElementById(
            "total-orders"
        ).textContent =
            orders.length;


        displayAdminOrders(orders);

    }

    catch (error) {

        console.error(
            "Error loading admin orders:",
            error
        );


        ordersBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load orders.
                </td>
            </tr>
        `;
    }
}



/* =========================================================
   DISPLAY ORDERS
========================================================= */
function displayAdminOrders(orders) {
  const ordersBody = document.getElementById("orders-body");

  if (!ordersBody) {
    return;
  }

  ordersBody.innerHTML = "";

  if (!orders.length) {
    ordersBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="admin-empty">
            <h3>No orders yet</h3>
            <p>Customer orders will appear here</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  orders.forEach(order => {
    const row = document.createElement("tr");

    const currentStatus = String(
      order.status || "pending"
    ).toLowerCase();

    const statusOptions = ORDER_STATUSES.map(status => {
      const selected =
        status === currentStatus ? "selected" : "";

      return `
        <option value="${status}" ${selected}>
          ${status.replaceAll("_", " ")}
        </option>
      `;
    }).join("");

    const orderDate = formatOrderDate(order.created_at);

    row.innerHTML = `
      <td>
        #${order.id}
      </td>

      <td>
        ${escapeHtml(order.customer_name || "Unknown Customer")}
      </td>

      <td>
        ₦${Number(order.total_amount || 0).toLocaleString()}
      </td>

      <td>
        ${escapeHtml(order.fulfillment_method || "-")}
      </td>

      <td>
        <span class="admin-order-date">
          ${escapeHtml(orderDate)}
        </span>
      </td>

      <td>
        <select
          class="admin-order-status-select"
          data-order-id="${order.id}"
          data-previous-status="${escapeHtml(currentStatus)}"
          aria-label="Change order status"
        >
          ${statusOptions}
        </select>
      </td>

      <td>
        <a
          href="order-details.html?id=${encodeURIComponent(order.id)}"
          class="admin-btn admin-btn-secondary"
        >
          View
        </a>
      </td>
    `;

    ordersBody.appendChild(row);
  });

  attachOrderStatusHandlers();
}



/* =========================================
   ATTACH STATUS CHANGE HANDLERS
========================================= */

function attachOrderStatusHandlers() {

    const selects =
        document.querySelectorAll(
            ".admin-order-status-select"
        );


    selects.forEach(select => {

        select.addEventListener(
            "change",
            handleOrderStatusChange
        );

    });
}


/* =========================================
   UPDATE ORDER STATUS
========================================= */

async function handleOrderStatusChange(event) {

    const select =
        event.target;


    const orderId =
        select.dataset.orderId;


    const newStatus =
        select.value;


    if (!orderId || !newStatus) {
        return;
    }


    const previousStatus =
        select.dataset.previousStatus ||
        newStatus;


    const confirmed =
        window.confirm(
            `Change order #${orderId} status to "${newStatus.replaceAll("_", " ")}"?`
        );


    if (!confirmed) {

        select.value =
            previousStatus;

        return;
    }


    select.disabled = true;


    try {

        const response =
            await fetch(
                `${API_URL}/orders/${orderId}/status`,
                {
                    method: "PATCH",

                    headers: {
                        ...adminHeaders(),
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );


        if (response.status === 401) {

            logoutAdmin();

            return;
        }


        if (!response.ok) {

            let message =
                "Unable to update order status.";


            try {

                const data =
                    await response.json();


                if (data.detail) {
                    message = data.detail;
                }

            } catch (error) {
                // Ignore JSON parsing error
            }


            throw new Error(message);
        }


        /*
         * Remember the new status.
         */

        select.dataset.previousStatus =
            newStatus;


        /*
         * Update the class so the colour
         * changes immediately.
         */

        select.className =
            `admin-order-status-select ${newStatus}`;


    }

    catch (error) {

        console.error(
            "Order status update error:",
            error
        );


        alert(
            error.message ||
            "Unable to update order status."
        );


        /*
         * Reload the orders so the UI
         * returns to the real backend value.
         */

        await loadAdminOrders();

    }

    finally {

        select.disabled = false;

    }
}



/* =========================================
   LOAD CUSTOMER COUNT
========================================= */

async function loadCustomerCount() {

    try {

        const response = await fetch(
            `${API_URL}/admins/customers/count`,
            {
                method: "GET",

                headers: adminHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load customer count"
            );
        }

        const data = await response.json();

        const customersCount =
            document.getElementById("total-customers");

        if (customersCount) {

            customersCount.textContent =
                data.total_customers;
        }

    } catch (error) {

        console.error(
            "Customer count error:",
            error
        );
    }
}


/* =========================================
   DELETE PRODUCT
========================================= */

async function deleteProduct(productId) {

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this product?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/products/${productId}`,
            {
                method: "DELETE",

                headers: adminHeaders()
            }
        );


        if (response.status === 401) {

            logoutAdmin();

            return;
        }


        if (!response.ok) {

            const data =
                await response.json();

            throw new Error(
                data.detail ||
                "Unable to delete product."
            );

        }


        await loadAdminProducts();


    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );

        alert(error.message);

    }

}


/* =========================================
   LOGOUT
========================================= */

function logoutAdmin() {

    localStorage.removeItem(
        "admin_access_token"
    );

    window.location.href =
        "login.html";

}





function renderAdminProductPagination() {
    const container =
        document.getElementById(
            "admin-products-pagination"
        );

    if (!container) {
        return;
    }

    const totalPages =
        Math.ceil(
            adminProductsTotal /
            ADMIN_PRODUCTS_PER_PAGE
        );

    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <button
            type="button"
            class="admin-btn admin-btn-secondary"
            ${adminProductsPage === 1 ? "disabled" : ""}
            onclick="goToAdminProductsPage(${adminProductsPage - 1})"
        >
            Previous
        </button>

        <span class="admin-pagination-info">
            Page ${adminProductsPage} of ${totalPages}
        </span>

        <button
            type="button"
            class="admin-btn admin-btn-secondary"
            ${adminProductsPage === totalPages ? "disabled" : ""}
            onclick="goToAdminProductsPage(${adminProductsPage + 1})"
        >
            Next
        </button>
    `;
}

function goToAdminProductsPage(page) {
    const totalPages =
        Math.ceil(
            adminProductsTotal /
            ADMIN_PRODUCTS_PER_PAGE
        );

    if (page < 1 || page > totalPages) {
        return;
    }

    adminProductsPage = page;
    loadAdminProducts();
}



/* =========================================
   INITIAL LOAD
========================================= */

loadAdminProducts();
loadAdminOrders();
loadCustomerCount();
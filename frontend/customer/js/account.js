/* =========================================================
   MIMI LUXE
   CUSTOMER ACCOUNT PAGE

   Backend:
   GET /customers/me

   Requires:
   Authorization: Bearer <customer_access_token>
========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    initializeAccountPage
);


/* =========================================================
   INITIALIZE
========================================================= */

function initializeAccountPage() {

    const token =
        localStorage.getItem("customer_access_token");

    if (!token) {

        window.location.href = "login.html";

        return;
    }


    loadCustomerAccount();


    updateCartCount();


    setupLogoutButtons();

}


/* =========================================================
   LOAD CUSTOMER PROFILE
========================================================= */

async function loadCustomerAccount() {

    const message =
        document.getElementById("account-message");


    try {

        const token =
            localStorage.getItem("customer_access_token");


        const response = await fetch(
            `${API_URL}/customer/me`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        if (response.status === 401) {

            logoutCustomer();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load account information."
            );
        }


        displayCustomerAccount(data);


    } catch (error) {

        console.error(
            "Customer account error:",
            error
        );


        if (message) {

            message.textContent =
                "We couldn't load your account information right now.";

            message.className =
                "account-message error";

        }

    }

}


/* =========================================================
   DISPLAY CUSTOMER INFORMATION
========================================================= */

function displayCustomerAccount(customer) {

    const name =
        document.getElementById("customer-name");

    const email =
        document.getElementById("customer-email");

    const id =
        document.getElementById("customer-id");


    if (name) {

        name.textContent =
            customer.full_name || "-";

    }


    if (email) {

        email.textContent =
            customer.email || "-";

    }


    if (id) {

        id.textContent =
            customer.id ?? "-";

    }

}


/* =========================================================
   LOGOUT BUTTONS
========================================================= */

function setupLogoutButtons() {

    const buttons = [

        document.getElementById(
            "logout-button"
        ),

        document.getElementById(
            "account-logout-button"
        )

    ];


    buttons.forEach(button => {

        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            logoutCustomer
        );

    });

}


/* =========================================================
   CUSTOMER LOGOUT
========================================================= */

function logoutCustomer() {

    localStorage.removeItem(
        "customer_access_token"
    );


    window.location.href =
        "login.html";

}
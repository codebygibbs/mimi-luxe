/* =========================================================
   MIMI LUXE — CUSTOMER LOGIN
   Backend route used:
   POST /customers/login

   Backend expects:
   { email, password }

   Backend returns:
   { access_token, token_type }
   ========================================================= */

document.addEventListener("DOMContentLoaded", initialiseLogin);

function initialiseLogin() {
    const form = document.getElementById("login-form");

    if (!form) {
        return;
    }

    form.addEventListener("submit", loginCustomer);
}

async function loginCustomer(event) {
    event.preventDefault();

    const form = document.getElementById("login-form");
    const message = document.getElementById("login-message");
    const submitButton = form.querySelector("button[type='submit']");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.innerHTML = `<div class="alert">${escapeHtml(t("loading"))}</div>`;
    submitButton.disabled = true;

    try {
        const response = await fetch(
            `${API_URL}/customer/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            }
        );

        const data = await readApiResponse(response);

        if (!response.ok) {
            throw new Error(
                apiMessage(data, "Please check your email and password.")
            );
        }

        if (!data?.access_token) {
            throw new Error("Your account could not be signed in at this time.");
        }

        setCustomerToken(data.access_token);

        const next = new URLSearchParams(window.location.search).get("next");

        window.location.href = next || "orders.html";

    } catch (error) {
        console.error("Mimi Luxe customer login error:", error);

        message.innerHTML = `
            <div class="alert error">
                ${escapeHtml(
                    error.message ||
                    networkMessage("We could not complete sign in right now.")
                )}
            </div>
        `;

        submitButton.disabled = false;
    }
}

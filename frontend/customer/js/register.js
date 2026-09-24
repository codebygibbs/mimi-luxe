/* =========================================================
   MIMI LUXE — CUSTOMER REGISTRATION
   Backend route used:
   POST /customers/register

   Backend expects:
   { full_name, email, password }
   ========================================================= */

document.addEventListener("DOMContentLoaded", initialiseRegistration);

function initialiseRegistration() {
    const form = document.getElementById("register-form");

    if (!form) {
        return;
    }

    form.addEventListener("submit", registerCustomer);
}

async function registerCustomer(event) {
    event.preventDefault();

    const form = document.getElementById("register-form");
    const message = document.getElementById("register-message");
    const submitButton = form.querySelector("button[type='submit']");

    const fullName = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
        message.innerHTML = `
            <div class="alert error">
                ${escapeHtml(t("passwordsNoMatch"))}
            </div>
        `;
        return;
    }

    message.innerHTML = `<div class="alert">${escapeHtml(t("loading"))}</div>`;
    submitButton.disabled = true;

    try {
        const response = await fetch(
            `${API_URL}/customer/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    full_name: fullName,
                    email,
                    phone,
                    password
                })
            }
        );

        const data = await readApiResponse(response);

        if (!response.ok) {
            throw new Error(
                apiMessage(data, "Please check the information and try again.")
            );
        }

        message.innerHTML = `
            <div class="alert success">
                ${escapeHtml(t("accountCreated"))}
            </div>
        `;

        form.reset();

        window.setTimeout(() => {
            window.location.href = "login.html";
        }, 800);

    } catch (error) {
        console.error("Mimi Luxe customer registration error:", error);

        message.innerHTML = `
            <div class="alert error">
                ${escapeHtml(
                    error.message ||
                    networkMessage("We could not create the account right now.")
                )}
            </div>
        `;

        submitButton.disabled = false;
    }
}

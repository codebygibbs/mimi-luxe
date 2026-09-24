const API_URL = "http://127.0.0.1:8000";

const form = document.getElementById("admin-forgot-password-form");
const emailInput = document.getElementById("admin-email");
const button = document.getElementById("admin-forgot-button");
const messageBox = document.getElementById("admin-forgot-message");


form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {
        showMessage("Please enter your admin email address.", "error");
        return;
    }

    button.disabled = true;
    button.textContent = "Sending...";

    messageBox.hidden = true;

    try {

        const response = await fetch(
            `${API_URL}/admins/forgot-password`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            showMessage(
                data.detail || "Unable to process your request.",
                "error"
            );

            return;
        }

        /*
         * The backend intentionally returns the same message
         * whether or not the email exists.
         *
         * During development, the actual reset link is printed
         * in the FastAPI terminal.
         */
        showMessage(
            data.message ||
            "If an admin account exists for this email, a password reset link has been generated.",
            "success"
        );

        form.reset();

    } catch (error) {

        console.error("Admin forgot password error:", error);

        showMessage(
            "Unable to connect to the server. Please try again.",
            "error"
        );

    } finally {

        button.disabled = false;
        button.textContent = "Send Reset Link";
    }
});


function showMessage(message, type) {

    messageBox.textContent = message;

    messageBox.className =
        `admin-auth-message ${type}`;

    messageBox.hidden = false;
}




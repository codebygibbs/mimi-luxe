const API_URL = "http://127.0.0.1:8000";

const form = document.getElementById("admin-reset-password-form");

const newPasswordInput =
    document.getElementById("new-password");

const confirmPasswordInput =
    document.getElementById("confirm-password");

const button =
    document.getElementById("admin-reset-button");

const messageBox =
    document.getElementById("admin-reset-message");


// Get the reset token from the URL.
//
// Example:
//
// admin-reset-password.html?token=eyJhbGciOi...
//
const urlParams = new URLSearchParams(window.location.search);

const resetToken = urlParams.get("token");


/*
 * A reset page without a token cannot work.
 */
if (!resetToken) {

    showMessage(
        "This password reset link is missing or invalid.",
        "error"
    );

    button.disabled = true;
}


form.addEventListener("submit", async function (event) {

    event.preventDefault();

    if (!resetToken) {
        showMessage(
            "This password reset link is invalid.",
            "error"
        );

        return;
    }


    const newPassword =
        newPasswordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    /*
     * Backend requires at least 8 characters.
     */
    if (newPassword.length < 8) {

        showMessage(
            "Password must be at least 8 characters.",
            "error"
        );

        return;
    }


    /*
     * Make sure both password fields match.
     */
    if (newPassword !== confirmPassword) {

        showMessage(
            "Passwords do not match.",
            "error"
        );

        return;
    }


    button.disabled = true;
    button.textContent = "Resetting...";

    messageBox.hidden = true;


    try {

        const response = await fetch(
            `${API_URL}/admins/reset-password`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    token: resetToken,
                    new_password: newPassword
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            showMessage(
                data.detail ||
                "Unable to reset your password.",
                "error"
            );

            return;
        }


        showMessage(
            data.message ||
            "Password reset successfully. You can now log in.",
            "success"
        );


        /*
         * Clear the password fields after success.
         */
        form.reset();


        /*
         * Give the admin a moment to read the success message,
         * then return to the admin login page.
         */
        setTimeout(function () {

            window.location.href = "login.html";

        }, 2000);


    } catch (error) {

        console.error(
            "Admin reset password error:",
            error
        );

        showMessage(
            "Unable to connect to the server. Please try again.",
            "error"
        );

    } finally {

        button.disabled = false;
        button.textContent = "Reset Password";
    }

});


function showMessage(message, type) {

    messageBox.textContent = message;

    messageBox.className =
        `admin-auth-message ${type}`;

    messageBox.hidden = false;
}


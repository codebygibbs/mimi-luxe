const API_URL = "http://127.0.0.1:8000";

const registerForm =
    document.getElementById("admin-register-form");

const registerMessage =
    document.getElementById("admin-register-message");


if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        const full_name =
            document.getElementById(
                "admin-register-name"
            ).value.trim();


        const email =
            document.getElementById(
                "admin-register-email"
            ).value.trim();


        const password =
            document.getElementById(
                "admin-register-password"
            ).value;


        const confirmPassword =
            document.getElementById(
                "admin-register-confirm"
            ).value;


        if (password.length < 6) {

            registerMessage.textContent =
                "Password must be at least 6 characters.";

            registerMessage.className =
                "admin-message error";

            return;
        }


        if (password !== confirmPassword) {

            registerMessage.textContent =
                "Passwords do not match.";

            registerMessage.className =
                "admin-message error";

            return;
        }


        try {

            registerMessage.textContent =
                "Creating account...";

            registerMessage.className =
                "admin-message";


            const response = await fetch(
                `${API_URL}/admins/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        full_name,
                        email,
                        password
                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                let message =
                    "Unable to create admin account.";

                if (data.detail) {

                    if (typeof data.detail === "string") {
                        message = data.detail;
                    }

                    else if (Array.isArray(data.detail)) {
                        message = data.detail
                            .map(error => error.msg)
                            .join(", ");
                    }
                }

                throw new Error(message);
            }


            registerMessage.textContent =
                "Admin account created successfully.";

            registerMessage.className =
                "admin-message success";


            registerForm.reset();


            setTimeout(() => {

                window.location.href =
                    "login.html";

            }, 1200);


        } catch (error) {

            console.error(
                "Admin registration error:",
                error
            );


            registerMessage.textContent =
                error.message;

            registerMessage.className =
                "admin-message error";
        }

    });

}

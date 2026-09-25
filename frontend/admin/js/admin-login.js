
const API_URL = "https://reputation-forestry-continent-delivering.trycloudflare.com";

const loginForm =
    document.getElementById("admin-login-form");

const loginMessage =
    document.getElementById("admin-login-message");


if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        const email =
            document.getElementById("admin-email")
                .value
                .trim();

        const password =
            document.getElementById("admin-password")
                .value;


        try {

            loginMessage.textContent =
                "Signing in...";

            loginMessage.className =
                "admin-message";


            const response = await fetch(
                `${API_URL}/admins/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Invalid admin email or password."
                );
            }


            if (!data.access_token) {

                throw new Error(
                    "Login failed. No access token received."
                );
            }


            localStorage.setItem(
                "admin_access_token",
                data.access_token
            );


            window.location.href =
                "dashboard.html";


        } catch (error) {

            console.error(
                "Admin login error:",
                error
            );


            loginMessage.textContent =
                error.message;

            loginMessage.className =
                "admin-message error";
        }

    });

}


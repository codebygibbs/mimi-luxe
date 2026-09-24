document.addEventListener("DOMContentLoaded", () => {

    const menuToggle =
        document.getElementById("admin-menu-toggle");

    const navLinks =
        document.querySelector(".admin-nav-links");

    const logout =
        document.getElementById("admin-logout");


    if (menuToggle && navLinks) {

        menuToggle.addEventListener("click", () => {

            navLinks.classList.toggle("open");

        });

    }


    if (logout) {

        logout.addEventListener("click", (event) => {

            event.preventDefault();

            localStorage.removeItem("admin_access_token");

            window.location.href = "login.html";

        });

    }

});

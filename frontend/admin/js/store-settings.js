const API_URL = "https://menus-tournaments-pix-structures.trycloudflare.vom";


/* =========================================================
   ADMIN TOKEN
========================================================= */

const adminToken =
    localStorage.getItem("admin_access_token");


if (!adminToken) {
    window.location.href = "login.html";
}


/* =========================================================
   ELEMENTS
========================================================= */

const form =
    document.getElementById("store-settings-form");

const message =
    document.getElementById("store-settings-message");


/* =========================================================
   ADMIN HEADERS
========================================================= */

function adminHeaders() {

    return {
        "Authorization": `Bearer ${adminToken}`
    };

}


/* =========================================================
   LOAD STORE SETTINGS
========================================================= */

async function loadStoreSettings() {

    try {

        const response = await fetch(
            `${API_URL}/store-settings/`,
            {
                method: "GET",
                headers: adminHeaders()
            }
        );


        /* -------------------------------------------------
           ADMIN SESSION EXPIRED
        ------------------------------------------------- */

        if (response.status === 401) {

            localStorage.removeItem(
                "admin_access_token"
            );

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load store settings."
            );
        }


        /* -------------------------------------------------
           PUT EXISTING SETTINGS INTO FORM
        ------------------------------------------------- */

        document.getElementById(
            "store-name"
        ).value =
            data.store_name || "Mimi Luxe";


        document.getElementById(
            "pickup-address"
        ).value =
            data.pickup_address || "";


        document.getElementById(
            "phone"
        ).value =
            data.phone || "";


        document.getElementById(
            "whatsapp"
        ).value =
            data.whatsapp || "";


        document.getElementById(
            "email"
        ).value =
            data.email || "";

        
        document.getElementById(
            "admin-notification-email"
        ).value =
            data.admin_notification_email || "";


        document.getElementById(
            "admin-notification-phone"
        ).value =
            data.admin_notification_phone || "";


        document.getElementById(
            "business-hours"
        ).value =
            data.business_hours || "";

        


    } catch (error) {

        console.error(
            "Store settings loading error:",
            error
        );

        message.textContent =
            error.message ||
            "Unable to load store settings.";

        message.className =
            "admin-message error";

    }

}


/* =========================================================
   SAVE STORE SETTINGS
========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            try {

                message.textContent =
                    "Saving changes...";

                message.className =
                    "admin-message";


                /* -------------------------------------------------
                   READ FORM VALUES
                ------------------------------------------------- */

                const storeName =
                    document
                        .getElementById("store-name")
                        .value
                        .trim();


                const pickupAddress =
                    document
                        .getElementById("pickup-address")
                        .value
                        .trim();


                const phone =
                    document
                        .getElementById("phone")
                        .value
                        .trim();


                const whatsapp =
                    document
                        .getElementById("whatsapp")
                        .value
                        .trim();


                const email =
                    document
                        .getElementById("email")
                        .value
                        .trim();

                
                const admin_notification_email = 
                    document
                        .getElementById("admin-notification-email")
                        .value
                        .trim()
                        
                const admin_notification_phone = 
                    document
                        .getElementById("admin-notification-phone")
                        .value
                        .trim() 


                const businessHours =
                    document
                        .getElementById("business-hours")
                        .value
                        .trim();

                const notification = 
                    document
                        .getElementById("notification")
                        .value


                /* -------------------------------------------------
                   VALIDATION
                ------------------------------------------------- */

                if (!storeName) {

                    throw new Error(
                        "Store name is required."
                    );

                }


                if (!pickupAddress) {

                    throw new Error(
                        "Pickup address is required."
                    );

                }


                /* -------------------------------------------------
                   DATA SENT TO BACKEND
                ------------------------------------------------- */

                const settingsData = {

                    store_name:
                        storeName,

                    pickup_address:
                        pickupAddress,

                    phone:
                        phone || null,

                    whatsapp:
                        whatsapp || null,

                    email:
                        email || null,

                    business_hours:
                        businessHours || null,

                    admin_notification_email:
                        admin_notification_email || null,

                    admin_notification_phone:
                        admin_notification_phone || null

                };


                /* -------------------------------------------------
                   UPDATE BACKEND
                ------------------------------------------------- */

                const response =
                    await fetch(
                        `${API_URL}/store-settings/`,
                        {
                            method: "PUT",

                            headers: {
                                ...adminHeaders(),

                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    settingsData
                                )
                        }
                    );


                /* -------------------------------------------------
                   AUTHENTICATION
                ------------------------------------------------- */

                if (response.status === 401) {

                    localStorage.removeItem(
                        "admin_access_token"
                    );

                    window.location.href =
                        "login.html";

                    return;
                }


                const data =
                    await response.json();


                /* -------------------------------------------------
                   BACKEND VALIDATION
                ------------------------------------------------- */

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Unable to save store settings."
                    );

                }


                /* -------------------------------------------------
                   SUCCESS
                ------------------------------------------------- */

                message.textContent =
                    "Store settings saved successfully.";

                message.className =
                    "admin-message success";


            } catch (error) {

                console.error(
                    "Store settings update error:",
                    error
                );

                message.textContent =
                    error.message ||
                    "Unable to save store settings.";

                message.className =
                    "admin-message error";

            }

        }
    );

}


/* =========================================================
   INITIAL LOAD
========================================================= */

loadStoreSettings();


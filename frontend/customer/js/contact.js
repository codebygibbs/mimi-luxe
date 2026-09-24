document.addEventListener(
    "DOMContentLoaded",
    initialiseContactPage
);


async function initialiseContactPage() {

    const whatsappLink =
        document.getElementById("contact-whatsapp");

    const phoneLink =
        document.getElementById("contact-phone");

    const emailLink =
        document.getElementById("contact-email");

    const hoursElement =
        document.getElementById("contact-hours");


    try {

        const response = await fetch(
            `${API_URL}/store-settings/`
        );


        const data =
            await readApiResponse(response);


        if (!response.ok) {

            throw new Error(
                apiMessage(
                    data,
                    "Unable to load contact information."
                )
            );

        }


        /* =====================================================
           WHATSAPP
        ===================================================== */

        const whatsapp =
            String(data.whatsapp || "")
                .replace(/\D/g, "");


        if (whatsappLink && whatsapp) {

            whatsappLink.href =
                `https://wa.me/${whatsapp}?text=${encodeURIComponent(
                    "Hello Mimi Luxe, I need help."
                )}`;

        }


        /* =====================================================
           PHONE
        ===================================================== */

        const phone =
            String(data.phone || "").trim();


        if (phoneLink && phone) {

            phoneLink.href =
                `tel:${phone}`;

        }


        /* =====================================================
           EMAIL
        ===================================================== */

        const email =
            String(data.email || "").trim();


        if (emailLink && email) {

            emailLink.href =
                `mailto:${email}`;

        }


        /* =====================================================
           BUSINESS HOURS
        ===================================================== */

        if (hoursElement) {

            hoursElement.textContent =
                data.business_hours ||
                "Customer service hours unavailable.";

        }


    const params =
    new URLSearchParams(window.location.search);

    const orderId =
        params.get("order");



    if (orderId && whatsappLink && whatsapp) {
        
        const supportBox = document.getElementById("order-support");

        const supportText = document.getElementById("order-support-text");

        if (supportBox && supportText) {

            supportBox.hidden = false;

            supportText.textContent =
                `You're contacting us about order #${orderId}.`;

            whatsappLink.href =
                `https://wa.me/${whatsapp}?text=${encodeURIComponent(
                    `Hello Mimi Luxe, I need help with order #${orderId}.`
                )}`;
            }
        }

    } catch (error) {

        console.error(
            "Mimi Luxe contact settings error:",
            error
        );


        if (hoursElement) {

            hoursElement.textContent =
                "Contact information unavailable.";

        }

    }

}



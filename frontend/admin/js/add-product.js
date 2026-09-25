const API_URL = "https://reputation-forestry-continent-delivering.trycloudflare.com";

const adminToken = localStorage.getItem("admin_access_token");

if (!adminToken) {
    window.location.href = "login.html";
}


/* =========================================================
   ELEMENTS
========================================================= */

const form = document.getElementById("add-product-form");

const imageInput = document.getElementById("product-image");

const imageURLInput =
    document.getElementById("product-image-url");

const imagePreview =
    document.getElementById("image-preview");

const imagePreviewContainer =
    document.getElementById("image-preview-container");

const message =
    document.getElementById("add-product-message");

/* =========================================================
   ADMIN HEADERS
========================================================= */

function adminHeaders() {
    return {
        "Authorization": `Bearer ${adminToken}`
    };
}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

if (imageInput) {

    imageInput.addEventListener("change", () => {

        const file = imageInput.files[0];

        if (!file) {
            imagePreview.hidden = true;
            imagePreview.removeAttribute("src");
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (!allowedTypes.includes(file.type)) {

            alert(
                "Please choose a JPG, PNG, WEBP or GIF image."
            );

            imageInput.value = "";

            imagePreview.hidden = true;

            return;
        }


        const imageURL = URL.createObjectURL(file);

        imagePreview.src = imageURL;

        imagePreview.hidden = false;
    });

}




if (imageURLInput) {
    imageURLInput.addEventListener("input", () => {

        const url = imageURLInput.value.trim();

        /*
         * If a file has been selected,
         * let the file preview take priority.
         */
        if (imageInput?.files?.length) {
            return;
        }

        if (!url) {
            imagePreview.hidden = true;
            imagePreview.removeAttribute("src");
            return;
        }

        imagePreview.src = url;
        imagePreview.hidden = false;

        imagePreview.onerror = () => {
            imagePreview.hidden = true;
            imagePreview.removeAttribute("src");
        };
    });
}




/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadProductImage(file) {

    const formData = new FormData();

    formData.append("file", file);


    const response = await fetch(
        `${API_URL}/products/upload-image`,
        {
            method: "POST",
            headers: adminHeaders(),
            body: formData
        }
    );


    if (response.status === 401) {

        localStorage.removeItem(
            "admin_access_token"
        );

        window.location.href = "login.html";

        return null;
    }


    const data = await response.json();


    if (!response.ok) {

        throw new Error(
            data.detail ||
            "Unable to upload product image."
        );
    }


    return data.image_url;
}


/* =========================================================
   ADD PRODUCT
========================================================= */

if (form) {

    form.addEventListener("submit", async (event) => {

        event.preventDefault();


        try {

            message.textContent = "Adding product...";
            message.className = "admin-message";


            /* -------------------------------------------------
               READ FORM
            ------------------------------------------------- */

            const name =
                document.getElementById("product-name").value.trim();

            const brand =
                document.getElementById("product-brand").value.trim();

            const category =
                document.getElementById("product-category").value.trim();

            const description =
                document.getElementById("product-description").value.trim();

            const price =
                Number(
                    document.getElementById("product-price").value
                );

            const stockQuantity =
                Number(
                    document.getElementById(
                        "product-stock"
                    ).value
                );


            /* -------------------------------------------------
               BASIC VALIDATION
            ------------------------------------------------- */

            if (!name || !brand || !category) {

                throw new Error(
                    "Please complete the required product fields."
                );
            }


            if (!Number.isFinite(price) || price <= 0) {

                throw new Error(
                    "Please enter a valid product price."
                );
            }


            if (
                !Number.isInteger(stockQuantity) ||
                stockQuantity < 0
            ) {

                throw new Error(
                    "Please enter a valid stock quantity."
                );
            }


            /* ---------------------------------------------
            IMAGE
            --------------------------------------------- */
            let imageURL = null;

            const imageFile = imageInput?.files?.[0];
            const imageURLValue = imageURLInput?.value?.trim();

            /*
             * If the admin selected a file,
             * upload the file and use the uploaded image.
             */
            if (imageFile) {

                message.textContent = "Uploading product image...";

                imageURL = await uploadProductImage(imageFile);

            }

            /*
             * Otherwise, if the admin entered an image URL,
             * use the URL directly.
             */
            else if (imageURLValue) {

                imageURL = imageURLValue;

            }


            /* -------------------------------------------------
               PRODUCT DATA
            ------------------------------------------------- */

            const productData = {

                name: name,

                brand: brand,

                category: category,

                description:
                    description || null,

                price: price,

                image_url: imageURL,

                stock_quantity:
                    stockQuantity,

                /*
                 * Stock controls availability.
                 * We don't allow an out-of-stock product
                 * to appear as available.
                 */

                is_available:
                    stockQuantity > 0
            };


            /* -------------------------------------------------
               CREATE PRODUCT
            ------------------------------------------------- */

            message.textContent =
                "Saving product...";


            const response = await fetch(
                `${API_URL}/products`,
                {
                    method: "POST",

                    headers: {
                        ...adminHeaders(),

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            productData
                        )
                }
            );


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
                    "Unable to add product."
                );
            }


            /* -------------------------------------------------
               SUCCESS
            ------------------------------------------------- */

            message.textContent =
                "Product added successfully.";

            message.className =
                "admin-message success";


            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 900);


        } catch (error) {

            console.error(
                "Add product error:",
                error
            );


            message.textContent =
                error.message ||
                "Unable to add product.";

            message.className =
                "admin-message error";
        }

    });
}


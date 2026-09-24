let productImageUrl = null;

const API_URL = "https://menus-tournaments-pix-structures.trycloudflare.vom";

const token =
    localStorage.getItem("admin_access_token");


if (!token) {

    window.location.href =
        "login.html";

}


const params =
    new URLSearchParams(
        window.location.search
    );


const productId =
    params.get("id");


const form =
    document.getElementById(
        "edit-product-form"
    );


const message =
    document.getElementById(
        "edit-product-message"
    );

const imageInput = document.getElementById("product-image");

const imageURLInput =
    document.getElementById("product-image-url");

const imagePreview =
    document.getElementById("image-preview");



/* =========================================================
   IMAGE PREVIEW
========================================================= */

if (imageInput) {

    imageInput.addEventListener("change", () => {

        const file = imageInput.files[0];

        if (!file) {
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

            if (imagePreview) {
                imagePreview.hidden = true;
                imagePreview.removeAttribute("src");
            }

            return;
        }

        const imageURL = URL.createObjectURL(file);

        if (imagePreview) {
            imagePreview.src = imageURL;
            imagePreview.hidden = false;
        }
    });
}



if (imageURLInput) {

    imageURLInput.addEventListener("input", () => {

        const url =
            imageURLInput.value.trim();

        /*
         * Uploaded file takes priority.
         */
        if (imageInput?.files?.length) {
            return;
        }

        if (!url) {

            if (imagePreview) {
                imagePreview.hidden = true;
                imagePreview.removeAttribute("src");
            }

            return;
        }

        if (imagePreview) {

            imagePreview.src = url;
            imagePreview.hidden = false;

            imagePreview.onerror = () => {
                imagePreview.hidden = true;
                imagePreview.removeAttribute("src");
            };
        }
    });
}

async function loadProduct() {

    if (!productId) {

        message.textContent =
            "Product ID is missing.";

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/products/${productId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
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


        if (!response.ok) {

            throw new Error(
                "Unable to load product."
            );
        }


        const product =
            await response.json();

        productImageUrl = product.image_url || null;


        document.getElementById(
            "name"
        ).value =
            product.name || "";


        document.getElementById(
            "brand"
        ).value =
            product.brand || "";


        document.getElementById(
            "category"
        ).value =
            product.category || "";


        document.getElementById(
            "description"
        ).value =
            product.description || "";


        document.getElementById(
            "price"
        ).value =
            product.price ?? "";


        /* -------------------------------------------------
            EXISTING PRODUCT IMAGE
        ------------------------------------------------- */

        if (imagePreview && product.image_url) {

        const previewURL =
            product.image_url.startsWith("http://") ||
            product.image_url.startsWith("https://")
                ? product.image_url
                : `${API_URL}${product.image_url}`;

        imagePreview.src = previewURL;
        imagePreview.hidden = false;
    }


        document.getElementById(
            "stock_quantity"
        ).value =
            product.stock_quantity ?? 0;


        document.getElementById(
            "is_available"
        ).checked =
            Boolean(product.is_available);


    } catch (error) {

        console.error(error);

        message.textContent =
            "Unable to load product.";

        message.className =
            "admin-message error";
    }

}


/* =========================================================
   UPLOAD PRODUCT IMAGE
========================================================= */

async function uploadProductImage(file) {

    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
        `${API_URL}/products/upload-image`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
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


if (form) {

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            /* -------------------------------------------------
               PRODUCT DATA
            ------------------------------------------------- */

            const updatedProduct = {

                name:
                    document.getElementById("name").value.trim(),

                brand:
                    document.getElementById("brand").value.trim(),

                category:
                    document.getElementById("category").value.trim(),

                description:
                    document.getElementById("description").value.trim(),

                price:
                    Number(
                        document.getElementById("price").value
                    ),

                image_url:
                    productImageUrl,

                stock_quantity:
                    Number(
                        document.getElementById("stock_quantity").value)
                    ,

                is_available:
                    Number(
                        document.getElementById("stock_quantity").value
                    ) > 0
            };


            /* -------------------------------------------------
               IMAGE
            ------------------------------------------------- */

            const imageFile =
                imageInput?.files?.[0];

            const imageURLValue =
                imageURLInput?.value?.trim();


            /*
             * OPTION 1:
             * A new file was selected.
             *
             * Uploaded file takes priority.
             */
            if (imageFile) {

                message.textContent =
                    "Uploading product image...";

                updatedProduct.image_url =
                    await uploadProductImage(imageFile);
            }


            /*
             * OPTION 2:
             * No file, but an image URL was entered.
             */
            else if (imageURLValue) {

                let parsedURL;

                try {

                    parsedURL =
                        new URL(imageURLValue);

                } catch {

                    throw new Error(
                        "Please enter a valid image URL."
                    );
                }

                if (
                    parsedURL.protocol !== "http:" &&
                    parsedURL.protocol !== "https:"
                ) {

                    throw new Error(
                        "Image URL must start with http:// or https://."
                    );
                }

                updatedProduct.image_url =
                    imageURLValue;
            }


            /*
             * OPTION 3:
             * Neither a new file nor a new URL.
             *
             * Keep the existing image.
             */
            else {

                updatedProduct.image_url =
                    productImageUrl;
            } 


            try {

                message.textContent =
                    "Saving changes...";


                const response =
                    await fetch(
                        `${API_URL}/products/${productId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify(
                                    updatedProduct
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
                        "Unable to update product."
                    );
                }


                message.textContent =
                    "Product updated successfully.";

                message.className =
                    "admin-message success";


                setTimeout(() => {

                    window.location.href =
                        "dashboard.html";

                }, 900);


            } catch (error) {

                console.error(
                    "Update product error:",
                    error
                );


                message.textContent =
                    error.message;

                message.className =
                    "admin-message error";
            }

        }
    );

}


loadProduct();
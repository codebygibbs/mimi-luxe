document.addEventListener(
  "DOMContentLoaded",
  initialiseForgotPassword
);


function initialiseForgotPassword() {

  const form = document.getElementById(
    "forgot-password-form"
  );

  const message = document.getElementById(
    "forgot-password-message"
  );


  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const email = document
        .getElementById("forgot-email")
        ?.value
        .trim()
        .toLowerCase();


      if (!email) {
        return;
      }


      const submitButton =
        form.querySelector(
          "button[type='submit']"
        );


      if (submitButton) {
        submitButton.disabled = true;
      }


      message.className = "form-message";

      message.textContent =
        "Sending reset link...";


      try {

        const response = await fetch(
          `${API_URL}/customer/forgot-password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email: email
            })
          }
        );


        const data =
          await readApiResponse(response);


        if (!response.ok) {

          throw new Error(
            apiMessage(
              data,
              "Unable to process your request."
            )
          );
        }


        message.className =
          "form-message success";


        message.textContent =
          data.message ||
          "If an account exists for this email, a password reset link has been sent.";


      } catch (error) {

        console.error(
          "Mimi Luxe forgot password error:",
          error
        );


        message.className =
          "form-message error";


        message.textContent =
          error.message ||
          networkMessage(
            "Unable to process your request. Please try again."
          );


      } finally {

        if (submitButton) {
          submitButton.disabled = false;
        }

      }

    }
  );

}
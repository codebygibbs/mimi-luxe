document.addEventListener(
  "DOMContentLoaded",
  initialiseResetPassword
);


function initialiseResetPassword() {

  const form = document.getElementById(
    "reset-password-form"
  );

  const message = document.getElementById(
    "reset-password-message"
  );


  if (!form) {
    return;
  }


  const params =
    new URLSearchParams(
      window.location.search
    );


  const token =
    params.get("token");


  if (!token) {

    message.className =
      "form-message error";

    message.textContent =
      "This password reset link is invalid.";

    return;
  }


  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const newPassword =
        document
          .getElementById("new-password")
          ?.value;


      const confirmPassword =
        document
          .getElementById("confirm-password")
          ?.value;


      if (
        !newPassword ||
        !confirmPassword
      ) {
        return;
      }


      if (newPassword !== confirmPassword) {

        message.className =
          "form-message error";

        message.textContent =
          "The passwords do not match.";

        return;
      }


      if (newPassword.length < 8) {

        message.className =
          "form-message error";

        message.textContent =
          "Password must be at least 8 characters.";

        return;
      }


      const submitButton =
        form.querySelector(
          "button[type='submit']"
        );


      if (submitButton) {
        submitButton.disabled = true;
      }


      message.className =
        "form-message";

      message.textContent =
        "Resetting password...";


      try {

        const response = await fetch(
          `${API_URL}/customer/reset-password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              token: token,
              new_password: newPassword
            })
          }
        );


        const data =
          await readApiResponse(response);


        if (!response.ok) {

          throw new Error(
            apiMessage(
              data,
              "Unable to reset your password."
            )
          );
        }


        message.className =
          "form-message success";


        message.textContent =
          data.message ||
          "Password reset successfully.";


        window.setTimeout(
          () => {
            window.location.href =
              "login.html";
          },
          1200
        );


      } catch (error) {

        console.error(
          "Mimi Luxe password reset error:",
          error
        );


        message.className =
          "form-message error";


        message.textContent =
          error.message ||
          networkMessage(
            "Unable to reset your password. Please try again."
          );


        if (submitButton) {
          submitButton.disabled = false;
        }

      }

    }
  );

}

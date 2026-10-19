const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const signup = location.pathname.replace(/\/+$/, "") === "/sign-up";

loginForm.hidden = signup;
signupForm.hidden = !signup;
document.title = signup ? "Mailbox sign up" : "Mailbox login";

document.querySelectorAll(".auth-form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });
});

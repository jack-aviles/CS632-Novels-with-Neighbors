/* ==========================================================================
   signup.js — Sign up (user story #16)
   Checks every field before saving, then sends the reader back to the page
   they came from (or to their profile).
   ========================================================================== */

const signupForm = document.getElementById("signup-form");
const nextPage = urlParam("next") || "profile.html";

// Already have a profile on this device? Go straight to it.
if (getUser()) location.replace("profile.html");

document.getElementById("genre-options").innerHTML = GENRES.map((g) => `
  <label class="chip"><input type="checkbox" name="genres" value="${g}"><span>${g}</span></label>`).join("");

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = {
    name: document.getElementById("name").value.trim(),
    lastName: document.getElementById("lastName").value.trim(), // optional
    email: document.getElementById("email").value.trim(),
    neighborhood: document.getElementById("neighborhood").value.trim(),
    genres: [...signupForm.querySelectorAll('input[name="genres"]:checked')].map((c) => c.value),
  };

  const errors = {
    name: values.name ? "" : "Enter your first name.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ? "" : "Enter a valid email, like name@example.com.",
    neighborhood: values.neighborhood ? "" : "Enter your neighborhood or ZIP code so we can show nearby clubs.",
    genres: values.genres.length ? "" : "Pick at least one genre.",
  };

  for (const [field, message] of Object.entries(errors)) {
    document.getElementById(`${field}-error`).textContent = message;
  }

  const firstError = Object.keys(errors).find((f) => errors[f]);
  if (firstError) {
    const target = firstError === "genres" ? signupForm.querySelector("input[name=genres]") : document.getElementById(firstError);
    target.focus();
    return;
  }

  createUser(values);
  // Only allow returning to a page on this site
  location.href = /^[a-z-]+\.html/.test(nextPage) ? nextPage : "profile.html";
});

/* ==========================================================================
   profile.js — Profile page
   #2  reading interests (reading history and want-to-read live on the Books tab)
   #5  library card: deferred in the MVP, shown as "coming later"
   ========================================================================== */

const profileBox = document.getElementById("profile");

function renderProfile() {
  const user = getUser();
  if (!user) {
    profileBox.innerHTML = `
      <div class="empty">
        <p>You don't have a reader profile on this device yet.</p>
        <a class="btn" href="signup.html">Create your profile</a>
      </div>`;
    return;
  }

  const wantToRead = getWantToRead();
  const history = getHistory();
  // Full name on the profile; the Home greeting uses the first name only
  document.getElementById("profile-name").textContent = [user.name, user.lastName].filter(Boolean).join(" ");

  profileBox.innerHTML = `
    <section class="card profile-meta" aria-label="About you">
      <p class="eyebrow">Neighborhood</p>
      <p style="margin:0 0 12px">${escapeHtml(user.neighborhood)}</p>
      <div class="section-head" style="margin:0">
        <p class="eyebrow" style="margin:0">Reading interests</p>
        <button class="link-button small" id="edit-genres" type="button">Edit</button>
      </div>
      <div class="tags" id="genre-view">${user.genres.map((g) => `<span class="pill">${escapeHtml(g)}</span>`).join("")}</div>
      <form id="genre-form" hidden>
        <div class="chips">${GENRES.map((g) => `
          <label class="chip"><input type="checkbox" name="genres" value="${g}" ${user.genres.includes(g) ? "checked" : ""}><span>${g}</span></label>`).join("")}
        </div>
        <p class="error-text" id="genres-error"></p>
        <button class="btn small" type="submit">Save interests</button>
      </form>
    </section>

    <a class="card row" href="books.html" style="grid-template-columns:1fr auto;margin-top:16px">
      <div>
        <h3>Your books</h3>
        <p class="small muted" style="margin:2px 0 0">${wantToRead.length} want to read · ${history.length} read · suggestions</p>
      </div>
      <span class="muted" aria-hidden="true">›</span>
    </a>

    <section class="section card" aria-labelledby="card-title">
      <p class="eyebrow">Coming in a later release</p>
      <h2 id="card-title">Digital library card</h2>
      <p class="muted small" style="margin:0">Applying for a library card in the app needs a connection to each library's system. It's planned for after the MVP.</p>
    </section>`;

  const genreForm = document.getElementById("genre-form");
  document.getElementById("edit-genres").addEventListener("click", () => {
    genreForm.hidden = !genreForm.hidden;
    document.getElementById("genre-view").hidden = !genreForm.hidden;
  });
  genreForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const genres = [...genreForm.querySelectorAll("input:checked")].map((c) => c.value);
    if (!genres.length) {
      document.getElementById("genres-error").textContent = "Pick at least one genre.";
      return;
    }
    updateUser({ genres });
    toast("Interests saved");
    renderProfile();
  });
}

renderProfile();

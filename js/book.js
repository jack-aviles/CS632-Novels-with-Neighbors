/* ==========================================================================
   book.js — Book page (user story #13)
   Shows a book's genre, description and reviews, and lets a signed-in
   reader add it to their want-to-read list (#18) or mark it as read (#2).
   ========================================================================== */

const bookBox = document.getElementById("book");
const dialog = document.getElementById("read-dialog");
const readForm = document.getElementById("read-form");
let currentBook = null;

async function loadBook() {
  const id = urlParam("id");
  if (!id) {
    bookBox.innerHTML = '<div class="empty">No book selected. <a href="search.html">Search for one.</a></div>';
    return;
  }
  try {
    currentBook = await getBook(id);
    document.title = `${currentBook.title} · Novels with Neighbors`;
    renderBook();
  } catch (err) {
    bookBox.innerHTML = `<div class="empty">We couldn't load this book right now (${escapeHtml(err.message)}). Please try again in a moment.</div>`;
  }
}

function renderBook() {
  const b = currentBook;
  const user = getUser();
  const read = getHistoryEntry(b.id);
  const saved = isOnWantToRead(b.id);
  const reviews = getReviews(b.title);

  // Buttons change depending on whether the reader is signed in and what they've saved
  let actions;
  if (!user) {
    actions = `<a class="btn" href="${signUpLink()}">Sign up to save this book</a>`;
  } else {
    actions = `
      <button class="btn${saved || read ? " secondary" : ""}" id="want-btn" type="button" ${read ? "disabled" : ""}>
        ${read ? "Already read" : saved ? "✓ On your list" : "Want to read"}
      </button>
      <button class="btn secondary" id="read-btn" type="button">${read ? "Edit rating" : "Mark as read"}</button>`;
  }

  const genres = b.subjects.slice(0, 6).map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join("");
  const communityRating = b.rating
    ? `<p class="small"><span class="stars">${stars(b.rating)}</span> ${b.rating} average · ${b.ratingCount} rating${b.ratingCount === 1 ? "" : "s"} on ${escapeHtml(SOURCE_NAMES[b.source].replace(" (backup)", ""))}</p>`
    : "";

  bookBox.innerHTML = `
    <article class="book-detail">
      ${coverTile(b)}
      <div>
        <p class="eyebrow">${escapeHtml(b.author)}${b.year ? " · " + escapeHtml(b.year) : ""}</p>
        <h1>${escapeHtml(b.title)}</h1>
        ${communityRating}
        ${genres ? `<div class="tags" aria-label="Genres">${genres}</div>` : ""}
        <div class="actions">${actions}</div>
        ${nominateHtml(user)}
        ${read ? `<p class="small muted">You rated this <span class="stars">${stars(read.rating)}</span> on ${escapeHtml(read.finishedOn)}.</p>` : ""}
        <h2 class="section-title">About this book</h2>
        <p class="description">${escapeHtml(b.description) || '<span class="muted">No description available.</span>'}</p>
      </div>
    </article>

    <section class="section" aria-labelledby="reviews-title">
      <h2 id="reviews-title">Neighbors' reviews</h2>
      ${reviews.length ? reviews.map((r) => `
        <div class="review">
          <p class="small" style="margin:0"><strong>${escapeHtml(r.name)}${r.mine ? " (you)" : ""}</strong> · <span class="stars">${stars(r.rating)}</span></p>
          ${r.text ? `<p style="margin:6px 0 0">${escapeHtml(r.text)}</p>` : ""}
        </div>`).join("") : '<div class="empty">No reviews yet. Read it and be the first.</div>'}
    </section>`;

  document.getElementById("want-btn")?.addEventListener("click", toggleWantToRead);
  document.getElementById("nominate-form")?.addEventListener("submit", nominate);
  document.getElementById("read-btn")?.addEventListener("click", openReadDialog);
}

/* ---------- Nominate for a club ballot (user story #4) ---------- */

function nominateHtml(user) {
  const clubs = user ? getMyClubs() : [];
  if (!clubs.length) return "";
  return `
    <form id="nominate-form" class="nominate" novalidate>
      <label for="nominate-club">Nominate for a club</label>
      <div class="nominate-row">
        <select id="nominate-club">${clubs.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join("")}</select>
        <button class="btn small secondary" type="submit">Nominate</button>
      </div>
    </form>`;
}

function nominate(event) {
  event.preventDefault();
  const clubId = document.getElementById("nominate-club").value;
  const club = getClub(clubId);
  const result = nominateBook(clubId, currentBook);
  const messages = {
    added: `Added to ${possessive(club.name)} ballot`,
    exists: `Already on ${possessive(club.name)} ballot`,
    full: `${possessive(club.name)} ballot is full (${BALLOT_MAX_OPTIONS} books)`,
    "not-member": "Join the club first to nominate books",
  };
  // Added or already there: the message links to the club so they can see the ballot
  const link = ["added", "exists"].includes(result)
    ? { href: `club.html?id=${encodeURIComponent(clubId)}`, label: "See ballot" }
    : null;
  toast(messages[result], link);
}

function toggleWantToRead() {
  if (isOnWantToRead(currentBook.id)) {
    removeFromWantToRead(currentBook.id);
    toast("Removed from your want-to-read list");
  } else {
    const result = addToWantToRead(currentBook);
    if (result === "full") {
      toast(`Your list is full (${WANT_TO_READ_LIMIT} books). Remove one to add this.`);
      return;
    }
    toast("Added to your want-to-read list");
  }
  renderBook();
}

/* ---------- Mark as read dialog ---------- */

const ratingBox = document.getElementById("rating-options");
ratingBox.innerHTML = [1, 2, 3, 4, 5].map((n) => `
  <label class="chip"><input type="radio" name="rating" value="${n}"><span>${"★".repeat(n)}</span></label>`).join("");

function openReadDialog() {
  const existing = getHistoryEntry(currentBook.id);
  readForm.reset();
  document.getElementById("rating-error").textContent = "";
  if (existing) {
    const radio = readForm.querySelector(`input[name="rating"][value="${Math.round(existing.rating)}"]`);
    if (radio) radio.checked = true;
    const mine = getReviews(currentBook.title).find((r) => r.mine);
    readForm["review-text"].value = mine?.text || "";
  }
  dialog.showModal();
}

readForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const rating = Number(readForm.querySelector('input[name="rating"]:checked')?.value);
  if (!rating) {
    document.getElementById("rating-error").textContent = "Choose a rating from 1 to 5 stars.";
    return;
  }
  markAsRead(currentBook, rating, readForm["review-text"].value.trim());
  dialog.close();
  toast("Saved to your reading history");
  renderBook();
});

document.getElementById("cancel-read").addEventListener("click", () => dialog.close());

/* "Back" returns to the exact page the reader came from (search results, profile…) */
const backLink = document.getElementById("back-link");
if (document.referrer && new URL(document.referrer).origin === location.origin) {
  backLink.href = document.referrer;
  backLink.textContent = "← Back";
}

loadBook();

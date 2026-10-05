/* ==========================================================================
   books.js — Books tab
   Order is deliberate (team decision): suggestions first, because getting
   readers to act on suggestions is a priority.
   #9  Suggested for you
   #18 Want to read (capped at 50)
   #2  Reading history
   ========================================================================== */

const booksBox = document.getElementById("books");

async function renderBooks() {
  const user = getUser();
  if (!user) {
    booksBox.innerHTML = `
      <section class="section empty">
        <p>Create a reader profile to get book suggestions picked for you and save books to read later.</p>
        <a class="btn" href="${signUpLink()}">Create your profile</a>
      </section>`;
    return;
  }

  const wantToRead = getWantToRead();
  const history = getHistory();

  booksBox.innerHTML = `
    <section class="section" aria-labelledby="suggest-title" style="margin-top:28px">
      <div class="section-head suggest-head">
        <div>
          <h2 id="suggest-title">Suggested for you</h2>
          <p class="small muted">Based on your genres and the books you rated highly</p>
        </div>
      </div>
      <div id="suggestions" class="shelf shelf-small" aria-live="polite"><p class="loading">Finding books for you…</p></div>
    </section>

    <section class="section" aria-labelledby="wtr-title">
      <div class="section-head">
        <h2 id="wtr-title">Want to read</h2>
        <span class="small"><span class="count">${wantToRead.length}</span> / ${WANT_TO_READ_LIMIT}</span>
      </div>
      ${wantToRead.length ? `<div class="shelf shelf-small">${wantToRead.map((b) => `
        <div class="shelf-item">
          <a href="book.html?id=${encodeURIComponent(b.id)}" aria-label="${escapeHtml(b.title)}">${coverTile(b)}</a>
          <button class="link-button" type="button" data-remove="${escapeHtml(b.id)}" aria-label="Remove ${escapeHtml(b.title)}">Remove</button>
        </div>`).join("")}</div>`
        : '<div class="empty">Nothing saved yet. Tap “Want to read” on any book to save it here.</div>'}
    </section>

    <section class="section" aria-labelledby="history-title">
      <div class="section-head">
        <h2 id="history-title">Reading history</h2>
        <span class="small muted">${history.length} book${history.length === 1 ? "" : "s"}</span>
      </div>
      ${history.length ? `<div class="list">${history.map((b) => `
        <a class="row" href="book.html?id=${encodeURIComponent(b.id)}">
          ${coverTile(b)}
          <div>
            <h3>${escapeHtml(b.title)}</h3>
            <p class="small muted" style="margin:2px 0 0">${escapeHtml(b.author)}</p>
          </div>
          <span class="stars small">${stars(b.rating)}</span>
        </a>`).join("")}</div>`
        : '<div class="empty">Books you mark as read appear here. Your ratings also improve your suggestions.</div>'}
    </section>`;

  booksBox.querySelectorAll("[data-remove]").forEach((btn) =>
    btn.addEventListener("click", () => {
      removeFromWantToRead(btn.dataset.remove);
      toast("Removed from your list");
      renderBooks();
    }));

  // Suggestions load last because they may wait on Open Library
  const suggestions = await getSuggestions();
  const box = document.getElementById("suggestions");
  box.innerHTML = suggestions.length
    ? suggestions.map((b) => `
        <a class="shelf-item" href="book.html?id=${encodeURIComponent(b.id)}">
          ${coverTile(b)}
          <div class="meta"><span class="why">${escapeHtml(b.reason)}</span></div>
        </a>`).join("")
    : '<div class="empty">Rate a few books to get suggestions.</div>';
}

renderBooks();

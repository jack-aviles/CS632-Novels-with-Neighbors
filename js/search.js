/* ==========================================================================
   search.js — Search page (user story #1)
   Acceptance criterion: results filtered by title, author, genre or keyword,
   returned in 3 seconds or less. The page shows the measured time so testers
   can check the criterion on every search.
   ========================================================================== */

const form = document.getElementById("search-form");
const statusBox = document.getElementById("search-status");
const resultsBox = document.getElementById("results");
const errorBox = document.getElementById("search-error");

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // stay on this page instead of reloading it
  const query = form.query.value.trim();
  const field = form.field.value;

  if (query.length < 2) {
    errorBox.textContent = "Type at least 2 characters to search.";
    form.query.focus();
    return;
  }
  errorBox.textContent = "";

  // Keep the search in the address bar so Back from a book page returns here
  history.replaceState(null, "", `?field=${field}&q=${encodeURIComponent(query)}`);
  await runSearch(query, field);
});

async function runSearch(query, field) {
  statusBox.innerHTML = "";
  resultsBox.innerHTML = '<p class="loading">Searching…</p>';

  const { results, source, sourceName, ms, withinTarget } = await searchBooks(query, field);

  statusBox.innerHTML = `
    <span>${results.length} result${results.length === 1 ? "" : "s"} in ${(ms / 1000).toFixed(2)}s</span>
    <span class="pill ${withinTarget ? "ok" : "warn"}">${withinTarget ? "Within 3s target" : "Slower than 3s target"}</span>
    <span class="pill">${escapeHtml(sourceName)}</span>
    ${source === "local" ? `<p class="small muted" style="margin:4px 0 0;width:100%">Open Library couldn't be reached, so these results come from our offline list of ${FALLBACK_BOOKS.length} popular books.</p>` : ""}`;

  if (results.length === 0) {
    resultsBox.innerHTML = `<div class="empty">No books found for “${escapeHtml(query)}”. Try a different spelling or search type.</div>`;
    return;
  }

  resultsBox.innerHTML = results.map((book) => `
    <a class="row" href="book.html?id=${encodeURIComponent(book.id)}">
      ${coverTile(book)}
      <div>
        <h3>${escapeHtml(book.title)}</h3>
        <p class="small muted" style="margin:2px 0 0">${escapeHtml(book.author)}${book.year ? " · " + escapeHtml(book.year) : ""}</p>
        ${book.rating ? `<p class="small stars" style="margin:2px 0 0">${stars(book.rating)} <span class="muted">${book.rating}</span></p>` : ""}
      </div>
      <span class="muted" aria-hidden="true">›</span>
    </a>`).join("");
}

/* If the page was opened with a search in the address (e.g. coming Back),
   fill the form and run it again. */
const startQuery = urlParam("q");
if (startQuery) {
  form.query.value = startQuery;
  form.field.value = urlParam("field") || "title";
  runSearch(startQuery, form.field.value);
}

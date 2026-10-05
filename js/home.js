/* ==========================================================================
   home.js — Home page
   Your week at a glance: your club's current book and next meeting,
   the vote for next month's book, a few suggestions, and nearby events.
   ========================================================================== */

const homeBox = document.getElementById("home");

function renderHome() {
  const user = getUser();
  document.getElementById("greeting").textContent = `${greeting()}, ${user ? user.name : "neighbor"}`;

  const club = user ? getMyClubs()[0] : null;
  const weekEnd = daysFromToday(7);
  const events = getEvents().filter((e) => e.date <= weekEnd).slice(0, 3);

  homeBox.innerHTML = `
    ${heroHtml(user, club)}

    ${club ? `
      <section class="section" aria-labelledby="ballot-title">
        <div class="section-head">
          <h2 id="ballot-title">Vote on ${escapeHtml(club.ballot.month)}'s read</h2>
          <span class="muted small">${ballotClosesLabel(club)}</span>
        </div>
        <div id="home-ballot"></div>
      </section>` : ""}

    ${user ? `
      <section class="section" aria-labelledby="home-suggest-title">
        <div class="section-head">
          <h2 id="home-suggest-title">Suggested for you</h2>
          <a href="books.html" class="small">See all in Books</a>
        </div>
        <div id="home-suggestions" class="shelf shelf-small"><p class="loading">Finding books for you…</p></div>
      </section>` : ""}

    <section class="section" aria-labelledby="events-title">
      <div class="section-head">
        <h2 id="events-title">This week nearby</h2>
        <a href="events.html" class="small">All events</a>
      </div>
      ${events.length ? `<div class="list">${events.map(eventCard).join("")}</div>`
        : '<div class="empty">No events in the next 7 days. <a href="events.html">Post one</a>.</div>'}
    </section>`;

  if (club) renderBallot(club, document.getElementById("home-ballot"));
  if (user) loadHomeSuggestions();
}

/* The big card at the top changes with the reader's situation */
function heroHtml(user, club) {
  if (!user) {
    return `<div class="card">
      <p class="eyebrow amber">Welcome</p>
      <h2>Read with people who live near you</h2>
      <p class="muted">Join a local book club, vote on what to read next, and meet up somewhere new each month.</p>
      <a class="btn" href="signup.html?next=index.html">Create your profile</a>
    </div>`;
  }
  if (!club) {
    return `<div class="card">
      <p class="eyebrow amber">Get started</p>
      <h2>Join your first book club</h2>
      <p class="muted">Clubs near ${escapeHtml(user.neighborhood)} are open to new members.</p>
      <a class="btn" href="clubs.html">Browse clubs</a>
    </div>`;
  }
  const book = club.currentBook;
  return `<div class="card hero">
    ${book ? coverTile(book) : '<div class="cover c4"><span class="cover-title">To be decided</span></div>'}
    <div>
      <p class="eyebrow amber">${escapeHtml(club.name)} · Now reading</p>
      <h2>${book ? escapeHtml(book.title) : "Next book not picked yet"}</h2>
      <p class="muted">Next meeting ${formatDate(club.meetingDate)} · ${formatTime(club.meetingTime)}<br>
        ${escapeHtml(club.place)}</p>
      <a class="btn" href="club.html?id=${encodeURIComponent(club.id)}">Open club</a>
    </div>
  </div>`;
}

async function loadHomeSuggestions() {
  const box = document.getElementById("home-suggestions");
  const picks = (await getSuggestions(4));
  box.innerHTML = picks.length
    ? picks.map((b) => `
        <a class="shelf-item" href="book.html?id=${encodeURIComponent(b.id)}">
          ${coverTile(b)}
          <div class="meta"><span class="why">${escapeHtml(b.reason)}</span></div>
        </a>`).join("")
    : '<div class="empty">Rate a few books to get suggestions.</div>';
}

renderHome();

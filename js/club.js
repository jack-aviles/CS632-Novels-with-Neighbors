/* ==========================================================================
   club.js — one club's page
   #3 club details + join, #4 vote on the next book.
   The organizer can close the vote: the winner becomes the current book.
   ========================================================================== */

const clubBox = document.getElementById("club");
const clubId = urlParam("id");

function renderClub() {
  const club = getClub(clubId);
  if (!club) {
    clubBox.innerHTML = '<div class="empty">This club doesn\'t exist anymore. <a href="clubs.html">See all clubs</a>.</div>';
    return;
  }
  document.title = `${club.name} · Novels with Neighbors`;

  const user = getUser();
  const member = isMember(club.id);
  const full = club.members.length >= club.size;
  const book = club.currentBook;

  let joinArea = "";
  if (!member) {
    joinArea = !user
      ? `<a class="btn" href="${signUpLink()}">Sign up to join</a>`
      : full ? '<span class="pill full">Club is full</span>'
      : '<button class="btn" id="join-btn" type="button">Join this club</button>';
  }

  clubBox.innerHTML = `
    <p class="eyebrow amber">${escapeHtml(club.genre)} · Organized by ${escapeHtml(club.organizer)}${isOrganizer(club) ? " (you)" : ""}</p>
    <h1>${escapeHtml(club.name)}</h1>
    ${club.description ? `<p class="muted">${escapeHtml(club.description)}</p>` : ""}

    <div class="card facts">
      <div><p class="eyebrow">Next meeting</p><p>${formatDate(club.meetingDate)} · ${formatTime(club.meetingTime)}</p></div>
      <div><p class="eyebrow">Where</p><p>${escapeHtml(club.place)}</p></div>
      <div><p class="eyebrow">Members</p><p>${club.members.length} of ${club.size}</p></div>
    </div>
    ${joinArea ? `<div class="actions">${joinArea}</div>` : ""}

    <section class="section" aria-labelledby="now-title">
      <h2 id="now-title">Now reading</h2>
      ${book ? `
        <a class="row" href="book.html?id=${encodeURIComponent(book.id)}">
          ${coverTile(book)}
          <div><h3>${escapeHtml(book.title)}</h3><p class="small muted" style="margin:2px 0 0">${escapeHtml(book.author)}</p></div>
          <span class="muted" aria-hidden="true">›</span>
        </a>` : '<div class="empty">No book picked yet. Nominate books, vote, and the organizer closes the vote to pick one.</div>'}
    </section>

    <section class="section" aria-labelledby="ballot-title">
      <div class="section-head">
        <h2 id="ballot-title">Vote on ${escapeHtml(club.ballot.month)}'s read</h2>
        <span class="muted small">${ballotClosesLabel(club)}</span>
      </div>
      <div id="club-ballot"></div>
      ${member ? '<p class="small muted">To add a book, open it from the Books tab and tap “Nominate for a club”.</p>' : ""}
      ${isOrganizer(club) && club.ballot.options.length ? `
        <div id="close-area" class="actions">
          <button class="btn secondary" id="close-btn" type="button">Close vote and pick the winner</button>
        </div>` : ""}
    </section>

    <section class="section" aria-labelledby="members-title">
      <h2 id="members-title">Members</h2>
      <div class="tags">${club.members.map((m) => `<span class="pill">${escapeHtml(m)}${user && m === user.name && member ? " (you)" : ""}</span>`).join("")}</div>
    </section>`;

  renderBallot(club, document.getElementById("club-ballot"));

  document.getElementById("join-btn")?.addEventListener("click", () => {
    const result = joinClub(club.id);
    if (result === "full") toast("Sorry, this club just filled up.", null, "danger");
    else toast(`Welcome to ${club.name}!`);
    renderClub();
  });

  // Closing the vote asks for confirmation on the page itself
  document.getElementById("close-btn")?.addEventListener("click", () => {
    // Re-read the club: votes may have changed since the page was drawn
    const options = getClub(club.id).ballot.options;
    const leader = options.reduce((best, o) => (o.votes > best.votes ? o : best), options[0]);
    document.getElementById("close-area").innerHTML = `
      <p style="width:100%;margin:0">Close the vote now? <strong>${escapeHtml(leader.title)}</strong> wins with ${leader.votes} vote${leader.votes === 1 ? "" : "s"} and becomes the current book.</p>
      <button class="btn" id="confirm-close" type="button">Yes, close the vote</button>
      <button class="btn secondary" id="cancel-close" type="button">Keep voting</button>`;
    document.getElementById("confirm-close").addEventListener("click", () => {
      const winner = closeBallot(club.id);
      toast(`${winner.title} is the next read`);
      renderClub();
    });
    document.getElementById("cancel-close").addEventListener("click", renderClub);
  });
}

if (urlParam("created")) toast("Club created. Nominate a book to start the first vote.");
renderClub();

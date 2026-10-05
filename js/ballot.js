/* ==========================================================================
   ballot.js — the "vote on next month's book" block (user story #4)
   Used on both the Home page and the club page, so voting works the same
   way everywhere.
   ========================================================================== */

/* Draws the ballot for one club into `container`.
   `onChange` runs after a vote so the page can refresh anything else. */
function renderBallot(club, container, onChange) {
  const ballot = club.ballot;
  const member = isMember(club.id);
  const voted = myVote(club.id);
  const total = ballot.options.reduce((sum, o) => sum + o.votes, 0);

  if (!ballot.options.length) {
    container.innerHTML = `<div class="empty">No books on the ballot yet. Open any book and tap “Nominate for a club”.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="ballot">
      ${ballot.options.map((o) => {
        const pct = total ? Math.round((o.votes / total) * 100) : 0;
        const mine = o.id === voted;
        return `<button class="ballot-option" type="button" data-option="${escapeHtml(o.id)}"
                  aria-pressed="${mine}" ${member ? "" : "disabled"}
                  aria-label="${escapeHtml(o.title)} by ${escapeHtml(o.author)}, ${o.votes} vote${o.votes === 1 ? "" : "s"}${mine ? ", your vote" : ""}">
            ${coverTile(o, mine ? "Your vote" : "")}
            <div class="vote-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
            <p class="small muted" style="margin:6px 0 0">${o.votes} vote${o.votes === 1 ? "" : "s"}</p>
          </button>`;
      }).join("")}
    </div>
    <p class="small muted" style="margin:10px 0 0">${member
      ? (voted ? "Tap another book to change your vote." : "Tap a book to vote. One vote per member.")
      : "Join this club to vote."}</p>`;

  container.querySelectorAll("[data-option]").forEach((btn) =>
    btn.addEventListener("click", () => {
      castVote(club.id, btn.dataset.option);
      const choice = ballot.options.find((o) => o.id === btn.dataset.option);
      toast(`Voted for ${choice.title}`);
      const fresh = getClub(club.id);
      renderBallot(fresh, container, onChange);
      if (onChange) onChange(fresh);
    }));
}

/* "Closes Sun, Oct 5" */
function ballotClosesLabel(club) {
  return `Closes ${formatDate(club.ballot.closes)}`;
}

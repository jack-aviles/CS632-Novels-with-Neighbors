/* ==========================================================================
   clubs.js — Clubs tab
   #3 Create a book club (name, genre, size) and join clubs nearby.
   ========================================================================== */

const clubsBox = document.getElementById("clubs");
const createDialog = document.getElementById("create-dialog");
const createForm = document.getElementById("create-form");

function renderClubs() {
  const user = getUser();
  const mine = user ? getMyClubs() : [];
  // Compare by id: each read from storage creates new objects, so includes(c) would never match
  const others = getClubs().filter((c) => !isMember(c.id));

  clubsBox.innerHTML = `
    ${user ? `
      <section class="section" style="margin-top:8px" aria-labelledby="mine-title">
        <h2 id="mine-title">Your clubs</h2>
        ${mine.length ? `<div class="list">${mine.map(clubRow).join("")}</div>`
          : '<div class="empty">You haven\'t joined a club yet. Join one below or create your own.</div>'}
      </section>` : ""}

    <section class="section" aria-labelledby="near-title">
      <h2 id="near-title">Clubs near you</h2>
      ${others.length ? `<div class="list">${others.map(clubRow).join("")}</div>`
        : '<div class="empty">You\'re in every club nearby. Create a new one.</div>'}
    </section>`;

  clubsBox.querySelectorAll("[data-join]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.preventDefault(); // the button sits inside a link row
      if (!getUser()) { location.href = signUpLink(); return; }
      const result = joinClub(btn.dataset.join);
      const club = getClub(btn.dataset.join);
      if (result === "full") toast("Sorry, this club is full.", null, "danger");
      else toast(`You joined ${club.name}`, { href: `club.html?id=${encodeURIComponent(club.id)}`, label: "Open club" });
      renderClubs();
    }));
}

function clubRow(club) {
  const member = isMember(club.id);
  const full = club.members.length >= club.size;
  let action = "";
  if (!member) {
    action = full
      ? '<span class="pill full">Full</span>'
      : `<button class="btn small" type="button" data-join="${escapeHtml(club.id)}" aria-label="Join ${escapeHtml(club.name)}">Join</button>`;
  } else if (isOrganizer(club)) {
    action = '<span class="pill warn">Organizer</span>';
  }

  return `
    <a class="row club-row" href="club.html?id=${encodeURIComponent(club.id)}">
      <div>
        <h3>${escapeHtml(club.name)}</h3>
        <p class="small muted" style="margin:2px 0 6px">${escapeHtml(club.place)} · next ${formatDate(club.meetingDate)}</p>
        <span class="pill">${escapeHtml(club.genre)}</span>
        <span class="small ${full ? "full-text" : "muted"}">${club.members.length} of ${club.size} members${full ? " · Full" : ""}</span>
      </div>
      <div class="row-actions">${action}</div>
    </a>`;
}

/* ---------- Create a club ---------- */

document.getElementById("club-genre").innerHTML =
  '<option value="">Choose…</option>' + GENRES.map((g) => `<option>${g}</option>`).join("");

document.getElementById("create-btn").addEventListener("click", () => {
  if (!getUser()) { location.href = signUpLink(); return; }
  createForm.reset();
  createForm.querySelectorAll(".error-text").forEach((el) => (el.textContent = ""));
  document.getElementById("club-date").min = localDate();
  createDialog.showModal();
});

document.getElementById("cancel-create").addEventListener("click", () => createDialog.close());

createForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const v = (id) => document.getElementById(id).value.trim();
  const values = {
    name: v("club-name"),
    genre: v("club-genre"),
    size: Number(v("club-size")),
    place: v("club-place"),
    meetingDate: v("club-date"),
    meetingTime: v("club-time"),
    description: v("club-description"),
  };

  const nameTaken = getClubs().some((c) => c.name.toLowerCase() === values.name.toLowerCase());
  const errors = {
    "club-name": !values.name ? "Give your club a name." : nameTaken ? "A club with this name already exists." : "",
    "club-genre": values.genre ? "" : "Choose the genre your club will read.",
    "club-size": Number.isInteger(values.size) && values.size >= CLUB_SIZE_MIN && values.size <= CLUB_SIZE_MAX
      ? "" : `Choose between ${CLUB_SIZE_MIN} and ${CLUB_SIZE_MAX} members.`,
    "club-place": values.place ? "" : "Add where the club will meet.",
    "club-date": !values.meetingDate ? "Pick a date." : values.meetingDate < localDate() ? "Pick today or a later date." : "",
    "club-time": values.meetingTime ? "" : "Pick a time.",
  };
  for (const [id, message] of Object.entries(errors)) document.getElementById(`${id}-error`).textContent = message;
  const firstError = Object.keys(errors).find((id) => errors[id]);
  if (firstError) { document.getElementById(firstError).focus(); return; }

  const club = createClub(values);
  createDialog.close();
  location.href = `club.html?id=${encodeURIComponent(club.id)}&created=1`;
});

renderClubs();

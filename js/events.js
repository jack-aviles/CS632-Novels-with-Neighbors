/* ==========================================================================
   events.js — Events tab
   #8  browse local literature events (this week / all upcoming)
   #10 post an event to the board
   ========================================================================== */

const eventsBox = document.getElementById("events");
const postDialog = document.getElementById("post-dialog");
const postForm = document.getElementById("post-form");

function renderEvents() {
  const range = document.querySelector('input[name="range"]:checked').value;
  const weekEnd = daysFromToday(7);
  const events = getEvents().filter((e) => range === "all" || e.date <= weekEnd);

  eventsBox.innerHTML = events.length
    ? events.map((e) => `
        <article class="card event-card">
          <span class="event-date">${formatDate(e.date)} · ${formatTime(e.time)}</span>
          <h3>${escapeHtml(e.title)}</h3>
          <span class="muted small">${escapeHtml(e.place)}${e.distance ? " · " + escapeHtml(e.distance) : ""}</span>
          ${e.description ? `<p class="small" style="margin:4px 0 0">${escapeHtml(e.description)}</p>` : ""}
          <p class="small muted" style="margin:4px 0 0">Posted by ${escapeHtml(e.organizer)}${e.mine ? ' <span class="pill warn">You</span>' : ""}</p>
        </article>`).join("")
    : `<div class="empty">No events ${range === "week" ? "in the next 7 days" : "coming up"}. Be the first to post one.</div>`;
}

document.querySelectorAll('input[name="range"]').forEach((r) => r.addEventListener("change", renderEvents));

/* ---------- Post an event ---------- */

document.getElementById("post-btn").addEventListener("click", () => {
  if (!getUser()) { location.href = signUpLink(); return; }
  postForm.reset();
  postForm.querySelectorAll(".error-text").forEach((el) => (el.textContent = ""));
  document.getElementById("event-date").min = localDate();
  postDialog.showModal();
});

document.getElementById("cancel-post").addEventListener("click", () => postDialog.close());

postForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const v = (id) => document.getElementById(id).value.trim();
  const values = {
    title: v("event-title"),
    date: v("event-date"),
    time: v("event-time"),
    place: v("event-place"),
    description: v("event-description"),
  };

  const errors = {
    "event-title": values.title ? "" : "Give your event a name.",
    "event-date": !values.date ? "Pick a date." : values.date < localDate() ? "Pick today or a later date." : "",
    "event-time": values.time ? "" : "Pick a start time.",
    "event-place": values.place ? "" : "Add where it's happening.",
  };
  for (const [id, message] of Object.entries(errors)) document.getElementById(`${id}-error`).textContent = message;
  const firstError = Object.keys(errors).find((id) => errors[id]);
  if (firstError) { document.getElementById(firstError).focus(); return; }

  postEvent(values);
  postDialog.close();
  // Show all upcoming events so the new one is visible even if it's weeks away
  document.querySelector('input[name="range"][value="all"]').checked = true;
  renderEvents();
  toast("Event posted to the board");
});

renderEvents();

/* ==========================================================================
   ui.js — small helpers shared by every page
   - renderNav(): draws the 5-tab navigation and highlights the current page
   - coverTile(): draws a colored "book cover" tile for any book
   - escapeHtml(): makes text safe before putting it on the page
   - greeting(): "Morning / Afternoon / Evening" based on the clock
   ========================================================================== */

const NAV_ITEMS = [
  { href: "index.html",   label: "Home",    icon: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>' },
  { href: "clubs.html",   label: "Clubs",   icon: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M15 14.6c2.8-.3 5 1.3 6 4.4"/>',
    also: ["club.html"] },
  { href: "books.html",   label: "Books",   icon: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H11v17H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M13 3h5.5A1.5 1.5 0 0 1 20 4.5v14a1.5 1.5 0 0 1-1.5 1.5H13z"/>',
    also: ["search.html", "book.html"] }, // search and book pages live under the Books tab
  { href: "events.html",  label: "Events",  icon: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>' },
  { href: "profile.html", label: "Profile", icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>' },
];

function renderNav() {
  const current = location.pathname.split("/").pop() || "index.html";
  const links = NAV_ITEMS.map((item) => {
    const isCurrent = item.href === current || (item.also || []).includes(current);
    const active = isCurrent ? ' aria-current="page"' : "";
    return `<li><a href="${item.href}"${active}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${item.icon}</svg>
      <span>${item.label}</span></a></li>`;
  }).join("");

  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Main");
  nav.innerHTML = `<ul>${links}</ul>`;
  document.body.appendChild(nav);
}

/* Escape characters that could be read as HTML (protects against broken
   layouts or injected code when showing user- or API-provided text). */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Pick one of six cover colors from the title, so the same book
   always gets the same color everywhere on the site. */
function coverColor(title) {
  let sum = 0;
  for (const ch of String(title)) sum += ch.charCodeAt(0);
  return "c" + ((sum % 6) + 1);
}

/* Short author label for the bottom of a tile, e.g. "Virginia Woolf" -> "V. Woolf" */
function shortAuthor(author) {
  const parts = String(author || "").trim().split(/\s+/);
  if (parts.length < 2) return author || "";
  return parts[0][0] + ". " + parts[parts.length - 1];
}

/* Draw a cover tile. If the book has a real cover image URL we show it,
   otherwise a typographic tile in the mockup's style. */
function coverTile(book, extraLabel = "") {
  const title = escapeHtml(book.title);
  const author = escapeHtml(shortAuthor(book.author));
  const label = extraLabel ? ` · ${escapeHtml(extraLabel)}` : "";
  const img = book.coverUrl
    ? `<img src="${escapeHtml(book.coverUrl)}" alt="" loading="lazy" onerror="this.remove()">`
    : "";
  const initial = escapeHtml(String(book.title || "?").replace(/^(the|a|an)\s+/i, "").charAt(0).toUpperCase());
  return `<div class="cover ${coverColor(book.title)}" data-initial="${initial}">
      <span class="cover-title">${title}</span>
      <span class="cover-author">${author}${label}</span>
      ${img}
    </div>`;
}

function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

/* Format a date like "Thu, Oct 15" */
function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/* Format "19:00" as "7 PM" / "18:30" as "6:30 PM" */
function formatTime(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = ((h + 11) % 12) + 1;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

document.addEventListener("DOMContentLoaded", renderNav);

/* Show a short message at the bottom of the screen.
   Pass a link to make it tappable, e.g.
   toast("You joined Riverside Readers", { href: "club.html?id=riverside-readers", label: "Open club" })
   Pass tone "danger" for problems, e.g. toast("Sorry, this club is full.", null, "danger") */
function toast(message, link, tone) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement(link ? "a" : "div");
  el.className = (link ? "toast toast-link" : "toast") + (tone === "danger" ? " toast-danger" : "");
  el.setAttribute("role", "status");
  if (link) {
    el.href = link.href;
    el.innerHTML = `<span>${escapeHtml(message)}</span><span class="toast-action">${escapeHtml(link.label)} ›</span>`;
  } else {
    el.textContent = message;
  }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), link ? 3000 : 2600); // tappable messages stay a little longer
}

/* 4.5 -> "★★★★½" */
function stars(rating) {
  if (!rating) return "";
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? "½" : "";
  return "★".repeat(full) + half;
}

/* Read a value from the page address, e.g. book.html?id=ol:OL1W -> "ol:OL1W" */
function urlParam(name) {
  return new URLSearchParams(location.search).get(name);
}

/* Link to sign-up that brings the user back to this page afterwards */
function signUpLink() {
  const here = location.pathname.split("/").pop() + location.search;
  return "signup.html?next=" + encodeURIComponent(here);
}

/* One event, as shown on Home and on the Events tab */
function eventCard(e) {
  return `<article class="card event-card">
    <span class="event-date">${formatDate(e.date)} · ${formatTime(e.time)}</span>
    <h3>${escapeHtml(e.title)}</h3>
    <span class="muted small">${escapeHtml(e.place)}${e.distance ? " · " + escapeHtml(e.distance) : ""}</span>
  </article>`;
}

/* "Riverside Readers" -> "Riverside Readers'", "Porch Club" -> "Porch Club's" */
function possessive(name) {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

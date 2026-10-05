"""Writes the shared <head> and scripts around each page's main content.
Run: python3 tools/build_pages.py   (only needed when the page shells change)"""
HEAD = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <main id="main" class="wrap">
{body}
  </main>
{scripts}
</body>
</html>
'''
import pathlib, textwrap
pages = {}

pages["search"] = ("Search", '''
    <p><a href="books.html" class="small">← Books</a></p>
    <header class="page-header">
      <div>
        <p class="eyebrow">Novels with Neighbors</p>
        <h1>Find a book</h1>
      </div>
    </header>

    <form id="search-form" class="search-bar" role="search" novalidate>
      <label class="visually-hidden" for="field">Search by</label>
      <select id="field" name="field">
        <option value="title">Title</option>
        <option value="author">Author</option>
        <option value="genre">Genre</option>
        <option value="keyword">Keyword</option>
      </select>
      <label class="visually-hidden" for="query">Search for</label>
      <input id="query" name="query" type="search" placeholder="e.g. Middlemarch" autocomplete="off">
      <button class="btn" type="submit">Search</button>
    </form>
    <p id="search-error" class="error-text" role="alert"></p>

    <div id="search-status" class="search-status" aria-live="polite"></div>
    <div id="results" class="list"></div>
''', ["api.js", "../data/fallback-books.js", "store.js", "search.js"])

pages["books"] = ("Books", '''
    <header class="page-header">
      <div>
        <p class="eyebrow">Novels with Neighbors</p>
        <h1>Books</h1>
      </div>
    </header>

    <a class="search-entry" href="search.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <span>Search title, author or genre…</span>
    </a>

    <div id="books"></div>
''', ["api.js", "../data/fallback-books.js", "store.js", "recommend.js", "books.js"])

pages["book"] = ("Book", '''
    <p><a href="search.html" class="small" id="back-link">← Back to search</a></p>
    <div id="book" aria-live="polite"><p class="loading">Loading book…</p></div>

    <dialog id="read-dialog" aria-labelledby="read-title">
      <form id="read-form" method="dialog" novalidate>
        <h2 id="read-title">Mark as read</h2>
        <fieldset class="field" style="border:0;padding:0;margin:0 0 16px">
          <legend class="label-like">Your rating</legend>
          <div class="chips" id="rating-options"></div>
          <p id="rating-error" class="error-text"></p>
        </fieldset>
        <div class="field">
          <label for="review-text">Review (optional)</label>
          <textarea id="review-text" maxlength="500" placeholder="What did you think?"></textarea>
        </div>
        <div class="actions">
          <button class="btn" type="submit" value="save">Save</button>
          <button class="btn secondary" type="button" id="cancel-read">Cancel</button>
        </div>
      </form>
    </dialog>
''', ["api.js", "../data/fallback-books.js", "store.js", "book.js"])

pages["signup"] = ("Sign up", '''
    <header class="page-header">
      <div>
        <p class="eyebrow">Novels with Neighbors</p>
        <h1>Join your neighbors</h1>
      </div>
    </header>
    <p class="muted">Create your reader profile to save books, join clubs and get suggestions.</p>

    <form id="signup-form" class="card" novalidate>
      <div class="field-row">
        <div class="field">
          <label for="name">First name</label>
          <input id="name" name="name" autocomplete="given-name" required>
          <p class="error-text" id="name-error"></p>
        </div>
        <div class="field">
          <label for="lastName">Last name <span class="muted">(optional)</span></label>
          <input id="lastName" name="lastName" autocomplete="family-name">
        </div>
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required>
        <p class="error-text" id="email-error"></p>
      </div>
      <div class="field">
        <label for="neighborhood">Neighborhood or ZIP code</label>
        <input id="neighborhood" name="neighborhood" autocomplete="postal-code" required>
        <p class="error-text" id="neighborhood-error"></p>
      </div>
      <fieldset class="field" style="border:0;padding:0;margin:0 0 16px">
        <legend class="label-like">Genres you enjoy (pick at least one)</legend>
        <div class="chips" id="genre-options"></div>
        <p class="error-text" id="genres-error"></p>
      </fieldset>
      <button class="btn" type="submit">Create profile</button>
      <p class="small muted" style="margin-top:12px">Prototype note: your profile is saved on this device only.</p>
    </form>
''', ["store.js", "signup.js"])

pages["profile"] = ("Profile", '''
    <header class="page-header">
      <div>
        <p class="eyebrow">Novels with Neighbors</p>
        <h1 id="profile-name">Your profile</h1>
      </div>
    </header>
    <div id="profile"></div>
''', ["store.js", "profile.js"])

pages["index"] = ("Home", """
    <header class="page-header">
      <div>
        <p class="eyebrow">Novels with Neighbors</p>
        <h1 id="greeting">Welcome</h1>
      </div>
    </header>
    <div id="home"></div>
""", ["api.js", "../data/fallback-books.js", "store.js", "recommend.js", "ballot.js", "home.js"])

pages["clubs"] = ("Clubs", """
    <header class="page-header">
      <div>
        <p class="eyebrow">Novels with Neighbors</p>
        <h1>Clubs</h1>
      </div>
      <button class="btn small" id="create-btn" type="button">+ Create a club</button>
    </header>
    <div id="clubs"></div>

    <dialog id="create-dialog" aria-labelledby="create-title">
      <form id="create-form" novalidate>
        <h2 id="create-title">Create a book club</h2>
        <div class="field">
          <label for="club-name">Club name</label>
          <input id="club-name" maxlength="40" required>
          <p class="error-text" id="club-name-error"></p>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="club-genre">Genre</label>
            <select id="club-genre" required></select>
            <p class="error-text" id="club-genre-error"></p>
          </div>
          <div class="field">
            <label for="club-size">Max members</label>
            <input id="club-size" type="number" inputmode="numeric" min="3" max="30" value="10" required>
            <p class="error-text" id="club-size-error"></p>
          </div>
        </div>
        <div class="field">
          <label for="club-place">Where you'll meet</label>
          <input id="club-place" placeholder="e.g. Maple Street Library" required>
          <p class="error-text" id="club-place-error"></p>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="club-date">First meeting</label>
            <input id="club-date" type="date" required>
            <p class="error-text" id="club-date-error"></p>
          </div>
          <div class="field">
            <label for="club-time">Time</label>
            <input id="club-time" type="time" value="19:00" required>
            <p class="error-text" id="club-time-error"></p>
          </div>
        </div>
        <div class="field">
          <label for="club-description">Short description <span class="muted">(optional)</span></label>
          <textarea id="club-description" maxlength="200"></textarea>
        </div>
        <div class="actions">
          <button class="btn" type="submit">Create club</button>
          <button class="btn secondary" type="button" id="cancel-create">Cancel</button>
        </div>
      </form>
    </dialog>
""", ["store.js", "clubs.js"])

pages["club"] = ("Club", """
    <p><a href="clubs.html" class="small">← Clubs</a></p>
    <div id="club"><p class="loading">Loading club…</p></div>
""", ["store.js", "ballot.js", "club.js"])

pages["events"] = ("Events", """
    <header class="page-header">
      <div>
        <p class="eyebrow">Novels with Neighbors</p>
        <h1>Events nearby</h1>
      </div>
      <button class="btn small" id="post-btn" type="button">+ Post an event</button>
    </header>
    <div class="chips" role="group" aria-label="Show events">
      <label class="chip"><input type="radio" name="range" value="week" checked><span>This week</span></label>
      <label class="chip"><input type="radio" name="range" value="all"><span>All upcoming</span></label>
    </div>
    <div id="events" class="list" style="margin-top:16px"></div>

    <dialog id="post-dialog" aria-labelledby="post-title">
      <form id="post-form" novalidate>
        <h2 id="post-title">Post an event</h2>
        <div class="field">
          <label for="event-title">Event name</label>
          <input id="event-title" maxlength="60" required>
          <p class="error-text" id="event-title-error"></p>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="event-date">Date</label>
            <input id="event-date" type="date" required>
            <p class="error-text" id="event-date-error"></p>
          </div>
          <div class="field">
            <label for="event-time">Time</label>
            <input id="event-time" type="time" required>
            <p class="error-text" id="event-time-error"></p>
          </div>
        </div>
        <div class="field">
          <label for="event-place">Location</label>
          <input id="event-place" required>
          <p class="error-text" id="event-place-error"></p>
        </div>
        <div class="field">
          <label for="event-description">Details <span class="muted">(optional)</span></label>
          <textarea id="event-description" maxlength="300"></textarea>
        </div>
        <div class="actions">
          <button class="btn" type="submit">Post event</button>
          <button class="btn secondary" type="button" id="cancel-post">Cancel</button>
        </div>
      </form>
    </dialog>
""", ["store.js", "events.js"])

for slug, (title, body, scripts) in pages.items():
    tags = ['  <script src="js/ui.js"></script>'] + [
        f'  <script src="{"data/" + s[8:] if s.startswith("../data/") else "js/" + s}"></script>' for s in scripts]
    page_title = "Novels with Neighbors" if slug == "index" else f"{title} · Novels with Neighbors"
    pathlib.Path(f"{slug}.html").write_text(HEAD.format(title=page_title, body=body.strip("\n"), scripts="\n".join(tags)))
print("wrote", ", ".join(p + ".html" for p in pages))

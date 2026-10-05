/* ==========================================================================
   api.js — finding books
   Main source:   Open Library (free, no key)      https://openlibrary.org/developers/api
   Backup 1:      Google Books (free, no key)      used if Open Library fails or is slow
   Backup 2:      Built-in list of books (data/fallback-books.js), used offline
   This order comes straight from our risk register ("Open Library's
   performance risk" → fall back to Google Books, then a local dataset).

   Every function returns books in ONE common shape, so the pages never
   need to know which source answered:
   { id, title, author, year, coverUrl, subjects[], description, rating, ratingCount, source }
   ========================================================================== */

const SEARCH_TARGET_MS = 3000; // Requirement: results in 3 seconds or less
const REQUEST_TIMEOUT_MS = 4000; // give up on a source after this long and try the next one

const SOURCE_NAMES = { ol: "Open Library", gb: "Google Books (backup)", local: "Offline library (backup)" };

/* fetch() with a time limit, so a slow source doesn't freeze the page */
async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- Search (user story #1) ---------- */

/* field is one of: "title", "author", "genre", "keyword" */
async function searchBooks(query, field) {
  const started = performance.now();
  const sources = [searchOpenLibrary, searchGoogleBooks, searchLocal];
  let results = [];
  let source = "local";

  for (const search of sources) {
    try {
      results = await search(query, field);
      source = search === searchOpenLibrary ? "ol" : search === searchGoogleBooks ? "gb" : "local";
      break; // first source that answers wins
    } catch (err) {
      console.warn(`${search.name} failed, trying next source:`, err.message);
    }
  }

  const ms = Math.round(performance.now() - started);
  return { results, source, sourceName: SOURCE_NAMES[source], ms, withinTarget: ms <= SEARCH_TARGET_MS };
}

async function searchOpenLibrary(query, field) {
  const param = { title: "title", author: "author", genre: "subject", keyword: "q" }[field] || "q";
  const fields = "key,title,author_name,first_publish_year,cover_i,subject,ratings_average,ratings_count";
  const url = `https://openlibrary.org/search.json?${param}=${encodeURIComponent(query)}&fields=${fields}&limit=20`;
  const data = await fetchJson(url);
  return (data.docs || []).map(fromOpenLibrarySearch);
}

function fromOpenLibrarySearch(doc) {
  return {
    id: "ol:" + doc.key.replace("/works/", ""),
    title: doc.title,
    author: (doc.author_name || ["Unknown author"])[0],
    year: doc.first_publish_year || "",
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "",
    subjects: (doc.subject || []).slice(0, 8),
    rating: doc.ratings_average ? Number(doc.ratings_average.toFixed(1)) : null,
    ratingCount: doc.ratings_count || 0,
    description: "",
    source: "ol",
  };
}

async function searchGoogleBooks(query, field) {
  const prefix = { title: "intitle:", author: "inauthor:", genre: "subject:", keyword: "" }[field] || "";
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(prefix + query)}&maxResults=20`;
  const data = await fetchJson(url);
  return (data.items || []).map(fromGoogleBooks);
}

function fromGoogleBooks(item) {
  const v = item.volumeInfo || {};
  return {
    id: "gb:" + item.id,
    title: v.title || "Untitled",
    author: (v.authors || ["Unknown author"])[0],
    year: (v.publishedDate || "").slice(0, 4),
    coverUrl: v.imageLinks?.thumbnail ? v.imageLinks.thumbnail.replace("http://", "https://") : "",
    subjects: v.categories || [],
    rating: v.averageRating || null,
    ratingCount: v.ratingsCount || 0,
    description: stripHtml(v.description || ""),
    source: "gb",
  };
}

/* ---------- Offline search: forgiving word matching ----------
   Does not need an exact match. The query is split into words, filler words
   ("the", "of"…) are dropped, and each remaining word counts as a hit if it:
     - matches a word in the book exactly ("rings" = "rings"),
     - is the start of a word ("tolk" -> "tolkien"), or
     - is one typo away for longer words ("tolkein" -> "tolkien").
   Books matching at least half of the words are returned, best match first. */

const STOP_WORDS = new Set(["the", "a", "an", "of", "and", "in", "on", "to", "for", "by", "with"]);

function normalizeWords(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // Brontë -> bronte
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/* True if a and b are at most one typo apart: one letter added, removed,
   changed, or two neighboring letters swapped ("tolkein" vs "tolkien").
   Uses the standard "edit distance" table (optimal string alignment). */
function oneTypoApart(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // swapped neighbors
      }
    }
  }
  return d[a.length][b.length] <= 1;
}

function wordMatches(queryWord, bookWords) {
  return bookWords.some((w) =>
    w === queryWord ||
    (queryWord.length >= 3 && w.startsWith(queryWord)) ||
    (queryWord.length >= 5 && oneTypoApart(queryWord, w)));
}

async function searchLocal(query, field) {
  let queryWords = normalizeWords(query).filter((w) => !STOP_WORDS.has(w));
  if (queryWords.length === 0) queryWords = normalizeWords(query); // e.g. a search for just "the"

  const scored = FALLBACK_BOOKS.map((b) => {
    const text = {
      title: b.title,
      author: b.author,
      genre: b.subjects.join(" "),
      keyword: [b.title, b.author, b.subjects.join(" "), b.description].join(" "),
    }[field] || b.title;
    const bookWords = normalizeWords(text);
    const hits = queryWords.filter((q) => wordMatches(q, bookWords)).length;
    return { book: b, score: hits / queryWords.length };
  });

  return scored
    .filter((s) => s.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .map((s) => fromLocal(s.book));
}

function fromLocal(b) {
  return { ...b, id: "local:" + b.slug, coverUrl: "", rating: null, ratingCount: 0, source: "local" };
}

/* ---------- Book details (user story #13) ---------- */

/* id looks like "ol:OL45883W", "gb:abc123" or "local:middlemarch" */
async function getBook(id) {
  const [source, key] = id.split(":");
  if (source === "ol") return getOpenLibraryBook(key);
  if (source === "gb") return fromGoogleBooks(await fetchJson(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(key)}`));
  const local = FALLBACK_BOOKS.find((b) => b.slug === key);
  if (!local) throw new Error("Book not found");
  return fromLocal(local);
}

async function getOpenLibraryBook(workId) {
  const work = await fetchJson(`https://openlibrary.org/works/${workId}.json`);

  // Author name and ratings live at separate addresses; ask for both at once.
  const authorKey = work.authors?.[0]?.author?.key;
  const [author, ratings] = await Promise.all([
    authorKey ? fetchJson(`https://openlibrary.org${authorKey}.json`).catch(() => null) : null,
    fetchJson(`https://openlibrary.org/works/${workId}/ratings.json`).catch(() => null),
  ]);

  const description = typeof work.description === "string" ? work.description : work.description?.value || "";
  return {
    id: "ol:" + workId,
    title: work.title,
    author: author?.name || "Unknown author",
    year: (work.first_publish_date || "").match(/\d{4}/)?.[0] || "",
    coverUrl: work.covers?.[0] > 0 ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg` : "",
    subjects: (work.subjects || []).slice(0, 8),
    description: cleanDescription(description),
    rating: ratings?.summary?.average ? Number(ratings.summary.average.toFixed(1)) : null,
    ratingCount: ratings?.summary?.count || 0,
    source: "ol",
  };
}

/* Open Library descriptions sometimes include markdown links and source notes */
function cleanDescription(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [label](url) -> label
    .split(/\n-{3,}|\r?\n\s*\(?\[?source/i)[0]
    .trim();
}

/* Google Books descriptions contain HTML tags. DOMParser reads them as text
   without running any scripts or loading images. */
function stripHtml(html) {
  return new DOMParser().parseFromString(html, "text/html").body.textContent || "";
}

/* ==========================================================================
   recommend.js — "Suggested for you" (user story #9)
   Rule-based suggestion engine (agreed MVP decision: no paid AI API).

   How it works, in plain terms:
   1. Build a "taste profile": every genre gets points.
        +1 for each genre the reader picked at sign-up
        +2 for each genre of a book they rated 4 stars or higher
   2. Take the reader's top 3 genres and ask Open Library for the
      best-rated books in each (built-in list if Open Library is down).
   3. Drop books they've already read or saved.
   4. Rank by genre points, mix the genres so the shelf isn't all one kind,
      and attach the reason, e.g. "Because you loved Middlemarch".
   ========================================================================== */

/* Words that link messy library subjects ("Detective and mystery stories")
   to our app's genre names ("Mystery"). */
const GENRE_KEYWORDS = {
  "Classics": ["classic"],
  "Literary Fiction": ["literary", "literature"],
  "Mystery": ["mystery", "detective"],
  "Thriller": ["thriller", "suspense"],
  "Science Fiction": ["science fiction", "sci-fi", "dystopia"],
  "Fantasy": ["fantasy", "magic"],
  "Romance": ["romance", "love stories"],
  "Historical Fiction": ["historical"],
  "Horror": ["horror", "ghost"],
  "Nonfiction": ["nonfiction", "non-fiction", "essays"],
  "Biography": ["biography", "memoir", "autobiography"],
  "Poetry": ["poetry", "poems"],
};

function genresOf(subjects) {
  const text = (subjects || []).join(" | ").toLowerCase();
  return GENRES.filter((g) => GENRE_KEYWORDS[g].some((k) => text.includes(k)));
}

/* Step 1: points per genre, plus the best "because" reason for each */
function buildTasteProfile(user, history) {
  const profile = {}; // genre -> { points, reason }
  for (const g of user.genres) {
    profile[g] = { points: 1, reason: `Because you like ${g}` };
  }
  for (const book of history) {
    if (book.rating < 4) continue;
    for (const g of genresOf(book.subjects)) {
      const entry = profile[g] || { points: 0, reason: "" };
      entry.points += 2;
      entry.reason = `Because you loved ${book.title}`; // a book they loved is the strongest reason
      profile[g] = entry;
    }
  }
  return profile;
}

/* Step 2: candidate books for one genre */
async function booksForGenre(genre) {
  try {
    const url = `https://openlibrary.org/search.json?subject=${encodeURIComponent(genre.toLowerCase())}` +
      `&sort=rating&fields=key,title,author_name,first_publish_year,cover_i,subject,ratings_average,ratings_count&limit=12`;
    const data = await fetchJson(url);
    const books = (data.docs || []).map(fromOpenLibrarySearch);
    if (books.length) return books;
    throw new Error("no results");
  } catch (err) {
    return FALLBACK_BOOKS.filter((b) => b.subjects.includes(genre)).map(fromLocal);
  }
}

async function getSuggestions(limit = 8) {
  const user = getUser();
  if (!user) return [];
  const history = getHistory();
  const saved = getWantToRead();

  const profile = buildTasteProfile(user, history);
  const topGenres = Object.entries(profile)
    .sort((a, b) => b[1].points - a[1].points)
    .slice(0, 3)
    .map(([genre]) => genre);

  // Ask for all genres at the same time (faster than one after another)
  const lists = await Promise.all(topGenres.map(booksForGenre));

  // Step 3: skip anything already read or saved (matched by id and by title)
  const seen = new Set([...history, ...saved].flatMap((b) => [b.id, bookKey(b.title)]));

  // Step 4: take turns between genres so the shelf is varied; strongest genre first
  const picks = [];
  for (let i = 0; picks.length < limit && lists.some((l) => i < l.length); i++) {
    lists.forEach((list, g) => {
      const book = list[i];
      if (!book || picks.length >= limit) return;
      if (seen.has(book.id) || seen.has(bookKey(book.title))) return;
      seen.add(book.id);
      seen.add(bookKey(book.title));
      picks.push({ ...book, reason: profile[topGenres[g]].reason });
    });
  }
  return picks;
}

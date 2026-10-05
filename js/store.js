/* ==========================================================================
   store.js — everything the app saves, in one place
   Data is kept in the browser's localStorage (agreed MVP decision: no server).
   That means each device has its own data and nothing is shared between users.
   If localStorage is blocked (private browsing, some previews), the app keeps
   working with in-memory data for that visit.
   ========================================================================== */

const STORE_KEY = "nwn-data-v1";
const WANT_TO_READ_LIMIT = 50; // User story #18: list is capped at 50 titles

const GENRES = [
  "Classics", "Literary Fiction", "Mystery", "Thriller", "Science Fiction", "Fantasy",
  "Romance", "Historical Fiction", "Horror", "Nonfiction", "Biography", "Poetry",
];

/* "2026-10-07" style date, n days from today. Sample dates are calculated
   from today so the demo always shows upcoming meetings and events. */
function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localDate(d);
}

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* The month after this one, e.g. "November" — what the club ballot is choosing */
function nextMonthName() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  return d.toLocaleDateString("en-US", { month: "long" });
}

/* Starting data for a brand-new device. Neighbor reviews, clubs and events are
   sample content so the app is not empty during the demo. */
function defaultState() {
  return {
    user: null,
    wantToRead: [],
    history: [],
    myClubIds: [],   // clubs the reader has joined or created
    myVotes: {},     // clubId -> the ballot option the reader voted for
    clubs: sampleClubs(),
    events: sampleEvents(),
    reviews: [
      { bookKey: "the great gatsby", name: "Priya", rating: 4.5, text: "Read it in one sitting on the porch. The last page still gets me.", date: "2026-09-28" },
      { bookKey: "frankenstein", name: "Marcus", rating: 4, text: "Much sadder than the movies. The creature is the most human character in it.", date: "2026-09-20" },
      { bookKey: "mrs dalloway", name: "Dana", rating: 3, text: "Beautiful sentences, but I needed the club discussion to follow it.", date: "2026-09-14" },
      { bookKey: "middlemarch", name: "Leo", rating: 5, text: "Long, but every chapter earns it. Dorothea stays with you.", date: "2026-09-02" },
    ],
  };
}

let memoryCopy = null; // used when localStorage is unavailable

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    // Spread over the defaults so data saved by an older version of the app
    // still gets any newer sections (e.g. clubs added in Prototype 3).
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch (e) { /* storage blocked or corrupted: fall through */ }
  if (!memoryCopy) memoryCopy = defaultState();
  return memoryCopy;
}

function saveState(state) {
  memoryCopy = state;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* in-memory only */ }
}

/* ---------- Helpers ---------- */

/* Reviews are matched by title so a review written on one data source
   (e.g. Open Library) still shows if the book was opened from another. */
function bookKey(title) {
  return String(title || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

/* Keep only what we need to show a book in a list */
function bookSnapshot(book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl || "",
    subjects: (book.subjects || []).slice(0, 8),
  };
}

/* ---------- User (stories #16 and #2) ---------- */

function getUser() { return loadState().user; }

function createUser({ name, lastName = "", email, neighborhood, genres }) {
  const state = loadState();
  state.user = { name, lastName, email, neighborhood, genres, createdAt: new Date().toISOString() };
  saveState(state);
  return state.user;
}

function updateUser(changes) {
  const state = loadState();
  state.user = { ...state.user, ...changes };
  saveState(state);
  return state.user;
}

/* ---------- Want-to-read list (story #18) ---------- */

function getWantToRead() { return loadState().wantToRead; }

function isOnWantToRead(id) { return loadState().wantToRead.some((b) => b.id === id); }

/* Returns "added", "exists", or "full" so the page can show the right message */
function addToWantToRead(book) {
  const state = loadState();
  if (state.wantToRead.some((b) => b.id === book.id)) return "exists";
  if (state.wantToRead.length >= WANT_TO_READ_LIMIT) return "full";
  state.wantToRead.push({ ...bookSnapshot(book), addedOn: new Date().toISOString().slice(0, 10) });
  saveState(state);
  return "added";
}

function removeFromWantToRead(id) {
  const state = loadState();
  state.wantToRead = state.wantToRead.filter((b) => b.id !== id);
  saveState(state);
}

/* ---------- Reading history + reviews (stories #2 and #13) ---------- */

function getHistory() { return loadState().history; }

function getHistoryEntry(id) { return loadState().history.find((b) => b.id === id); }

/* Mark a book as read: adds it to history (or updates the rating),
   removes it from want-to-read, and saves the review if one was written. */
function markAsRead(book, rating, reviewText) {
  const state = loadState();
  const entry = { ...bookSnapshot(book), rating, finishedOn: new Date().toISOString().slice(0, 10) };
  state.history = state.history.filter((b) => b.id !== book.id);
  state.history.unshift(entry);
  state.wantToRead = state.wantToRead.filter((b) => b.id !== book.id);

  const key = bookKey(book.title);
  state.reviews = state.reviews.filter((r) => !(r.bookKey === key && r.mine));
  state.reviews.unshift({ bookKey: key, name: state.user.name, rating, text: reviewText, date: entry.finishedOn, mine: true });

  saveState(state);
}

function getReviews(title) {
  const key = bookKey(title);
  return loadState().reviews.filter((r) => r.bookKey === key);
}

/* ==========================================================================
   Clubs and voting (user stories #3 and #4)
   ========================================================================== */

const CLUB_SIZE_MIN = 3;
const CLUB_SIZE_MAX = 30;
const BALLOT_MAX_OPTIONS = 5;

function sampleClubs() {
  return [
    {
      id: "riverside-readers", name: "Riverside Readers", genre: "Classics", size: 12, organizer: "Priya",
      description: "Slow reads of big classics, one a month, with coffee.",
      place: "Maple Street Library", meetingDate: daysFromToday(5), meetingTime: "19:00",
      members: ["Priya", "Marcus", "Dana", "Leo", "Ana", "Sam", "Grace", "Tom"],
      currentBook: { id: "local:middlemarch", title: "Middlemarch", author: "George Eliot" },
      ballot: {
        month: nextMonthName(), closes: daysFromToday(3),
        options: [
          { id: "o1", bookId: "local:mrs-dalloway", title: "Mrs Dalloway", author: "Virginia Woolf", votes: 3, nominatedBy: "Dana" },
          { id: "o2", bookId: "local:passing", title: "Passing", author: "Nella Larsen", votes: 3, nominatedBy: "Leo" },
          { id: "o3", bookId: "local:house-of-mirth", title: "The House of Mirth", author: "Edith Wharton", votes: 2, nominatedBy: "Priya" },
        ],
      },
    },
    {
      id: "mystery-mondays", name: "Mystery Mondays", genre: "Mystery", size: 8, organizer: "Marcus",
      description: "Whodunits and thrillers. Guess the culprit before the last chapter.",
      place: "Pages & Co.", meetingDate: daysFromToday(9), meetingTime: "18:30",
      members: ["Marcus", "Ana", "Leo", "Kim", "Jo"],
      currentBook: { id: "local:and-then-there-were-none", title: "And Then There Were None", author: "Agatha Christie" },
      ballot: {
        month: nextMonthName(), closes: daysFromToday(6),
        options: [
          { id: "o1", bookId: "local:rebecca", title: "Rebecca", author: "Daphne du Maurier", votes: 2, nominatedBy: "Kim" },
          { id: "o2", bookId: "local:gone-girl", title: "Gone Girl", author: "Gillian Flynn", votes: 1, nominatedBy: "Jo" },
        ],
      },
    },
    {
      id: "campus-sci-fi", name: "Campus Sci-Fi Circle", genre: "Science Fiction", size: 6, organizer: "Kim",
      description: "Students and neighbors reading science fiction old and new.",
      place: "University Library, Room 204", meetingDate: daysFromToday(12), meetingTime: "17:00",
      members: ["Kim", "Raj", "Lena", "Omar", "Bea", "Chris"], // full: shows the size limit
      currentBook: { id: "local:kindred", title: "Kindred", author: "Octavia E. Butler" },
      ballot: { month: nextMonthName(), closes: daysFromToday(8), options: [] },
    },
  ];
}

function getClubs() { return loadState().clubs; }
function getClub(id) { return loadState().clubs.find((c) => c.id === id); }
function isMember(clubId) { return loadState().myClubIds.includes(clubId); }
function getMyClubs() {
  const state = loadState();
  return state.clubs.filter((c) => state.myClubIds.includes(c.id));
}

/* Returns "joined", "already", or "full" */
function joinClub(clubId) {
  const state = loadState();
  const club = state.clubs.find((c) => c.id === clubId);
  if (state.myClubIds.includes(clubId)) return "already";
  if (club.members.length >= club.size) return "full";
  club.members.push(state.user.name);
  state.myClubIds.push(clubId);
  saveState(state);
  return "joined";
}

function createClub({ name, genre, size, place, meetingDate, meetingTime, description }) {
  const state = loadState();
  const club = {
    id: "club-" + Date.now(),
    name, genre, size, place, meetingDate, meetingTime, description,
    organizer: state.user.name,
    members: [state.user.name],
    currentBook: null,
    ballot: { month: nextMonthName(), closes: daysFromToday(7), options: [] },
  };
  state.clubs.unshift(club);
  state.myClubIds.push(club.id);
  saveState(state);
  return club;
}

function isOrganizer(club) {
  const user = getUser();
  return Boolean(user && club.organizer === user.name && isMember(club.id));
}

/* Add a book to a club's ballot. Returns "added", "exists", "full" or "not-member" */
function nominateBook(clubId, book) {
  const state = loadState();
  const club = state.clubs.find((c) => c.id === clubId);
  if (!state.myClubIds.includes(clubId)) return "not-member";
  const options = club.ballot.options;
  if (options.some((o) => bookKey(o.title) === bookKey(book.title))) return "exists";
  if (options.length >= BALLOT_MAX_OPTIONS) return "full";
  options.push({ id: "o" + Date.now(), bookId: book.id, title: book.title, author: book.author, votes: 0, nominatedBy: state.user.name });
  saveState(state);
  return "added";
}

/* One vote per member. Voting again moves the vote. */
function castVote(clubId, optionId) {
  const state = loadState();
  const club = state.clubs.find((c) => c.id === clubId);
  const previous = state.myVotes[clubId];
  if (previous === optionId) return;
  const old = club.ballot.options.find((o) => o.id === previous);
  if (old) old.votes -= 1;
  club.ballot.options.find((o) => o.id === optionId).votes += 1;
  state.myVotes[clubId] = optionId;
  saveState(state);
}

function myVote(clubId) { return loadState().myVotes[clubId]; }

/* Organizer only: the option with the most votes becomes the current book
   (a tie goes to the book nominated first). A new, empty ballot opens. */
function closeBallot(clubId) {
  const state = loadState();
  const club = state.clubs.find((c) => c.id === clubId);
  const options = club.ballot.options;
  if (!options.length) return null;
  const winner = options.reduce((best, o) => (o.votes > best.votes ? o : best), options[0]);
  club.currentBook = { id: winner.bookId, title: winner.title, author: winner.author };
  club.ballot = { month: nextMonthName(), closes: daysFromToday(30), options: [] };
  delete state.myVotes[clubId];
  saveState(state);
  return winner;
}

/* ==========================================================================
   Events (user stories #8 and #10)
   ========================================================================== */

function sampleEvents() {
  return [
    { id: "e1", title: "Poetry night", date: daysFromToday(3), time: "18:00", place: "Pages & Co.", distance: "0.4 mi", organizer: "Pages & Co.", description: "Open mic for original and favorite poems. Sign-up sheet at the door." },
    { id: "e2", title: "Used book swap", date: daysFromToday(6), time: "10:00", place: "University Library", distance: "1.2 mi", organizer: "University Library", description: "Bring up to five books, take home five new-to-you ones." },
    { id: "e3", title: "Author talk: writing local history", date: daysFromToday(10), time: "19:30", place: "Maple Street Library", distance: "0.8 mi", organizer: "Maple Street Library", description: "A local author on researching the neighborhood's past." },
    { id: "e4", title: "Kids' story hour", date: daysFromToday(16), time: "11:00", place: "Riverside Park Pavilion", distance: "0.6 mi", organizer: "Friends of Riverside Park", description: "Picture books read aloud outdoors. Blankets welcome." },
  ];
}

/* Upcoming events only (today or later), soonest first */
function getEvents() {
  const today = localDate();
  return loadState().events
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function postEvent({ title, date, time, place, description }) {
  const state = loadState();
  const event = { id: "e" + Date.now(), title, date, time, place, description, organizer: state.user.name, mine: true };
  state.events.push(event);
  saveState(state);
  return event;
}

# Novels with Neighbors

A mobile-first web app that helps local readers find books, join neighborhood book clubs, vote on the next read, and meet up at local events.

Built by **Group 3** for MET CS 632 IT Project Management, Milestone 2: Jack Aviles, Kiana Dubose-Jackson, Elizabeth Martin, Tamara McAllister. AI build partner: Claude (Anthropic).

**Live app:** _GitHub Pages link added after publishing_

## What it does (MVP scope)

| User story | Feature | Where |
|---|---|---|
| #16 | Sign up with name, email, neighborhood and favorite genres | Sign up |
| #2 | Profile with reading interests; reading history with ratings | Profile, Books |
| #1 | Search by title, author, genre or keyword, timed against the 3-second target | Books → Search |
| #13 | Book page with genres, description, ratings and neighbor reviews | Book page |
| #18 | Want-to-read list, capped at 50 books | Books |
| #9 | Book suggestions based on your genres and highly rated books | Books, Home |
| #3 | Create a club (name, genre, size) and join clubs nearby | Clubs |
| #4 | Vote on next month's book; nominate books; organizer closes the vote | Club page, Home |
| #8, #10 | Browse local events and post your own | Events |

Deferred stories and the reasons are listed in the team's Milestone 2 submission document.

## Tech stack

| Part | Choice | Why |
|---|---|---|
| Front end | Plain HTML, CSS and JavaScript (no framework, no build step) | Every team member can read and explain the code |
| Book data | [Open Library API](https://openlibrary.org/developers/api) (free, no key) | Named in the Milestone 1 risk register |
| Backup book data | Google Books API, then a built-in list of 64 books | Risk register fallback plan |
| Saved data | The browser's `localStorage` | No server needed for the MVP |
| Suggestions | Rule-based engine in `js/recommend.js` | No paid AI API (cost risk in the risk register) |
| Fonts | Newsreader and Manrope from Google Fonts | Matches the team's look-and-feel mockup |
| Hosting | GitHub Pages | Free, public link |

## How to run it

**Option 1:** open the live link above on a phone or computer.

**Option 2 (local):** download or clone this repository, then double-click `index.html`. It opens in your browser. Nothing to install.

For the best view on a computer, narrow the browser window; the app is designed for phone width.

## Folder guide

```
index.html        Home: your club, the vote, suggestions, this week's events
books.html        Books tab: search box, suggestions, want-to-read, reading history
search.html       Search results
book.html         One book's page
clubs.html        Clubs tab: your clubs, clubs near you, create a club
club.html         One club's page: details, current book, ballot, members
events.html       Events tab: browse and post events
profile.html      Profile: name, neighborhood, interests
signup.html       Create a profile
css/styles.css    All styling (dark, warm theme)
js/ui.js          Shared helpers: navigation, book cover tiles, dates, messages
js/store.js       Everything saved in the browser: profile, lists, clubs, votes, events
js/api.js         Book search and book details (Open Library → Google Books → offline list)
js/recommend.js   "Suggested for you" engine
js/ballot.js      Voting block used on Home and on club pages
js/<page>.js      One script per page (home.js, books.js, search.js, book.js, …)
data/fallback-books.js   Offline list of 64 books
docs/prompt-log.md       AI prompt log, written during the build
tools/build_pages.py     Regenerates the shared page layout (developers only)
```

## Known limitations

- **Data stays on one device.** Profiles, clubs, votes and events are saved in each person's browser, so two people don't see each other's clubs. A shared database is the first post-MVP step.
- **No real login.** Sign-up creates a profile on this device only; there are no passwords.
- **Sample content.** Neighbor reviews, three clubs and four events are sample data so the app isn't empty.
- **Suggestions are rule-based,** not a machine-learning model. They improve as you rate books.
- **The offline book list has 64 titles.** The plan calls for about 500.
- **Not built yet:** library card sign-up (#5), finding and friending readers (#6, #7), messaging (#11), uploading books (#12), native iOS/Android apps (#14), leaving a club or deleting an account (#17).

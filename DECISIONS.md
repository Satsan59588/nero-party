# Architecture & Product Decisions

A running log of every meaningful decision made while building Nero Party, and the reasoning behind it.

---

## Northstar — Project Brief & Evaluation Criteria

> This is the original brief. Every decision in this file should be traceable back to one of these criteria.

### What We're Building
A listening party website where users can:
- Create a listening party and invite friends
- Add songs to a shared queue
- Listen together in real-time
- Crown a winning song at the end

### Must-Have Requirements
- Create a party with configurable conditions (max song limit, max time limit, etc.)
- Shareable way to join a party
- Add songs to the queue via a music API (search + playback)
- Songs play for all participants simultaneously
- Real-time updates (queue changes, current song, participants)
- A winning song at the end

### Left to Us
- How users rate/vote/rank songs
- Whether standings are visible during or revealed at the end
- All UI/UX decisions
- Database schema design
- The rating/ranking algorithm

### Evaluation Criteria (in order of weight)
1. **Design & UI/UX** — Is it beautiful? Intuitive? Does it feel good to use?
2. **Product Thinking** — What was prioritized? What decisions were made and why?
3. **Technical Architecture** — Is the code clean? Is the data model sensible? Is the ranking algorithm well-considered?
4. **Creativity** — Surprise them.

### Deliverables
1. GitHub repo with code
2. README with local setup instructions (they must be able to run it)
3. 3–5 minute video walkthrough covering UI/UX decisions and technical approach

### Constraints
- Stack: Express.js, Prisma, Socket.IO / React, Vite, TailwindCSS / SQLite
- Deadline: 48 hours from receipt
- Expected effort: ~3 hours (AI tools explicitly encouraged)

---

## Music API: Spotify Search + YouTube Playback

**Decision:** Use Spotify's API for song search and metadata, and the YouTube IFrame Player API for actual audio playback.

**Why not Spotify-only:**

Spotify's Web Playback SDK — the only way to play full tracks programmatically — has two hard blockers for this use case:

1. **Premium required.** The SDK flat-out refuses to initialize unless the authenticated user has a Spotify Premium subscription. In a listening party with 5–10 people, the odds that every single participant has Premium is low. One person without it breaks the experience for them entirely.

2. **OAuth per participant.** To play music, every user must authorize your app via Spotify's OAuth flow. That means every person who joins via a party code also has to stop, open a Spotify login page, grant permissions, and get redirected back. This completely undermines the "just paste the link and join" UX we want.

Spotify does expose 30-second `preview_url` clips on each track — free, no auth required. But 30 seconds is not a listening party. It's a preview. The whole point is listening to full songs together.

**Why not YouTube-only:**

YouTube search is functional but the results are messy. Searching "Bohemian Rhapsody" returns the official video, 47 covers, a lo-fi remix, a 10-hour loop, and a reaction video. Spotify's search is music-first — it understands artists, albums, and tracks, and surfaces the canonical version. The metadata (artist name, album art, duration) is also clean and structured, which makes the UI much easier to build.

**Why Spotify Search + YouTube Playback works:**

- Spotify search uses the **Client Credentials flow** — just a server-side token exchange with `client_id` and `client_secret`. No user login. No OAuth popup. The server fetches the token, searches Spotify, returns results. Participants never touch Spotify.
- From the Spotify track object we get the track name and artist. We then do a server-side YouTube search for `"${title} ${artist} official"` to find the right video.
- YouTube playback via the IFrame API is free, requires no user account, and — critically — is fully programmable. We can seek to a timestamp, pause, and resume via JavaScript. This is what makes synchronized playback possible.
- The sync mechanism: when the host plays a song, the server records `startedAt = Date.now()`. Every client that receives the `playback:start` event calls `player.seekTo((Date.now() - startedAt) / 1000)` before pressing play. Everyone starts at the same position within ~100ms of each other.

**Tradeoffs accepted:**
- The YouTube video won't always be the exact official version (live performances, fan uploads may slip through). Mitigated by appending "official audio" to the search query.
- YouTube videos can be region-locked or taken down. Accepted as a known limitation.
- Two API keys needed instead of one. Minor operational overhead.

---

## Voting Mechanism: Live Emoji Reactions

**Decision:** Users vote by reacting with emojis (🔥 ❤️ 💀 ⏭) in real-time *while a song plays*, not by rating it afterward.

**Why:**

Post-song ratings (1–5 stars after the song ends) are passive and easy to forget. They also front-load the "evaluation" mindset — people listen analytically instead of just enjoying the music.

Live reactions during playback are social and expressive. They create a shared moment: everyone sees the fire emojis flooding in at the drop, or the skull emojis when a bad song comes on. It turns the rating mechanism into part of the entertainment itself.

**Scoring:** `fire=+2, heart=+1, skip=-1, skull=-2`. Each reaction type is unique per `(song, participant)` — you can fire AND heart a song, but you can't fire it twice. The unique constraint is enforced at the database level.

**Winner determination:** Highest total weighted score at party end. In case of a tie, the song that was played first wins (earlier `playedAt`).

---

## Database Schema

**Decision:** Four models — `Party`, `Participant`, `Song`, `Reaction`.

**Key choices:**
- `Party.code` is a short, unique, human-readable join code (6 chars). Easier to share verbally or in a chat than a full URL with an ID.
- `Party.currentSongId` stored on the party itself rather than derived. Avoids a query to find the currently playing song on every socket event.
- `Reaction` has a unique constraint on `(songId, participantId, type)`. One fire, one heart, one skull, one skip per person per song — enforced at DB level, not just application level.
- Cascade deletes everywhere — deleting a party cleans up all participants, songs, and reactions.

---

## Tech Stack (given)

- **Backend:** Express.js, Prisma (ORM), Socket.IO (real-time)
- **Frontend:** React, Vite, TailwindCSS
- **Database:** SQLite (local, no setup)
- All given by the starter repo. No deviations.

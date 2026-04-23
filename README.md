# Nero Party

A real-time listening party app. Create a session, invite friends with a shareable code, build a shared queue, and crown the Song of the Night when it's over.

## What it does

- **Shared queue** — everyone searches and adds songs
- **Synchronized playback** — all participants hear the same song at the same position in real time
- **Reactions** — Dislike (−1), Vibe (+2), Love (+3), and one Crown per person per session (8×)
- **Room skip vote** — 75% of the room auto-advances the song
- **Results reveal** — weighted song podium, Auxecutive leaderboard, and side awards

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Express.js, Socket.IO, Prisma |
| Database | SQLite |
| Frontend | React, Vite |
| Music search | Spotify Web API (Client Credentials) |
| Playback | YouTube IFrame API |

---

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd nero-party
```

### 2. Get Spotify credentials

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in and create an app (name it anything)
3. Copy the **Client ID** and **Client Secret**

Nero Party uses the Client Credentials flow — no user login or redirect URI needed.

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your Spotify credentials:

```
PORT=3000
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### 4. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 5. Set up the database

```bash
cd backend
npx prisma migrate dev --name init
```

### 6. Run the app

Open two terminal tabs.

**Terminal 1 — backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm run dev
```

The app runs at **[http://localhost:5173](http://localhost:5173)**

---

## How to run a party

1. Open the app and click **Start a Listening Party**
2. Share the party URL or 6-character code with friends
3. Friends open the link and enter their name to join
4. Search for songs and add them to the shared queue
5. Host hits **Start Playing** — everyone hears the same song in sync
6. React with 👎 🙂 😍 or spend your 👑 Crown on the track that deserves it
7. Host clicks **End Session** to tally scores and reveal the results

## Project structure

```
nero-party/
├── backend/
│   ├── prisma/        # Schema and migrations
│   └── src/
│       ├── routes/    # REST API (parties, songs)
│       ├── lib/       # Spotify + YouTube clients
│       └── index.ts   # Express + Socket.IO server
└── frontend/
    └── src/
        ├── components/
        │   ├── party/ # PartyLive, PartyTally, PartyWinner
        │   ├── home/  # Landing page
        │   └── primitives/
        └── lib/       # API client, socket
```

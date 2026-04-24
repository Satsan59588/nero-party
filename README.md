# Nero Party

A real-time listening party app. Create a session, invite friends with a shareable code, build a shared queue, and crown the Song of the Night when it's over.

## What it does

- **Shared queue** — everyone searches and adds songs
- **Synchronized playback** — all participants hear the same song at the same position in real time
- **Reactions** — Dislike (−1), Vibe (+2), Love (+3), and one Crown per person per session (+8)
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

You are now inside the `nero-party/` root directory. All subsequent steps assume you start here unless noted otherwise.

### 2. Get Spotify credentials

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in and create an app (name it anything)
3. Copy the **Client ID** and **Client Secret**

Nero Party uses the Client Credentials flow — no user login or redirect URI needed.

### 3. Get a YouTube Data API key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or select an existing one)
3. Enable the **YouTube Data API v3**
4. Create an API key under **Credentials**

### 4. Configure environment

From `nero-party/`:

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```
PORT=3000
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 5. Install dependencies

From `nero-party/`, install backend dependencies first, then return to root and install frontend:

```bash
cd backend
npm install
cd ..
cd frontend
npm install
cd ..
```

You should be back in `nero-party/` when done.

### 6. Set up the database

From `nero-party/`, navigate to the backend and run the migration:

```bash
cd backend
npx prisma migrate deploy
```

When done, return to root:

```bash
cd ..
```

### 7. Run the app

Open two terminal tabs. In **each tab**, start from `nero-party/`.

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

## Navigating the project

All commands assume you start from the `nero-party/` root. Here are the common moves:

| Where you are | Where you want to go | Command |
|---|---|---|
| `nero-party/` | backend | `cd backend` |
| `nero-party/` | frontend | `cd frontend` |
| `backend/` | `nero-party/` root | `cd ..` |
| `frontend/` | `nero-party/` root | `cd ..` |
| `backend/` | frontend | `cd ../frontend` |
| `frontend/` | backend | `cd ../backend` |

---

## How to run a party

1. Open the app and click **Start a Listening Party**
2. Share the party URL or 6-character code with friends
3. Friends open the link and enter their name to join
4. Search for songs and add them to the shared queue
5. Host hits **Start Playing** — everyone hears the same song in sync
6. React with 👎 🙂 😍 or spend your 👑 on the track that deserves it
7. Host clicks **End Session** to tally scores and reveal the results

## Project structure

```
nero-party/
├── backend/
│   ├── prisma/        # Schema and migrations
│   └── src/
│       ├── routes/    # REST API (parties, songs)
│       ├── lib/       # Spotify + YouTube clients
│       └── index.ts   # Express + Socket.IO server
└── frontend/
    └── src/
        ├── components/
        │   ├── party/ # PartyLive, PartyTally, PartyWinner
        │   ├── home/  # Landing page
        │   ├── nav/   # Navigation
        │   └── primitives/
        └── lib/       # API client, socket
```

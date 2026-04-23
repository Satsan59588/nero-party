# Build Progress

Tracking what's done, what's in progress, and what's next.

---

## Status Legend
- ✅ Done
- 🔄 In Progress
- ⬜ Not Started

---

## Phase 1 — Foundation
- ✅ Repo setup, dependencies installed
- ✅ `.env` configured
- ✅ Prisma schema designed (`Party`, `Participant`, `Song`, `Reaction`)
- ✅ Database migrated (SQLite, `dev.db`)
- ✅ Prisma client generated

## Phase 2 — Backend REST API
- ✅ `POST /api/parties` — create party
- ✅ `POST /api/parties/:code/join` — join by code
- ✅ `GET  /api/parties/:code` — get party state
- ✅ `GET  /api/songs/search?q=` — Spotify search proxy
- ✅ `POST /api/songs/party/:partyId` — add song to queue (with YouTube lookup)
- ✅ `POST /api/songs/:id/react` — submit reaction
- ✅ `POST /api/songs/:id/crown` — crown a song (1 per person per song)
- ✅ `POST /api/songs/:id/skip` — skip vote (60% threshold)
- ✅ `POST /api/parties/:id/next` — host advances song
- ✅ `POST /api/parties/:id/end` — end party + compute winner + Auxecutive + side awards

## Phase 3 — Socket.IO Events
- ✅ `join` — client joins a party room
- ✅ `party:state` — full snapshot on join
- ✅ `queue:updated` — song added
- ✅ `playback:start` — broadcast `{song, startedAt}`
- ✅ `reaction:new` — live reaction feed
- ✅ `crown:new` — crown count update
- ✅ `skip:vote` — skip vote count
- ✅ `participant:joined`
- ✅ `party:ended` — winner + leaderboard

## Phase 4 — Frontend Routing
- ✅ URL-based navigation (`/party/:code` auto-detects and joins/restores)
- ✅ `localStorage` session persistence per party code
- ✅ History API for clean URLs

## Phase 5 — Home Page
- ✅ Hero with animated text capsule + glowing CTA
- ✅ Feature grid (frosted glass tiles)
- ✅ Nero Party CTA section
- ✅ Footer
- ✅ Create party modal (name, host name, max songs)
- ✅ Join party modal (code + name)

## Phase 6 — Party Room
- ✅ Header with party name, code, copy button, participant avatars, LIVE badge
- ✅ Now-playing card (album art, progress bar, timestamps)
- ✅ Guest vs host UI differentiation

## Phase 7 — Song Search & Queue
- ✅ Debounced Spotify search with dropdown results
- ✅ Add to queue → POST + socket broadcast
- ✅ Queue list with crown counts, track numbers, durations

## Phase 8 — Playback
- ✅ YouTube IFrame API (hidden player, audio only)
- ✅ Synchronized play via `startedAt` timestamp
- ✅ Host "Next Song" / "Start Playing" controls
- ✅ Auto-advance on song end (host)

## Phase 9 — Reactions & Voting
- ✅ 🔥 ❤️‍🔥 😍 👍 👎 💀 reaction buttons
- ✅ Floating emoji animation (CSS keyframes)
- ✅ Real-time broadcast via socket
- ✅ 👑 Crown button (one per person per song)
- ✅ Skip vote with count display (60% threshold)

## Phase 10 — Results Screen
- ✅ PartyTally loading screen (5s, stepped progress)
- ✅ PartyWinner 3-act reveal (song podium → Auxecutive → leaderboard)
- ✅ Confetti on winner reveal
- ✅ Song-of-night podium with crown counts
- ✅ Auxecutive reveal with avatar animation + set list
- ✅ Full leaderboard (avg × log formula)
- ✅ Side awards (Sleeper DJ, Curator, Room Unifier)

## Phase 11 — Design Implementation
- ✅ Full Nero design system (colors, type, spacing from design handoff)
- ✅ Inter font via Google Fonts
- ✅ Nero logo + lockup assets
- ✅ Light theme (white/gray + #17a34a green accent)
- ✅ Floating pill nav
- ✅ Ripple pattern background on hero
- ✅ All CSS animations (neroCapIn, neroGlow, neroFloat, neroWinnerIn, etc.)

## Phase 12 — Bug Fixes & Polish
- ✅ Audio playback — YouTube player now starts muted + shows "🔇 Tap to hear audio" unmute button (browser autoplay policy fix)
- ✅ YouTube lookup — replaced YouTube Data API v3 with YouTube's innertube API (no API key required, works immediately)
- ✅ Initial state restore — player now resumes at correct position when rejoining a party mid-song
- ✅ Session storage — switched from localStorage to sessionStorage so each tab is independent; new tab always shows join modal instead of restoring host session
- ✅ Stale party detection — App verifies party still exists on server before restoring from session; clears stale data and redirects home if not found
- ✅ Party sharing — shared URL auto-fills the party code in the join modal
- ✅ Winner screen — reduced gap between "added by" label and name
- ✅ Auxecutive score formula — fixed `Math.log(n)` → `Math.log2(n + 1)` so single-song participants score correctly and formula matches `avg × log2(songs + 1)` spec

## Phase 13 — Deliverables
- ⬜ README with setup instructions
- ⬜ Video walkthrough (3–5 min)
- ⬜ Final GitHub push

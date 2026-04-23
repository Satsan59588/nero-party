import { Router } from "express";
import prisma from "../prisma.js";
import { generateCode } from "../lib/codes.js";
import type { Server } from "socket.io";

// In-memory pause state: partyId -> elapsed seconds when paused
const pauseState = new Map<string, number>();

export function partiesRouter(io: Server) {
  const router = Router();

  // Create a party
  router.post("/", async (req, res) => {
    try {
      const { name, hostName, maxSongs } = req.body;
      if (!name || !hostName) {
        return res.status(400).json({ error: "name and hostName required" });
      }

      let code = generateCode();
      // Ensure uniqueness
      while (await prisma.party.findUnique({ where: { code } })) {
        code = generateCode();
      }

      const party = await prisma.party.create({
        data: {
          name,
          code,
          maxSongs: maxSongs || null,
          participants: {
            create: { name: hostName, isHost: true },
          },
        },
        include: { participants: true, songs: true },
      });

      const host = party.participants[0];
      res.json({ party, participant: host });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create party" });
    }
  });

  // Join a party by code
  router.post("/:code/join", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });

      const party = await prisma.party.findUnique({
        where: { code: req.params.code.toUpperCase() },
        include: {
          participants: true,
          songs: {
            include: { crowns: { include: { participant: { select: { name: true } } } }, reactions: true, skipVotes: true },
            orderBy: { queueOrder: "asc" },
          },
        },
      });

      if (!party) return res.status(404).json({ error: "Party not found" });
      if (party.status === "ended")
        return res.status(400).json({ error: "Party has ended" });

      const participant = await prisma.participant.create({
        data: { partyId: party.id, name, isHost: false },
      });

      // Notify room
      io.to(party.id).emit("participant:joined", participant);

      res.json({ party, participant });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to join party" });
    }
  });

  // Get party state
  router.get("/:code", async (req, res) => {
    try {
      const party = await prisma.party.findUnique({
        where: { code: req.params.code.toUpperCase() },
        include: {
          participants: true,
          songs: {
            include: { crowns: { include: { participant: { select: { name: true } } } }, reactions: true, skipVotes: true },
            orderBy: { queueOrder: "asc" },
          },
        },
      });

      if (!party) return res.status(404).json({ error: "Party not found" });
      res.json({ party });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch party" });
    }
  });

  // Play next song (host only)
  router.post("/:id/next", async (req, res) => {
    try {
      const { participantId } = req.body;
      const participant = await prisma.participant.findUnique({
        where: { id: participantId },
      });
      if (!participant?.isHost)
        return res.status(403).json({ error: "Host only" });

      const party = await prisma.party.findUnique({
        where: { id: req.params.id },
        include: {
          songs: { orderBy: { queueOrder: "asc" } },
        },
      });
      if (!party) return res.status(404).json({ error: "Party not found" });

      const playedSongs = party.songs.filter((s) => s.playedAt);
      const nextSong = party.songs.find((s) => !s.playedAt);

      if (!nextSong) {
        return res.status(400).json({ error: "No more songs in queue" });
      }

      const startedAt = Date.now();

      const [updatedSong, updatedParty] = await Promise.all([
        prisma.song.update({
          where: { id: nextSong.id },
          data: { playedAt: new Date(startedAt) },
        }),
        prisma.party.update({
          where: { id: party.id },
          data: { status: "active", currentSongId: nextSong.id },
        }),
      ]);

      io.to(party.id).emit("playback:start", {
        song: { ...nextSong, playedAt: new Date(startedAt) },
        startedAt,
      });

      res.json({ song: updatedSong, startedAt });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to advance song" });
    }
  });

  // Pause current song (host only)
  router.post("/:id/pause", async (req, res) => {
    try {
      const { participantId } = req.body;
      const participant = await prisma.participant.findUnique({ where: { id: participantId } });
      if (!participant?.isHost) return res.status(403).json({ error: "Host only" });

      const party = await prisma.party.findUnique({
        where: { id: req.params.id },
        include: { songs: true },
      });
      if (!party) return res.status(404).json({ error: "Party not found" });

      const current = party.songs.find((s) => s.id === party.currentSongId);
      if (!current?.playedAt) return res.status(400).json({ error: "No song playing" });

      const elapsed = (Date.now() - new Date(current.playedAt).getTime()) / 1000;
      pauseState.set(party.id, elapsed);

      io.to(party.id).emit("playback:pause", { elapsed });
      res.json({ elapsed });
    } catch (err) {
      res.status(500).json({ error: "Failed to pause" });
    }
  });

  // Resume current song (host only)
  router.post("/:id/resume", async (req, res) => {
    try {
      const { participantId } = req.body;
      const participant = await prisma.participant.findUnique({ where: { id: participantId } });
      if (!participant?.isHost) return res.status(403).json({ error: "Host only" });

      const party = await prisma.party.findUnique({
        where: { id: req.params.id },
        include: { songs: true },
      });
      if (!party) return res.status(404).json({ error: "Party not found" });

      const elapsed = pauseState.get(party.id);
      if (elapsed === undefined) return res.status(400).json({ error: "Not paused" });

      // Recalculate startedAt so seekTo stays consistent across clients
      const startedAt = Date.now() - elapsed * 1000;
      const current = party.songs.find((s) => s.id === party.currentSongId);
      if (current) {
        await prisma.song.update({ where: { id: current.id }, data: { playedAt: new Date(startedAt) } });
      }
      pauseState.delete(party.id);

      io.to(party.id).emit("playback:resume", { startedAt });
      res.json({ startedAt });
    } catch (err) {
      res.status(500).json({ error: "Failed to resume" });
    }
  });

  // Go to previous song (host only) — resets reactions on that song
  router.post("/:id/prev", async (req, res) => {
    try {
      const { participantId } = req.body;
      const participant = await prisma.participant.findUnique({ where: { id: participantId } });
      if (!participant?.isHost) return res.status(403).json({ error: "Host only" });

      const party = await prisma.party.findUnique({
        where: { id: req.params.id },
        include: { songs: { orderBy: { queueOrder: "asc" } } },
      });
      if (!party) return res.status(404).json({ error: "Party not found" });

      const played = party.songs
        .filter((s) => s.playedAt)
        .sort((a, b) => a.queueOrder - b.queueOrder);

      if (played.length < 2) return res.status(400).json({ error: "No previous song" });

      const current = played[played.length - 1];
      const prev = played[played.length - 2];

      // Put current song back in queue
      await prisma.song.update({ where: { id: current.id }, data: { playedAt: null } });

      // Clear all reactions/crowns/votes on the previous song so it starts fresh
      await Promise.all([
        prisma.reaction.deleteMany({ where: { songId: prev.id } }),
        prisma.crown.deleteMany({ where: { songId: prev.id } }),
        prisma.skipVote.deleteMany({ where: { songId: prev.id } }),
      ]);

      const startedAt = Date.now();
      const [updatedSong] = await Promise.all([
        prisma.song.update({ where: { id: prev.id }, data: { playedAt: new Date(startedAt) } }),
        prisma.party.update({ where: { id: party.id }, data: { currentSongId: prev.id } }),
      ]);

      pauseState.delete(party.id);

      io.to(party.id).emit("playback:start", {
        song: { ...prev, playedAt: new Date(startedAt), crowns: [], reactions: [], skipVotes: [] },
        startedAt,
      });
      res.json({ song: updatedSong, startedAt });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to go to previous song" });
    }
  });

  // Seek current song (host only)
  router.post("/:id/seek", async (req, res) => {
    try {
      const { participantId, seekTo } = req.body; // seekTo in seconds
      const participant = await prisma.participant.findUnique({ where: { id: participantId } });
      if (!participant?.isHost) return res.status(403).json({ error: "Host only" });

      const party = await prisma.party.findUnique({
        where: { id: req.params.id },
        include: { songs: true },
      });
      if (!party) return res.status(404).json({ error: "Party not found" });

      const current = party.songs.find((s) => s.id === party.currentSongId);
      if (!current) return res.status(400).json({ error: "No song playing" });

      // Rebase startedAt so that now - startedAt = seekTo
      const startedAt = Date.now() - seekTo * 1000;
      await prisma.song.update({ where: { id: current.id }, data: { playedAt: new Date(startedAt) } });
      pauseState.delete(party.id);

      io.to(party.id).emit("playback:seek", { startedAt });
      res.json({ startedAt });
    } catch (err) {
      res.status(500).json({ error: "Failed to seek" });
    }
  });

  // Leave party (non-host only)
  router.post("/:id/leave", async (req, res) => {
    try {
      const { participantId } = req.body;
      const participant = await prisma.participant.findUnique({ where: { id: participantId } });
      if (!participant) return res.status(404).json({ error: "Participant not found" });
      if (participant.isHost) return res.status(403).json({ error: "Host cannot leave — end the session instead" });

      await prisma.participant.delete({ where: { id: participantId } });
      io.to(req.params.id).emit("participant:left", { participantId });
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to leave party" });
    }
  });

  // End party (host only)
  router.post("/:id/end", async (req, res) => {
    try {
      const { participantId } = req.body;
      const participant = await prisma.participant.findUnique({
        where: { id: participantId },
      });
      if (!participant?.isHost)
        return res.status(403).json({ error: "Host only" });

      const party = await prisma.party.findUnique({
        where: { id: req.params.id },
        include: {
          participants: true,
          songs: {
            include: {
              crowns: true,
              reactions: true,
              skipVotes: true,
            },
            orderBy: { queueOrder: "asc" },
          },
        },
      });
      if (!party) return res.status(404).json({ error: "Party not found" });

      await prisma.party.update({
        where: { id: party.id },
        data: { status: "ended" },
      });

      // Compute results
      const results = computeResults(party);

      io.to(party.id).emit("party:ended", results);
      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to end party" });
    }
  });

  return router;
}

// Reaction weights — dislike hurts, vibe helps, love helps more, crown is 8×
const REACTION_WEIGHTS: Record<string, number> = {
  dislike: -1, vibe: 2, love: 3,
};

function songScore(s: any): number {
  const reactionScore = (s.reactions || []).reduce(
    (sum: number, r: any) => sum + (REACTION_WEIGHTS[r.type] ?? 0), 0
  );
  const goldenBonus = (s.crowns || []).length * 8;
  return reactionScore + goldenBonus;
}

function computeResults(party: any) {
  const playedSongs = party.songs.filter((s: any) => s.playedAt);

  // Song winner: highest weighted score (reactions + golden buzzer 5×)
  const songRanked = [...playedSongs]
    .map((s: any) => ({ ...s, score: songScore(s) }))
    .sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime();
    });

  // Auxecutive: avg weighted score per song × log2(songs + 1)
  const participantScores = party.participants.map((p: any) => {
    const theirSongs = playedSongs.filter((s: any) => s.addedBy === p.name);
    const totalScore = theirSongs.reduce(
      (sum: number, s: any) => sum + songScore(s), 0
    );
    const avgReact =
      theirSongs.length > 0 ? totalScore / theirSongs.length : 0;
    const score = theirSongs.length > 0
      ? +(avgReact * Math.log2(theirSongs.length + 1)).toFixed(1)
      : 0;
    return {
      name: p.name,
      songs: theirSongs.length,
      avgReact: +avgReact.toFixed(1),
      score,
      topTracks: [...theirSongs]
        .sort((a: any, b: any) => b.reactions.length - a.reactions.length)
        .slice(0, 3)
        .map((s: any) => ({
          title: s.title,
          artist: s.artist,
          thumbnail: s.thumbnail,
          reactions: s.reactions.length,
          top: topReactionEmoji(s.reactions),
        })),
    };
  });

  const leaderboard = participantScores.sort(
    (a: any, b: any) => b.score - a.score
  );

  // Side awards
  const sideAwards = computeSideAwards(playedSongs, party.participants);

  return {
    songWinner: songRanked[0] || null,
    songPodium: songRanked.slice(0, 3),
    auxecutive: leaderboard[0] || null,
    leaderboard,
    sideAwards,
  };
}

function topReactionEmoji(reactions: any[]): string {
  const emojiMap: Record<string, string> = {
    fire: "🔥",
    heart: "❤️‍🔥",
    eyes: "😍",
    thumbs_up: "👍",
    thumbs_down: "👎",
    skull: "💀",
  };
  if (!reactions.length) return "🔥";
  const counts: Record<string, number> = {};
  for (const r of reactions) counts[r.type] = (counts[r.type] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return emojiMap[top] || "🔥";
}

function computeSideAwards(songs: any[], participants: any[]) {
  const awards = [];

  // Sleeper DJ: 1 song queued with highest avg reactions
  const soloQueuer = participants
    .map((p: any) => {
      const theirSongs = songs.filter((s: any) => s.addedBy === p.name);
      return {
        name: p.name,
        songs: theirSongs.length,
        avgReact:
          theirSongs.length > 0
            ? theirSongs.reduce(
                (sum: number, s: any) => sum + s.reactions.length,
                0
              ) / theirSongs.length
            : 0,
      };
    })
    .filter((p: any) => p.songs === 1)
    .sort((a: any, b: any) => b.avgReact - a.avgReact)[0];
  if (soloQueuer) {
    awards.push({
      title: "Sleeper DJ",
      winner: soloQueuer.name,
      note: `one song, ${Math.round(soloQueuer.avgReact)} reactions — highest avg with just one track`,
    });
  }

  // Curator: most songs queued
  const curator = [...participants]
    .map((p: any) => ({
      name: p.name,
      songs: songs.filter((s: any) => s.addedBy === p.name).length,
    }))
    .sort((a: any, b: any) => b.songs - a.songs)[0];
  if (curator && curator.songs > 1) {
    awards.push({
      title: "Curator",
      winner: curator.name,
      note: `queued ${curator.songs} songs — kept the flow going`,
    });
  }

  // Room Unifier: song everyone reacted to
  const participantCount = participants.length;
  const unifier = songs
    .map((s: any) => ({
      ...s,
      uniqueReactors: new Set(s.reactions.map((r: any) => r.participantId))
        .size,
    }))
    .sort((a: any, b: any) => b.uniqueReactors - a.uniqueReactors)[0];
  if (unifier && unifier.uniqueReactors >= Math.ceil(participantCount * 0.7)) {
    const adder = participants.find(
      (p: any) => p.name === unifier.addedBy
    )?.name;
    awards.push({
      title: "Room Unifier",
      winner: adder || unifier.addedBy,
      note: `everyone reacted to "${unifier.title}"`,
    });
  }

  return awards;
}

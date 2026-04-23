import { Router } from "express";
import prisma from "../prisma.js";
import { searchSpotify } from "../lib/spotify.js";
import { findYouTubeId } from "../lib/youtube.js";
import type { Server } from "socket.io";

const SKIP_THRESHOLD = 0.75; // 75% of all participants (including host)

export function songsRouter(io: Server) {
  const router = Router();

  // Spotify search
  router.get("/search", async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();
      if (!q) return res.json({ tracks: [] });

      const tracks = await searchSpotify(q);
      res.json({ tracks });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Add song to party queue
  router.post("/party/:partyId", async (req, res) => {
    try {
      const { partyId } = req.params;
      const { participantId, title, artist, thumbnail, durationSecs } =
        req.body;

      const party = await prisma.party.findUnique({
        where: { id: partyId },
        include: { songs: true, participants: true },
      });
      if (!party) return res.status(404).json({ error: "Party not found" });
      if (party.status === "ended")
        return res.status(400).json({ error: "Party has ended" });

      // Check max songs limit
      if (party.maxSongs && party.songs.length >= party.maxSongs) {
        return res
          .status(400)
          .json({ error: `Queue is full (max ${party.maxSongs} songs)` });
      }

      const participant = await prisma.participant.findUnique({
        where: { id: participantId },
      });
      if (!participant)
        return res.status(404).json({ error: "Participant not found" });

      // Find YouTube video ID
      const youtubeId = await findYouTubeId(title, artist);

      const queueOrder = party.songs.reduce((max, s) => Math.max(max, s.queueOrder), -1) + 1;

      const song = await prisma.song.create({
        data: {
          partyId,
          youtubeId: youtubeId || "",
          title,
          artist,
          thumbnail,
          durationSecs,
          addedBy: participant.name,
          queueOrder,
        },
        include: { crowns: true, reactions: true, skipVotes: true },
      });

      io.to(partyId).emit("queue:updated", { song, action: "add" });

      res.json({ song });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add song" });
    }
  });

  // Golden Buzzer — one per room per party (first to tap wins it)
  router.post("/:id/crown", async (req, res) => {
    try {
      const { participantId } = req.body;
      const songId = req.params.id;

      const song = await prisma.song.findUnique({
        where: { id: songId },
        include: {
          party: { include: { songs: { include: { crowns: true } } } },
        },
      });
      if (!song) return res.status(404).json({ error: "Song not found" });

      // Check if this participant already used their crown
      const alreadyUsed = song.party.songs.some((s) =>
        s.crowns.some((c: any) => c.participantId === participantId)
      );
      if (alreadyUsed) {
        return res.status(409).json({ error: "You already used your Crown" });
      }

      const participant = await prisma.participant.findUnique({
        where: { id: participantId },
      });
      if (!participant) return res.status(404).json({ error: "Participant not found" });

      // Cannot crown your own song
      if (song.addedBy === participant.name) {
        return res.status(403).json({ error: "Cannot use your Crown on your own song" });
      }

      await prisma.crown.create({ data: { songId, participantId } });

      io.to(song.partyId).emit("golden:used", {
        songId,
        participantId,
        participantName: participant.name,
      });

      res.json({ songId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to use Golden Buzzer" });
    }
  });

  // React to a song (decorative, multiple allowed)
  router.post("/:id/react", async (req, res) => {
    try {
      const { participantId, type } = req.body;
      const songId = req.params.id;

      const song = await prisma.song.findUnique({ where: { id: songId } });
      if (!song) return res.status(404).json({ error: "Song not found" });

      const participant = await prisma.participant.findUnique({ where: { id: participantId } });
      if (!participant) return res.status(404).json({ error: "Participant not found" });

      // Cannot react to your own song
      if (song.addedBy === participant.name) {
        return res.status(403).json({ error: "Cannot react to your own song" });
      }

      const reaction = await prisma.reaction.upsert({
        where: { songId_participantId: { songId, participantId } },
        create: { songId, participantId, type },
        update: { type },
      });

      io.to(song.partyId).emit("reaction:new", {
        songId,
        participantId,
        type,
        id: reaction.id,
      });

      res.json({ reaction });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to react" });
    }
  });

  // Remove a song from the queue (adder only, unplayed songs only)
  router.delete("/:id", async (req, res) => {
    try {
      const { participantId } = req.body;
      const songId = req.params.id;

      const song = await prisma.song.findUnique({ where: { id: songId } });
      if (!song) return res.status(404).json({ error: "Song not found" });
      if (song.playedAt) return res.status(400).json({ error: "Cannot remove a song that has already played" });

      const participant = await prisma.participant.findUnique({ where: { id: participantId } });
      if (!participant) return res.status(404).json({ error: "Participant not found" });
      if (song.addedBy !== participant.name) return res.status(403).json({ error: "You can only remove songs you added" });

      await prisma.song.delete({ where: { id: songId } });

      io.to(song.partyId).emit("queue:updated", { songId, action: "remove" });
      res.json({ songId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to remove song" });
    }
  });

  // Skip vote
  router.post("/:id/skip", async (req, res) => {
    try {
      const { participantId } = req.body;
      const songId = req.params.id;

      const song = await prisma.song.findUnique({
        where: { id: songId },
        include: {
          party: {
            include: {
              participants: true,
              songs: { orderBy: { queueOrder: "asc" } },
            },
          },
        },
      });
      if (!song) return res.status(404).json({ error: "Song not found" });

      await prisma.skipVote.upsert({
        where: { songId_participantId: { songId, participantId } },
        create: { songId, participantId },
        update: {},
      });

      const skipVotes = await prisma.skipVote.findMany({ where: { songId } });
      const totalParticipants = song.party.participants.length;
      const skipCount = skipVotes.length;
      const threshold = Math.ceil(totalParticipants * SKIP_THRESHOLD);
      const autoSkip = skipCount >= threshold;

      io.to(song.partyId).emit("skip:vote", {
        songId,
        skipCount,
        threshold,
        autoSkip,
      });

      // Auto-advance to next song when threshold is reached
      if (autoSkip) {
        const nextSong = song.party.songs.find((s) => !s.playedAt && s.id !== songId);
        if (nextSong) {
          const startedAt = Date.now();
          await Promise.all([
            prisma.song.update({
              where: { id: nextSong.id },
              data: { playedAt: new Date(startedAt) },
            }),
            prisma.party.update({
              where: { id: song.partyId },
              data: { currentSongId: nextSong.id },
            }),
          ]);
          io.to(song.partyId).emit("playback:start", {
            song: { ...nextSong, playedAt: new Date(startedAt) },
            startedAt,
          });
        } else {
          // No more songs — end the party
          io.to(song.partyId).emit("queue:ended", {});
        }
      }

      res.json({ skipCount, threshold, autoSkip });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to vote skip" });
    }
  });

  return router;
}

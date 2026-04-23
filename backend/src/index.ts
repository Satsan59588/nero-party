import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import prisma from "./prisma.js";
import { env } from "./env.js";
import { partiesRouter } from "./routes/parties.js";
import { songsRouter } from "./routes/songs.js";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/parties", partiesRouter(io));
app.use("/api/songs", songsRouter(io));

// Socket.IO
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join a party room
  socket.on("join", async ({ partyId, participantId }) => {
    if (!partyId) return;
    socket.join(partyId);
    console.log(`Socket ${socket.id} joined party ${partyId}`);

    // Update socketId on participant
    if (participantId) {
      try {
        await prisma.participant.update({
          where: { id: participantId },
          data: { socketId: socket.id },
        });
      } catch {}
    }

    // Send full party state
    try {
      const party = await prisma.party.findUnique({
        where: { id: partyId },
        include: {
          participants: true,
          songs: {
            include: {
              crowns: { include: { participant: { select: { name: true } } } },
              reactions: true,
              skipVotes: true,
            },
            orderBy: { queueOrder: "asc" },
          },
        },
      });
      if (party) socket.emit("party:state", { party });
    } catch {}
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    // Clear socketId
    try {
      await prisma.participant.updateMany({
        where: { socketId: socket.id },
        data: { socketId: null },
      });
    } catch {}
  });
});

server.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

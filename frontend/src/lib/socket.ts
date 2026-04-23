import { io } from "socket.io-client";

export const socket = io("http://localhost:3000", {
  autoConnect: false,
});

export function joinPartyRoom(partyId: string, participantId: string) {
  if (!socket.connected) socket.connect();
  socket.emit("join", { partyId, participantId });
}

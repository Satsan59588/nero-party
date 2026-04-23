const BASE = "http://localhost:3000";

async function req<T>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  createParty: (name: string, hostName: string, maxSongs?: number) =>
    req<{ party: any; participant: any }>("POST", "/api/parties", {
      name, hostName, maxSongs,
    }),

  joinParty: (code: string, name: string) =>
    req<{ party: any; participant: any }>("POST", `/api/parties/${code}/join`, { name }),

  getParty: (code: string) =>
    req<{ party: any }>("GET", `/api/parties/${code}`),

  searchSongs: (q: string) =>
    req<{ tracks: any[] }>("GET", `/api/songs/search?q=${encodeURIComponent(q)}`),

  addSong: (partyId: string, participantId: string, track: any) =>
    req<{ song: any }>("POST", `/api/songs/party/${partyId}`, {
      participantId, ...track,
    }),

  crownSong: (songId: string, participantId: string) =>
    req<{ totalCrowns: number }>("POST", `/api/songs/${songId}/crown`, { participantId }),

  reactToSong: (songId: string, participantId: string, type: string) =>
    req<{ reaction: any }>("POST", `/api/songs/${songId}/react`, { participantId, type }),

  skipVote: (songId: string, participantId: string) =>
    req<{ skipCount: number; threshold: number; autoSkip: boolean }>(
      "POST", `/api/songs/${songId}/skip`, { participantId }
    ),

  removeSong: (songId: string, participantId: string) =>
    req<{ songId: string }>("DELETE", `/api/songs/${songId}`, { participantId }),

  nextSong: (partyId: string, participantId: string) =>
    req<{ song: any; startedAt: number }>("POST", `/api/parties/${partyId}/next`, { participantId }),

  prevSong: (partyId: string, participantId: string) =>
    req<{ song: any; startedAt: number }>("POST", `/api/parties/${partyId}/prev`, { participantId }),

  pauseSong: (partyId: string, participantId: string) =>
    req<{ elapsed: number }>("POST", `/api/parties/${partyId}/pause`, { participantId }),

  resumeSong: (partyId: string, participantId: string) =>
    req<{ startedAt: number }>("POST", `/api/parties/${partyId}/resume`, { participantId }),

  seekSong: (partyId: string, participantId: string, seekTo: number) =>
    req<{ startedAt: number }>("POST", `/api/parties/${partyId}/seek`, { participantId, seekTo }),

  leaveParty: (partyId: string, participantId: string) =>
    req<{ ok: boolean }>("POST", `/api/parties/${partyId}/leave`, { participantId }),

  endParty: (partyId: string, participantId: string) =>
    req<any>("POST", `/api/parties/${partyId}/end`, { participantId }),
};

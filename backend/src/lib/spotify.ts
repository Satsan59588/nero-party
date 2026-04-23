import axios from "axios";
import { env } from "../env.js";

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const creds = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  tokenCache = {
    token: res.data.access_token,
    expiresAt: Date.now() + res.data.expires_in * 1000 - 5000,
  };

  return tokenCache.token;
}

export interface SpotifyTrack {
  spotifyId: string;
  title: string;
  artist: string;
  thumbnail: string;
  durationSecs: number;
  previewUrl: string | null;
}

export async function searchSpotify(query: string): Promise<SpotifyTrack[]> {
  const token = await getToken();

  const res = await axios.get("https://api.spotify.com/v1/search", {
    headers: { Authorization: `Bearer ${token}` },
    params: { q: query, type: "track", limit: 8 },
  });

  return res.data.tracks.items.map((item: any) => ({
    spotifyId: item.id,
    title: item.name,
    artist: item.artists.map((a: any) => a.name).join(", "),
    thumbnail: item.album.images[0]?.url ?? "",
    durationSecs: Math.round(item.duration_ms / 1000),
    previewUrl: item.preview_url,
  }));
}

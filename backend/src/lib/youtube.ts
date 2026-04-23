import axios from "axios";

// Uses YouTube's internal innertube API — no API key required.
const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_URL = `https://www.youtube.com/youtubei/v1/search?key=${INNERTUBE_KEY}`;

export async function findYouTubeId(
  title: string,
  artist: string
): Promise<string | null> {
  try {
    const res = await axios.post(
      INNERTUBE_URL,
      {
        query: `${title} ${artist} official audio`,
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20231121.01.00",
          },
        },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      }
    );

    // Walk the renderer tree to find the first videoId
    const contents =
      res.data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents ?? [];

    for (const section of contents) {
      const items =
        section?.itemSectionRenderer?.contents ?? [];
      for (const item of items) {
        const videoId = item?.videoRenderer?.videoId;
        if (videoId) return videoId;
      }
    }

    return null;
  } catch {
    return null;
  }
}

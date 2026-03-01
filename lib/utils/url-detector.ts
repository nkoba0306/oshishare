import type { ContentType } from "@/lib/types/database";

export interface DetectedUrl {
  type: "youtube" | "x";
  contentType: ContentType;
  videoId?: string;
  tweetId?: string;
  originalUrl: string;
}

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
];

const X_PATTERNS = [
  /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
];

export function detectUrl(url: string): DetectedUrl | null {
  const trimmed = url.trim();

  // YouTube
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        type: "youtube",
        contentType: "stream", // チャンネルID確認後に clip に変更される可能性あり
        videoId: match[1],
        originalUrl: trimmed,
      };
    }
  }

  // X/Twitter
  for (const pattern of X_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        type: "x",
        contentType: "x_clip",
        tweetId: match[1],
        originalUrl: trimmed,
      };
    }
  }

  return null;
}

export function isVTuberChannel(
  channelId: string,
  vtuberChannelIds: string[]
): boolean {
  return vtuberChannelIds.includes(channelId);
}

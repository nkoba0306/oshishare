export interface YouTubeMetadata {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  duration: string;
  publishedAt: string;
  viewCount: number;
}

export interface XMetadata {
  tweetId: string;
  authorName: string;
  authorUrl: string;
  html: string;
}

export async function fetchYouTubeMetadata(
  videoId: string
): Promise<YouTubeMetadata> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
  );

  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

  const data = await res.json();
  const item = data.items?.[0];
  if (!item) throw new Error("Video not found");

  return {
    videoId,
    title: item.snippet.title,
    thumbnailUrl:
      item.snippet.thumbnails?.maxres?.url ||
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.default?.url,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    duration: item.contentDetails.duration,
    publishedAt: item.snippet.publishedAt,
    viewCount: parseInt(item.statistics.viewCount || "0", 10),
  };
}

export async function fetchXMetadata(tweetUrl: string): Promise<XMetadata> {
  const res = await fetch(
    `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`
  );

  if (!res.ok) throw new Error(`X oEmbed API error: ${res.status}`);

  const data = await res.json();
  const tweetIdMatch = tweetUrl.match(/status\/(\d+)/);

  return {
    tweetId: tweetIdMatch?.[1] ?? "",
    authorName: data.author_name,
    authorUrl: data.author_url,
    html: data.html,
  };
}

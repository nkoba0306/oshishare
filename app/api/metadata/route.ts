import { NextRequest, NextResponse } from "next/server";
import { detectUrl } from "@/lib/utils/url-detector";
import {
  fetchYouTubeMetadata,
  fetchXMetadata,
} from "@/lib/utils/metadata-fetcher";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URLが必要です" }, { status: 400 });
    }

    const detected = detectUrl(url);
    if (!detected) {
      return NextResponse.json(
        { error: "YouTube または X/Twitter のURLを入力してください" },
        { status: 400 }
      );
    }

    if (detected.type === "youtube" && detected.videoId) {
      const metadata = await fetchYouTubeMetadata(detected.videoId);

      // VTuber自動マッチング
      const supabase = await createClient();
      const { data: vtuber } = await supabase
        .from("vtubers")
        .select("id, name, avatar_url, channel_id")
        .eq("channel_id", metadata.channelId)
        .single();

      // チャンネルがVTuber本人なら stream、それ以外なら clip
      const contentType = vtuber ? "stream" : "clip";

      return NextResponse.json({
        type: "youtube",
        contentType,
        videoId: metadata.videoId,
        title: metadata.title,
        thumbnailUrl: metadata.thumbnailUrl,
        channelId: metadata.channelId,
        channelTitle: metadata.channelTitle,
        duration: metadata.duration,
        publishedAt: metadata.publishedAt,
        viewCount: metadata.viewCount,
        matchedVTuber: vtuber ?? null,
      });
    }

    if (detected.type === "x") {
      const metadata = await fetchXMetadata(detected.originalUrl);

      return NextResponse.json({
        type: "x",
        contentType: "x_clip",
        tweetId: metadata.tweetId,
        title: `${metadata.authorName}のポスト`,
        authorName: metadata.authorName,
        authorUrl: metadata.authorUrl,
        html: metadata.html,
        thumbnailUrl: null,
      });
    }

    return NextResponse.json({ error: "不明なURL形式です" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "メタデータの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

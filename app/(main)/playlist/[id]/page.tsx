import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PlaylistActions } from "@/components/playlist/playlist-actions";
import { ShareButtons } from "@/components/share/share-buttons";

interface PageProps {
  params: Promise<{ id: string }>;
}

const CONTENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  stream: { label: "本配信", color: "bg-blue-500/20 text-blue-400" },
  clip: { label: "切り抜き", color: "bg-green-500/20 text-green-400" },
  x_clip: { label: "Xクリップ", color: "bg-purple-500/20 text-purple-400" },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: playlist } = await supabase
    .from("playlists")
    .select("title, description")
    .eq("id", id)
    .single();

  if (!playlist) return { title: "再生リストが見つかりません" };

  return {
    title: playlist.title,
    description: playlist.description ?? `${playlist.title} - 推しシェア再生リスト`,
    openGraph: {
      title: `${playlist.title} | 推しシェア`,
      description: playlist.description ?? undefined,
    },
    twitter: { card: "summary" },
  };
}

export default async function PlaylistDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: playlist } = await supabase
    .from("playlists")
    .select(
      `*, profiles!playlists_user_id_fkey ( display_name, avatar_url )`
    )
    .eq("id", id)
    .single();

  if (!playlist) notFound();

  const { data: items } = await supabase
    .from("playlist_items")
    .select("*")
    .eq("playlist_id", id)
    .order("position", { ascending: true });

  // ユーザーのアクション状態
  let hasLiked = false;
  let hasBookmarked = false;
  if (user) {
    const [likeRes, bmRes] = await Promise.all([
      supabase
        .from("playlist_likes")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("playlist_id", id)
        .maybeSingle(),
      supabase
        .from("playlist_bookmarks")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("playlist_id", id)
        .maybeSingle(),
    ]);
    hasLiked = !!likeRes.data;
    hasBookmarked = !!bmRes.data;
  }

  const creator = playlist.profiles as Record<string, string> | null;
  const isOwner = user?.id === playlist.user_id;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = `${appUrl}/playlist/${id}`;

  return (
    <div className="space-y-6">
      {/* ヒーローセクション */}
      <div className="rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 p-6">
        <div className="flex items-start gap-4">
          {playlist.cover_url && (
            <img
              src={playlist.cover_url}
              alt=""
              className="h-24 w-40 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{playlist.title}</h1>
            {playlist.description && (
              <div className="mt-2">
                <span className="text-xs font-medium text-muted-foreground">用件</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {playlist.description}
                </p>
              </div>
            )}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={creator?.avatar_url ?? ""} />
                  <AvatarFallback className="text-[10px]">
                    {creator?.display_name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{creator?.display_name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {playlist.items_count}本
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* アクション */}
      <PlaylistActions
        playlistId={id}
        likesCount={playlist.likes_count}
        bookmarksCount={playlist.bookmarks_count}
        hasLiked={hasLiked}
        hasBookmarked={hasBookmarked}
        isOwner={isOwner}
      />

      {/* 動画リスト */}
      <div className="space-y-2">
        {items && items.length > 0 ? (
          items.map((item, index) => {
            const badge = CONTENT_TYPE_LABELS[item.content_type] ?? CONTENT_TYPE_LABELS.stream;
            return (
              <Link
                key={item.id}
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                  {index + 1}
                </span>
                {item.video_thumbnail_url && (
                  <img
                    src={item.video_thumbnail_url}
                    alt=""
                    className="h-16 w-28 flex-shrink-0 rounded object-cover"
                  />
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium line-clamp-1">
                    {item.video_title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.vtuber_name && <span>{item.vtuber_name}</span>}
                    <Badge className={badge.color + " text-[10px]"}>
                      {badge.label}
                    </Badge>
                    {item.duration && <span>{item.duration}</span>}
                  </div>
                  {item.comment && (
                    <p className="text-xs text-muted-foreground">
                      {item.comment}
                    </p>
                  )}
                </div>
              </Link>
            );
          })
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">
            動画がありません
          </p>
        )}
      </div>

      {/* 共有 */}
      {playlist.visibility !== "private" && (
        <ShareButtons
          url={shareUrl}
          text={`「${playlist.title}」再生リスト #推しシェア`}
        />
      )}
    </div>
  );
}

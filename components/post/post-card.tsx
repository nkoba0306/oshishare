"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, ThumbsUp, Bookmark, Star, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { approvePost, rejectPost, toggleLike, toggleBookmark } from "@/app/(main)/actions";

export interface PostCardData {
  id: string;
  content_type: string;
  status: string;
  source_url: string;
  video_title: string;
  video_thumbnail_url: string | null;
  comment: string;
  rating: number;
  likes_count: number;
  bookmarks_count: number;
  approvals_count: number;
  approvals_required: number;
  created_at: string;
  vtuber_name?: string;
  vtuber_avatar?: string;
  vtuber_id?: string;
  author_name?: string;
  author_avatar?: string;
  has_approved?: boolean;
  has_liked?: boolean;
  has_bookmarked?: boolean;
  user_trust_level?: string;
}

const CONTENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  stream: { label: "本配信", color: "bg-blue-500/20 text-blue-400" },
  clip: { label: "切り抜き", color: "bg-green-500/20 text-green-400" },
  x_clip: { label: "Xクリップ", color: "bg-purple-500/20 text-purple-400" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export function PostCard({
  post,
  showApproval = false,
}: {
  post: PostCardData;
  showApproval?: boolean;
}) {
  const [approved, setApproved] = useState(false);
  const [actionDone, setActionDone] = useState(post.has_approved ?? false);
  const [liked, setLiked] = useState(post.has_liked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [bookmarked, setBookmarked] = useState(post.has_bookmarked ?? false);
  const [bookmarksCount, setBookmarksCount] = useState(post.bookmarks_count);

  const isPending = post.status === "pending";
  const badge = CONTENT_TYPE_LABELS[post.content_type] ?? CONTENT_TYPE_LABELS.stream;
  const remaining = post.approvals_required - post.approvals_count;

  const handleApprove = async () => {
    setApproved(true);
    setActionDone(true);
    await approvePost(post.id);
  };

  const handleReject = async () => {
    setActionDone(true);
    await rejectPost(post.id);
  };

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));
    await toggleLike(post.id);
  };

  const handleBookmark = async () => {
    const next = !bookmarked;
    setBookmarked(next);
    setBookmarksCount((c) => c + (next ? 1 : -1));
    await toggleBookmark(post.id);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30">
      {/* サムネイル */}
      <Link href={post.source_url} target="_blank" rel="noopener noreferrer">
        <div className="relative aspect-video bg-muted">
          {post.video_thumbnail_url ? (
            <img
              src={post.video_thumbnail_url}
              alt={post.video_title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No Thumbnail
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
            <Play className="h-12 w-12 text-white" fill="white" />
          </div>
          {isPending && (
            <Badge className="absolute left-2 top-2 bg-yellow-500/90 text-white">
              承認待ち
            </Badge>
          )}
          <Badge className={cn("absolute right-2 top-2", badge.color)}>
            {badge.label}
          </Badge>
        </div>
      </Link>

      <div className="p-3 space-y-2">
        {/* VTuber情報 */}
        <div className="flex items-center gap-2">
          <Link href={post.vtuber_id ? `/vtuber/${post.vtuber_id}` : "#"}>
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.vtuber_avatar ?? ""} />
              <AvatarFallback className="text-[10px]">
                {post.vtuber_name?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <span className="text-sm font-medium">{post.vtuber_name}</span>
          <div className="ml-auto flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < post.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* タイトル・コメント */}
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {post.video_title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {post.comment}
        </p>

        {/* アクション or 承認ボタン */}
        {isPending && showApproval && !actionDone ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              あと{remaining > 0 ? remaining : 0}人の承認で公開されます
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1 text-green-400 hover:bg-green-500/10"
                onClick={handleApprove}
              >
                <CheckCircle className="h-4 w-4" /> 承認
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1 text-red-400 hover:bg-red-500/10"
                onClick={handleReject}
              >
                <XCircle className="h-4 w-4" /> 不適切
              </Button>
            </div>
          </div>
        ) : isPending && actionDone ? (
          <p className="text-xs text-muted-foreground">
            {approved ? "承認しました" : "報告しました"}
          </p>
        ) : (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 transition-colors hover:text-primary",
                liked && "text-primary"
              )}
            >
              <ThumbsUp className={cn("h-3.5 w-3.5", liked && "fill-current")} />
              {likesCount}
            </button>
            <button
              onClick={handleBookmark}
              className={cn(
                "flex items-center gap-1 transition-colors hover:text-accent",
                bookmarked && "text-accent"
              )}
            >
              <Bookmark className={cn("h-3.5 w-3.5", bookmarked && "fill-current")} />
              {bookmarksCount}
            </button>
          </div>
        )}

        {/* 投稿者 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{post.author_name}</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

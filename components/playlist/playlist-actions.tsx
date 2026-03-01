"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  togglePlaylistLike,
  togglePlaylistBookmark,
  deletePlaylist,
} from "@/app/(main)/playlist/actions";

export function PlaylistActions({
  playlistId,
  likesCount,
  bookmarksCount,
  hasLiked,
  hasBookmarked,
  isOwner,
}: {
  playlistId: string;
  likesCount: number;
  bookmarksCount: number;
  hasLiked: boolean;
  hasBookmarked: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(hasLiked);
  const [likes, setLikes] = useState(likesCount);
  const [bookmarked, setBookmarked] = useState(hasBookmarked);
  const [bookmarks, setBookmarks] = useState(bookmarksCount);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((c) => c + (next ? 1 : -1));
    await togglePlaylistLike(playlistId);
  };

  const handleBookmark = async () => {
    const next = !bookmarked;
    setBookmarked(next);
    setBookmarks((c) => c + (next ? 1 : -1));
    await togglePlaylistBookmark(playlistId);
  };

  const handleDelete = async () => {
    if (!confirm("この再生リストを削除しますか？")) return;
    await deletePlaylist(playlistId);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5", liked && "text-primary")}
        onClick={handleLike}
      >
        <ThumbsUp className={cn("h-4 w-4", liked && "fill-current")} />
        {likes}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5", bookmarked && "text-accent")}
        onClick={handleBookmark}
      >
        <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
        {bookmarks}
      </Button>
      {isOwner && (
        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-1.5 text-red-400 hover:bg-red-500/10"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" /> 削除
        </Button>
      )}
    </div>
  );
}

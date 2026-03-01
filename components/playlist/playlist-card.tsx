import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ListVideo, ThumbsUp } from "lucide-react";

export interface PlaylistCardData {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  items_count: number;
  likes_count: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

export function PlaylistCard({ playlist }: { playlist: PlaylistCardData }) {
  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card transition-colors hover:border-primary/30"
    >
      {/* カバー画像 */}
      <div className="relative h-32 w-full overflow-hidden rounded-t-xl bg-muted">
        {playlist.cover_url ? (
          <img
            src={playlist.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <ListVideo className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
        <Badge className="absolute right-2 top-2 gap-1 bg-black/60 text-white backdrop-blur-sm">
          <ListVideo className="h-3 w-3" />
          再生リスト
        </Badge>
      </div>

      {/* コンテンツ */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {playlist.title}
        </p>
        {playlist.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {playlist.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-4 w-4">
              <AvatarImage src={playlist.author_avatar ?? ""} />
              <AvatarFallback className="text-[8px]">
                {playlist.author_name?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span>{playlist.author_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{playlist.items_count}本</span>
            <span className="flex items-center gap-0.5">
              <ThumbsUp className="h-3 w-3" />
              {playlist.likes_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

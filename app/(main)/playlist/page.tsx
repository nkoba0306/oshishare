import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function PlaylistListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sort = typeof params.sort === "string" ? params.sort : "newest";

  const supabase = await createClient();

  let query = supabase
    .from("playlists")
    .select(
      `*, profiles!playlists_user_id_fkey ( display_name, avatar_url )`
    )
    .eq("visibility", "public");

  if (sort === "popular") {
    query = query.order("likes_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: playlists } = await query.limit(20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              再生リスト
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            みんなの再生リストを見つけよう
          </p>
        </div>
        <Link
          href="/playlist/new"
          className="flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" /> 作成
        </Link>
      </div>

      {/* ソート */}
      <div className="flex gap-2">
        <Link
          href="/playlist"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            sort === "newest"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          新着順
        </Link>
        <Link
          href="/playlist?sort=popular"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            sort === "popular"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          人気順
        </Link>
      </div>

      {/* リスト */}
      {playlists && playlists.length > 0 ? (
        <div className="space-y-3">
          {playlists.map((pl) => {
            const creator = pl.profiles as Record<string, string> | null;
            return (
              <Link
                key={pl.id}
                href={`/playlist/${pl.id}`}
                className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                {/* カバー画像 */}
                <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  {pl.cover_url ? (
                    <img
                      src={pl.cover_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      {pl.items_count}本
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <p className="font-medium line-clamp-1">{pl.title}</p>
                  {pl.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {pl.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={creator?.avatar_url ?? ""} />
                        <AvatarFallback className="text-[8px]">
                          {creator?.display_name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{creator?.display_name}</span>
                    </div>
                    <span>{pl.items_count}本</span>
                    <span>👍 {pl.likes_count}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            まだ再生リストがありません。最初のリストを作ろう！
          </p>
        </div>
      )}
    </div>
  );
}

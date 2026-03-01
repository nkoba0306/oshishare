import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VTuberSearch } from "@/components/explore/vtuber-search";

export default async function ExplorePage() {
  const supabase = await createClient();

  const [agenciesRes, tagsRes, popularVtubersRes] = await Promise.all([
    supabase
      .from("agencies")
      .select(`id, display_name, slug`)
      .order("display_name"),
    supabase
      .from("tags")
      .select("id, name, slug, post_count")
      .order("post_count", { ascending: false })
      .limit(30),
    supabase
      .from("vtubers")
      .select("id, name, avatar_url, favorites_count")
      .order("favorites_count", { ascending: false })
      .limit(12),
  ]);

  const agencies = agenciesRes.data ?? [];
  const tags = tagsRes.data ?? [];
  const popularVtubers = popularVtubersRes.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            探す
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          VTuber・事務所・タグから探す
        </p>
      </div>

      {/* VTuber検索 */}
      <VTuberSearch />

      {/* 事務所カテゴリ */}
      {agencies.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">事務所から探す</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agencies.map((agency) => (
              <a
                key={agency.id}
                href={`/?agency=${agency.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold">
                  {agency.display_name.charAt(0)}
                </div>
                <span className="font-medium">{agency.display_name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 人気VTuber */}
      {popularVtubers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">人気VTuber</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularVtubers.map((v) => (
              <a
                key={v.id}
                href={`/vtuber/${v.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={v.avatar_url ?? ""} />
                  <AvatarFallback>{v.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    お気に入り {v.favorites_count}人
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 人気タグ */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">人気タグ</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <a key={tag.id} href={`/?tag=${tag.slug}`}>
                <Badge
                  variant="secondary"
                  className="cursor-pointer px-3 py-1.5 text-sm hover:bg-primary/20 hover:text-primary"
                >
                  #{tag.name}
                  <span className="ml-1.5 text-xs opacity-60">
                    {tag.post_count}
                  </span>
                </Badge>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

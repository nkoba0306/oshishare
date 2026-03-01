import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PostCard, type PostCardData } from "@/components/post/post-card";
import { FavoriteButton } from "@/components/vtuber/favorite-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: vtuber } = await supabase
    .from("vtubers")
    .select("name, avatar_url, favorites_count")
    .eq("id", id)
    .single();

  if (!vtuber) return { title: "VTuberが見つかりません" };

  return {
    title: vtuber.name,
    description: `${vtuber.name}のおすすめ配信一覧 - お気に入り${vtuber.favorites_count}人`,
    openGraph: {
      title: `${vtuber.name} | 推しシェア`,
      description: `${vtuber.name}のおすすめ配信一覧`,
      ...(vtuber.avatar_url ? { images: [vtuber.avatar_url] } : {}),
    },
    twitter: {
      card: "summary",
      title: `${vtuber.name} | 推しシェア`,
    },
  };
}

export default async function VTuberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: vtuber } = await supabase
    .from("vtubers")
    .select(
      `
      *,
      agencies ( display_name ),
      groups ( name )
    `
    )
    .eq("id", id)
    .single();

  if (!vtuber) notFound();

  // 公開済み投稿
  const { data: posts } = await supabase
    .from("posts")
    .select(
      `
      *,
      vtubers ( id, name, avatar_url ),
      profiles!posts_user_id_fkey ( display_name, avatar_url )
    `
    )
    .eq("vtuber_id", id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  // 承認待ち投稿
  const { data: pendingPosts } = await supabase
    .from("posts")
    .select(
      `
      *,
      vtubers ( id, name, avatar_url ),
      profiles!posts_user_id_fkey ( display_name, avatar_url )
    `
    )
    .eq("vtuber_id", id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  // 投稿数
  const { count: postCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("vtuber_id", id)
    .eq("status", "published");

  // お気に入り状態
  let isFavorited = false;
  if (user) {
    const { data: fav } = await supabase
      .from("favorites")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("vtuber_id", id)
      .maybeSingle();
    isFavorited = !!fav;
  }

  // いいね・ブックマーク状態
  let likedPostIds: string[] = [];
  let bookmarkedPostIds: string[] = [];
  const allPostIds = [
    ...(posts?.map((p) => p.id) ?? []),
    ...(pendingPosts?.map((p) => p.id) ?? []),
  ];

  if (user && allPostIds.length > 0) {
    const [likesRes, bookmarksRes] = await Promise.all([
      supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", allPostIds),
      supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", allPostIds),
    ]);
    likedPostIds = likesRes.data?.map((l) => l.post_id) ?? [];
    bookmarkedPostIds = bookmarksRes.data?.map((b) => b.post_id) ?? [];
  }

  // 関連VTuber（同じ事務所/グループ）
  let relatedVtubers: { id: string; name: string; avatar_url: string | null }[] = [];
  if (vtuber.agency_id) {
    const { data } = await supabase
      .from("vtubers")
      .select("id, name, avatar_url")
      .eq("agency_id", vtuber.agency_id)
      .neq("id", id)
      .limit(10);
    relatedVtubers = data ?? [];
  }

  const agency = vtuber.agencies as { display_name: string } | null;
  const group = vtuber.groups as { name: string } | null;

  const mapPost = (post: Record<string, unknown>): PostCardData => {
    const v = post.vtubers as Record<string, string> | null;
    const p = post.profiles as Record<string, string> | null;
    const postId = post.id as string;
    return {
      id: postId,
      content_type: post.content_type as string,
      status: post.status as string,
      source_url: post.source_url as string,
      video_title: post.video_title as string,
      video_thumbnail_url: post.video_thumbnail_url as string | null,
      comment: post.comment as string,
      rating: post.rating as number,
      likes_count: post.likes_count as number,
      bookmarks_count: post.bookmarks_count as number,
      approvals_count: post.approvals_count as number,
      approvals_required: post.approvals_required as number,
      created_at: post.created_at as string,
      vtuber_name: v?.name,
      vtuber_avatar: v?.avatar_url,
      vtuber_id: v?.id,
      author_name: p?.display_name,
      author_avatar: p?.avatar_url,
      has_liked: likedPostIds.includes(postId),
      has_bookmarked: bookmarkedPostIds.includes(postId),
    };
  };

  return (
    <div className="space-y-6">
      {/* ヒーローセクション */}
      <div className="rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={vtuber.avatar_url ?? ""} />
            <AvatarFallback className="text-2xl">
              {vtuber.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{vtuber.name}</h1>
            <div className="mt-1 flex flex-wrap gap-2">
              {agency && (
                <Badge variant="secondary">{agency.display_name}</Badge>
              )}
              {group && <Badge variant="outline">{group.name}</Badge>}
            </div>
            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
              <span>おすすめ {postCount ?? 0}件</span>
              <span>お気に入り {vtuber.favorites_count}人</span>
            </div>
            <div className="mt-3">
              <FavoriteButton
                vtuberId={id}
                isFavorited={isFavorited}
                count={vtuber.favorites_count}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 承認待ち */}
      {pendingPosts && pendingPosts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">承認待ち</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pendingPosts.map((post) => (
              <PostCard
                key={post.id}
                post={mapPost(post as unknown as Record<string, unknown>)}
                showApproval
              />
            ))}
          </div>
        </div>
      )}

      {/* おすすめ一覧 */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">おすすめ</h2>
        {posts && posts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={mapPost(post as unknown as Record<string, unknown>)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            まだおすすめ投稿がありません
          </p>
        )}
      </div>

      {/* 関連VTuber */}
      {relatedVtubers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">関連VTuber</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {relatedVtubers.map((v) => (
              <a
                key={v.id}
                href={`/vtuber/${v.id}`}
                className="flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-secondary"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={v.avatar_url ?? ""} />
                  <AvatarFallback>{v.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="w-16 truncate text-center text-xs">
                  {v.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

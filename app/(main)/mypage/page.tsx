import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostCard, type PostCardData } from "@/components/post/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MyPageTabs } from "@/components/mypage/mypage-tabs";

const TRUST_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "新規ユーザー", color: "bg-gray-500/20 text-gray-400" },
  trusted: { label: "信頼ユーザー", color: "bg-blue-500/20 text-blue-400" },
  senior: { label: "上級ユーザー", color: "bg-yellow-500/20 text-yellow-400" },
};

function mapPost(
  post: Record<string, unknown>,
  likedIds: string[],
  bookmarkedIds: string[]
): PostCardData {
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
    has_liked: likedIds.includes(postId),
    has_bookmarked: bookmarkedIds.includes(postId),
  };
}

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const tab = typeof params.tab === "string" ? params.tab : "posts";

  // プロフィール取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const trust = TRUST_LABELS[profile.trust_level] ?? TRUST_LABELS.new;

  // タブに応じたデータ取得
  let myPosts: PostCardData[] = [];
  let likedPosts: PostCardData[] = [];
  let bookmarkedPosts: PostCardData[] = [];
  let favoriteVtubers: { id: string; name: string; avatar_url: string | null; favorites_count: number }[] = [];

  if (tab === "posts") {
    const { data } = await supabase
      .from("posts")
      .select(
        `*, vtubers ( id, name, avatar_url ), profiles!posts_user_id_fkey ( display_name, avatar_url )`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const postIds = data?.map((p) => p.id) ?? [];
    let likedIds: string[] = [];
    let bookmarkedIds: string[] = [];
    if (postIds.length > 0) {
      const [l, b] = await Promise.all([
        supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
        supabase.from("bookmarks").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      ]);
      likedIds = l.data?.map((x) => x.post_id) ?? [];
      bookmarkedIds = b.data?.map((x) => x.post_id) ?? [];
    }
    myPosts = data?.map((p) => mapPost(p as unknown as Record<string, unknown>, likedIds, bookmarkedIds)) ?? [];
  } else if (tab === "liked") {
    const { data: likeRows } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const likePostIds = likeRows?.map((r) => r.post_id) ?? [];
    if (likePostIds.length > 0) {
      const { data } = await supabase
        .from("posts")
        .select(
          `*, vtubers ( id, name, avatar_url ), profiles!posts_user_id_fkey ( display_name, avatar_url )`
        )
        .in("id", likePostIds)
        .eq("status", "published");

      const { data: bookmarkRows } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", likePostIds);

      const bookmarkedIds = bookmarkRows?.map((b) => b.post_id) ?? [];
      likedPosts = data?.map((p) => mapPost(p as unknown as Record<string, unknown>, likePostIds, bookmarkedIds)) ?? [];
    }
  } else if (tab === "bookmarked") {
    const { data: bmRows } = await supabase
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const bmPostIds = bmRows?.map((r) => r.post_id) ?? [];
    if (bmPostIds.length > 0) {
      const { data } = await supabase
        .from("posts")
        .select(
          `*, vtubers ( id, name, avatar_url ), profiles!posts_user_id_fkey ( display_name, avatar_url )`
        )
        .in("id", bmPostIds)
        .eq("status", "published");

      const { data: likeRows } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", bmPostIds);

      const likedIds = likeRows?.map((l) => l.post_id) ?? [];
      bookmarkedPosts = data?.map((p) => mapPost(p as unknown as Record<string, unknown>, likedIds, bmPostIds)) ?? [];
    }
  } else if (tab === "favorites") {
    const { data: favRows } = await supabase
      .from("favorites")
      .select("vtuber_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const favVtuberIds = favRows?.map((r) => r.vtuber_id) ?? [];
    if (favVtuberIds.length > 0) {
      const { data } = await supabase
        .from("vtubers")
        .select("id, name, avatar_url, favorites_count")
        .in("id", favVtuberIds);
      favoriteVtubers = data ?? [];
    }
  }

  // 統計
  const [postsCountRes, likesCountRes, bookmarksCountRes] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("likes").select("post_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("bookmarks").select("post_id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const stats = {
    posts: postsCountRes.count ?? 0,
    likes: likesCountRes.count ?? 0,
    bookmarks: bookmarksCountRes.count ?? 0,
  };

  const currentPosts =
    tab === "posts" ? myPosts :
    tab === "liked" ? likedPosts :
    tab === "bookmarked" ? bookmarkedPosts : [];

  return (
    <div className="space-y-6">
      {/* プロフィールヘッダー */}
      <div className="rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={profile.avatar_url ?? ""} />
            <AvatarFallback className="text-xl">
              {profile.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{profile.display_name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <div className="mt-1 flex gap-2">
              <Badge className={trust.color}>{trust.label}</Badge>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{stats.posts}</strong> 投稿</span>
          <span><strong className="text-foreground">{stats.likes}</strong> いいね</span>
          <span><strong className="text-foreground">{stats.bookmarks}</strong> ブックマーク</span>
        </div>
      </div>

      {/* タブ */}
      <MyPageTabs currentTab={tab} />

      {/* コンテンツ */}
      {tab === "favorites" ? (
        favoriteVtubers.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteVtubers.map((v) => (
              <a
                key={v.id}
                href={`/vtuber/${v.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <Avatar className="h-12 w-12">
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
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">
            お気に入りのVTuberはまだありません
          </p>
        )
      ) : currentPosts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {currentPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-8">
          {tab === "posts" && "まだ投稿がありません"}
          {tab === "liked" && "いいねした投稿はまだありません"}
          {tab === "bookmarked" && "ブックマークした投稿はまだありません"}
        </p>
      )}
    </div>
  );
}

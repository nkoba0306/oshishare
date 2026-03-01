import { createClient } from "@/lib/supabase/server";
import { PostCard, type PostCardData } from "@/components/post/post-card";
import { FeedFilter } from "@/components/feed/feed-filter";

interface FeedSearchParams {
  sort?: string;
  agency?: string;
  content_type?: string;
  tag?: string;
}

async function getFeedPosts(searchParams: FeedSearchParams): Promise<PostCardData[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sort = searchParams.sort ?? "newest";

  // 公開済み投稿
  let publishedQuery = supabase
    .from("posts")
    .select(
      `
      *,
      vtubers ( id, name, avatar_url, agency_id ),
      profiles!posts_user_id_fkey ( display_name, avatar_url )
    `
    )
    .eq("status", "published");

  // フィルタ適用
  if (searchParams.content_type) {
    publishedQuery = publishedQuery.eq("content_type", searchParams.content_type);
  }

  // ソート
  if (sort === "popular") {
    publishedQuery = publishedQuery.order("likes_count", { ascending: false });
  } else {
    publishedQuery = publishedQuery.order("published_at", { ascending: false });
  }

  const { data: published } = await publishedQuery.limit(20);

  // 事務所フィルタ（VTuber JOIN後にフィルタ）
  let filteredPublished = published ?? [];
  if (searchParams.agency) {
    filteredPublished = filteredPublished.filter((p) => {
      const v = p.vtubers as Record<string, string> | null;
      return v?.agency_id === searchParams.agency;
    });
  }

  // 承認待ち投稿
  let pending: typeof published = [];
  if (user) {
    const query = supabase
      .from("posts")
      .select(
        `
        *,
        vtubers ( id, name, avatar_url ),
        profiles!posts_user_id_fkey ( display_name, avatar_url )
      `
      )
      .eq("status", "pending")
      .neq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data } = await query;
    pending = data;
  }

  // ユーザーのアクション状態チェック
  let approvedPostIds: string[] = [];
  let likedPostIds: string[] = [];
  let bookmarkedPostIds: string[] = [];

  if (user) {
    const allPostIds = [
      ...(pending?.map((p) => p.id) ?? []),
      ...filteredPublished.map((p) => p.id),
    ];

    if (allPostIds.length > 0) {
      const [approvalsRes, likesRes, bookmarksRes] = await Promise.all([
        pending && pending.length > 0
          ? supabase
              .from("approvals")
              .select("post_id")
              .eq("user_id", user.id)
              .in("post_id", pending.map((p) => p.id))
          : { data: [] },
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

      approvedPostIds = approvalsRes.data?.map((a) => a.post_id) ?? [];
      likedPostIds = likesRes.data?.map((l) => l.post_id) ?? [];
      bookmarkedPostIds = bookmarksRes.data?.map((b) => b.post_id) ?? [];
    }
  }

  const mapPost = (post: Record<string, unknown>, isPending: boolean): PostCardData => {
    const vtuber = post.vtubers as Record<string, string> | null;
    const profile = post.profiles as Record<string, string> | null;
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
      vtuber_name: vtuber?.name,
      vtuber_avatar: vtuber?.avatar_url,
      vtuber_id: vtuber?.id,
      author_name: profile?.display_name,
      author_avatar: profile?.avatar_url,
      has_approved: isPending ? approvedPostIds.includes(postId) : false,
      has_liked: likedPostIds.includes(postId),
      has_bookmarked: bookmarkedPostIds.includes(postId),
    };
  };

  const feed: PostCardData[] = [];

  const pendingMapped =
    pending
      ?.filter((p) => !approvedPostIds.includes(p.id))
      .map((p) => mapPost(p as unknown as Record<string, unknown>, true)) ?? [];
  const publishedMapped = filteredPublished.map((p) =>
    mapPost(p as unknown as Record<string, unknown>, false)
  );

  feed.push(...pendingMapped, ...publishedMapped);

  return feed;
}

async function getFilterOptions() {
  const supabase = await createClient();

  const [agenciesRes, tagsRes] = await Promise.all([
    supabase.from("agencies").select("id, display_name").order("display_name"),
    supabase.from("tags").select("id, name, slug, post_count").order("post_count", { ascending: false }).limit(20),
  ]);

  return {
    agencies: agenciesRes.data ?? [],
    tags: tagsRes.data ?? [],
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const feedParams: FeedSearchParams = {
    sort: typeof params.sort === "string" ? params.sort : undefined,
    agency: typeof params.agency === "string" ? params.agency : undefined,
    content_type: typeof params.content_type === "string" ? params.content_type : undefined,
    tag: typeof params.tag === "string" ? params.tag : undefined,
  };

  const [posts, filterOptions] = await Promise.all([
    getFeedPosts(feedParams),
    getFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ホーム
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          みんなのおすすめ配信をチェックしよう
        </p>
      </div>

      <FeedFilter
        agencies={filterOptions.agencies}
        currentSort={feedParams.sort}
        currentAgency={feedParams.agency}
        currentContentType={feedParams.content_type}
      />

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            まだ投稿がありません。最初のおすすめを投稿しよう！
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              showApproval={post.status === "pending"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

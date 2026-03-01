import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PostCard, type PostCardData } from "@/components/post/post-card";
import { ShareButtons } from "@/components/share/share-buttons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(`*, vtubers ( name )`)
    .eq("id", id)
    .single();

  if (!post) return { title: "投稿が見つかりません" };

  const vtuber = post.vtubers as { name: string } | null;
  const title = vtuber
    ? `${vtuber.name} - ${post.video_title}`
    : post.video_title;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const ogUrl = new URL("/api/og", appUrl);
  ogUrl.searchParams.set("title", post.video_title);
  if (vtuber) ogUrl.searchParams.set("vtuber", vtuber.name);
  ogUrl.searchParams.set("comment", post.comment ?? "");
  ogUrl.searchParams.set("type", post.content_type);
  ogUrl.searchParams.set("rating", String(post.rating));
  ogUrl.searchParams.set("likes", String(post.likes_count));
  if (post.video_thumbnail_url) {
    ogUrl.searchParams.set("thumbnail", post.video_thumbnail_url);
  }

  return {
    title,
    description: post.comment,
    openGraph: {
      title,
      description: post.comment,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.comment,
      images: [ogUrl.toString()],
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post } = await supabase
    .from("posts")
    .select(
      `
      *,
      vtubers ( id, name, avatar_url ),
      profiles!posts_user_id_fkey ( display_name, avatar_url )
    `
    )
    .eq("id", id)
    .single();

  if (!post) notFound();

  // ユーザーのアクション状態
  let hasLiked = false;
  let hasBookmarked = false;
  if (user) {
    const [likeRes, bmRes] = await Promise.all([
      supabase
        .from("likes")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("post_id", id)
        .maybeSingle(),
      supabase
        .from("bookmarks")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("post_id", id)
        .maybeSingle(),
    ]);
    hasLiked = !!likeRes.data;
    hasBookmarked = !!bmRes.data;
  }

  const v = post.vtubers as Record<string, string> | null;
  const p = post.profiles as Record<string, string> | null;

  const postData: PostCardData = {
    id: post.id,
    content_type: post.content_type,
    status: post.status,
    source_url: post.source_url,
    video_title: post.video_title,
    video_thumbnail_url: post.video_thumbnail_url,
    comment: post.comment,
    rating: post.rating,
    likes_count: post.likes_count,
    bookmarks_count: post.bookmarks_count,
    approvals_count: post.approvals_count,
    approvals_required: post.approvals_required,
    created_at: post.created_at,
    vtuber_name: v?.name,
    vtuber_avatar: v?.avatar_url,
    vtuber_id: v?.id,
    author_name: p?.display_name,
    author_avatar: p?.avatar_url,
    has_liked: hasLiked,
    has_bookmarked: hasBookmarked,
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = `${appUrl}/post/${id}`;
  const shareText = v
    ? `${v.name}のおすすめ配信を見つけた！ #推しシェア`
    : `おすすめ配信を見つけた！ #推しシェア`;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PostCard post={postData} />

      {post.status === "published" && (
        <ShareButtons url={shareUrl} text={shareText} />
      )}
    </div>
  );
}

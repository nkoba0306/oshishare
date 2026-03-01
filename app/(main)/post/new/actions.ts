"use server";

import { createClient } from "@/lib/supabase/server";
import { postSchema } from "@/lib/validations/post";

export async function createPost(formData: {
  sourceUrl: string;
  vtuber_id: string;
  comment: string;
  rating: number;
  tags: string[];
  contentType: string;
  videoId?: string;
  tweetId?: string;
  videoTitle: string;
  videoThumbnailUrl?: string;
  videoPublishedAt?: string;
  videoDuration?: string;
  parentPostId?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const parsed = postSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // 重複チェック
  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_url", formData.sourceUrl)
    .single();

  if (existing) {
    return { error: "このURLは既に投稿済みです" };
  }

  // 投稿保存
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      vtuber_id: formData.vtuber_id,
      content_type: formData.contentType,
      source_url: formData.sourceUrl,
      video_id: formData.videoId ?? null,
      tweet_id: formData.tweetId ?? null,
      video_title: formData.videoTitle,
      video_thumbnail_url: formData.videoThumbnailUrl ?? null,
      video_published_at: formData.videoPublishedAt ?? null,
      video_duration: formData.videoDuration ?? null,
      parent_post_id: formData.parentPostId ?? null,
      comment: formData.comment,
      rating: formData.rating,
    })
    .select("id")
    .single();

  if (postError) {
    return { error: postError.message };
  }

  // タグ保存
  if (formData.tags.length > 0) {
    for (const tagName of formData.tags) {
      const slug = tagName.toLowerCase().replace(/\s+/g, "-");

      // タグを取得または作成
      let { data: tag } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!tag) {
        const { data: newTag } = await supabase
          .from("tags")
          .insert({ name: tagName, slug })
          .select("id")
          .single();
        tag = newTag;
      }

      if (tag) {
        await supabase
          .from("post_tags")
          .insert({ post_id: post.id, tag_id: tag.id });
      }
    }
  }

  return { success: true, postId: post.id };
}

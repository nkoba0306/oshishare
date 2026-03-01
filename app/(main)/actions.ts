"use server";

import { createClient } from "@/lib/supabase/server";

export async function approvePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("approvals")
    .insert({ user_id: user.id, post_id: postId, action: "approve" });

  if (error) {
    if (error.code === "23505") return { error: "既に承認済みです" };
    return { error: error.message };
  }
  return { success: true };
}

export async function rejectPost(postId: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("approvals")
    .insert({ user_id: user.id, post_id: postId, action: "reject", reason });

  if (error) {
    if (error.code === "23505") return { error: "既に報告済みです" };
    return { error: error.message };
  }
  return { success: true };
}

// ♡ お気に入り（VTuber）トグル
export async function toggleFavorite(vtuberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: existing } = await supabase
    .from("favorites")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("vtuber_id", vtuberId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("vtuber_id", vtuberId);
    await supabase.rpc("increment_counter", {
      table_name: "vtubers",
      row_id: vtuberId,
      column_name: "favorites_count",
      amount: -1,
    });
    return { favorited: false };
  } else {
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, vtuber_id: vtuberId });
    if (error) return { error: error.message };
    await supabase.rpc("increment_counter", {
      table_name: "vtubers",
      row_id: vtuberId,
      column_name: "favorites_count",
      amount: 1,
    });
    return { favorited: true };
  }
}

// 👍 いいね（投稿）トグル
export async function toggleLike(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: existing } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    await supabase.rpc("increment_counter", {
      table_name: "posts",
      row_id: postId,
      column_name: "likes_count",
      amount: -1,
    });
    return { liked: false };
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ user_id: user.id, post_id: postId });
    if (error) return { error: error.message };
    await supabase.rpc("increment_counter", {
      table_name: "posts",
      row_id: postId,
      column_name: "likes_count",
      amount: 1,
    });
    return { liked: true };
  }
}

// 🔖 ブックマーク（投稿）トグル
export async function toggleBookmark(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    await supabase.rpc("increment_counter", {
      table_name: "posts",
      row_id: postId,
      column_name: "bookmarks_count",
      amount: -1,
    });
    return { bookmarked: false };
  } else {
    const { error } = await supabase
      .from("bookmarks")
      .insert({ user_id: user.id, post_id: postId });
    if (error) return { error: error.message };
    await supabase.rpc("increment_counter", {
      table_name: "posts",
      row_id: postId,
      column_name: "bookmarks_count",
      amount: 1,
    });
    return { bookmarked: true };
  }
}

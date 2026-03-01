"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PlaylistItem {
  source_url: string;
  video_title: string;
  video_thumbnail_url?: string;
  vtuber_name?: string;
  content_type: string;
  duration?: string;
  comment?: string;
  position: number;
}

export async function createPlaylist(formData: {
  title: string;
  description?: string;
  visibility: string;
  items: PlaylistItem[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  if (!formData.title.trim()) return { error: "タイトルは必須です" };
  if (formData.items.length === 0) return { error: "最低1本の動画を追加してください" };

  const { data: playlist, error } = await supabase
    .from("playlists")
    .insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      visibility: formData.visibility,
      items_count: formData.items.length,
      cover_url: formData.items[0]?.video_thumbnail_url || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const itemsToInsert = formData.items.map((item) => ({
    playlist_id: playlist.id,
    source_url: item.source_url,
    video_title: item.video_title,
    video_thumbnail_url: item.video_thumbnail_url || null,
    vtuber_name: item.vtuber_name || null,
    content_type: item.content_type,
    duration: item.duration || null,
    comment: item.comment || null,
    position: item.position,
  }));

  const { error: itemsError } = await supabase
    .from("playlist_items")
    .insert(itemsToInsert);

  if (itemsError) return { error: itemsError.message };

  redirect(`/playlist/${playlist.id}`);
}

export async function deletePlaylist(playlistId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", playlistId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  redirect("/playlist");
}

export async function togglePlaylistLike(playlistId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: existing } = await supabase
    .from("playlist_likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("playlist_id", playlistId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("playlist_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("playlist_id", playlistId);
    await supabase.rpc("increment_counter", {
      table_name: "playlists",
      row_id: playlistId,
      column_name: "likes_count",
      amount: -1,
    });
    return { liked: false };
  } else {
    await supabase
      .from("playlist_likes")
      .insert({ user_id: user.id, playlist_id: playlistId });
    await supabase.rpc("increment_counter", {
      table_name: "playlists",
      row_id: playlistId,
      column_name: "likes_count",
      amount: 1,
    });
    return { liked: true };
  }
}

export async function togglePlaylistBookmark(playlistId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: existing } = await supabase
    .from("playlist_bookmarks")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("playlist_id", playlistId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("playlist_bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("playlist_id", playlistId);
    await supabase.rpc("increment_counter", {
      table_name: "playlists",
      row_id: playlistId,
      column_name: "bookmarks_count",
      amount: -1,
    });
    return { bookmarked: false };
  } else {
    await supabase
      .from("playlist_bookmarks")
      .insert({ user_id: user.id, playlist_id: playlistId });
    await supabase.rpc("increment_counter", {
      table_name: "playlists",
      row_id: playlistId,
      column_name: "bookmarks_count",
      amount: 1,
    });
    return { bookmarked: true };
  }
}

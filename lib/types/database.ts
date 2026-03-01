// Supabase 型定義（将来的に supabase gen types で自動生成に置き換え）

export type ContentType = "stream" | "clip" | "x_clip";
export type PostStatus = "pending" | "published" | "rejected";
export type TrustLevel = "new" | "trusted" | "senior";
export type ApprovalAction = "approve" | "reject";
export type PlaylistVisibility = "public" | "unlisted" | "private";

export interface Agency {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  agency_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  twitter_handle: string | null;
  trust_level: TrustLevel;
  approved_posts_count: number;
  created_at: string;
  updated_at: string;
}

export interface VTuber {
  id: string;
  channel_id: string;
  name: string;
  name_reading: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  subscriber_count: number | null;
  description: string | null;
  agency_id: string | null;
  group_id: string | null;
  favorites_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  vtuber_id: string;
  content_type: ContentType;
  status: PostStatus;
  source_url: string;
  video_id: string | null;
  tweet_id: string | null;
  video_title: string;
  video_thumbnail_url: string | null;
  video_published_at: string | null;
  video_duration: string | null;
  parent_post_id: string | null;
  comment: string;
  rating: number;
  approvals_count: number;
  approvals_required: number;
  likes_count: number;
  bookmarks_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  post_count: number;
  created_at: string;
}

export interface Approval {
  id: string;
  user_id: string;
  post_id: string;
  action: ApprovalAction;
  reason: string | null;
  created_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  visibility: PlaylistVisibility;
  cover_url: string | null;
  items_count: number;
  likes_count: number;
  bookmarks_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  post_id: string | null;
  source_url: string;
  video_title: string;
  video_thumbnail_url: string | null;
  vtuber_name: string | null;
  content_type: ContentType;
  duration: string | null;
  comment: string | null;
  position: number;
  created_at: string;
}

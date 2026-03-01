-- ========================================
-- 推しシェア 初期スキーマ
-- ========================================

-- ========================================
-- マスタデータ
-- ========================================

-- 事務所マスタ
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- グループマスタ
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザープロフィール（Supabase Authと連携）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  twitter_handle TEXT,
  trust_level TEXT NOT NULL DEFAULT 'new'
    CHECK (trust_level IN ('new', 'trusted', 'senior')),
  approved_posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VTuber（配信者）マスタ
CREATE TABLE vtubers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_reading TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  subscriber_count INTEGER,
  description TEXT,
  agency_id UUID REFERENCES agencies(id),
  group_id UUID REFERENCES groups(id),
  favorites_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- おすすめ投稿
-- ========================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vtuber_id UUID NOT NULL REFERENCES vtubers(id),
  content_type TEXT NOT NULL DEFAULT 'stream'
    CHECK (content_type IN ('stream', 'clip', 'x_clip')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'rejected')),
  source_url TEXT NOT NULL,
  video_id TEXT,
  tweet_id TEXT,
  video_title TEXT NOT NULL,
  video_thumbnail_url TEXT,
  video_published_at TIMESTAMPTZ,
  video_duration TEXT,
  parent_post_id UUID REFERENCES posts(id),
  comment TEXT NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 500),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  approvals_count INTEGER DEFAULT 0,
  approvals_required INTEGER NOT NULL DEFAULT 3,
  likes_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_url)
);

-- タグ
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 投稿-タグ中間テーブル
CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ========================================
-- 承認システム
-- ========================================

CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- ========================================
-- ユーザーアクション（3種類）
-- ========================================

-- お気に入り（VTuberに対する推し登録）
CREATE TABLE favorites (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vtuber_id UUID REFERENCES vtubers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, vtuber_id)
);

-- いいね（個別投稿に対する評価）
CREATE TABLE likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ブックマーク（個別投稿の保存）
CREATE TABLE bookmarks (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ========================================
-- 再生リスト
-- ========================================

CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description TEXT CHECK (char_length(description) <= 500),
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'unlisted', 'private')),
  cover_url TEXT,
  items_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  video_title TEXT NOT NULL,
  video_thumbnail_url TEXT,
  vtuber_name TEXT,
  content_type TEXT DEFAULT 'stream'
    CHECK (content_type IN ('stream', 'clip', 'x_clip')),
  duration TEXT,
  comment TEXT CHECK (char_length(comment) <= 200),
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, source_url)
);

CREATE TABLE playlist_likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, playlist_id)
);

CREATE TABLE playlist_bookmarks (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, playlist_id)
);

-- ========================================
-- インデックス
-- ========================================

-- posts
CREATE INDEX idx_posts_vtuber_id ON posts(vtuber_id);
CREATE INDEX idx_posts_content_type ON posts(content_type);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_likes_count ON posts(likes_count DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_parent_post_id ON posts(parent_post_id);

-- approvals
CREATE INDEX idx_approvals_post_id ON approvals(post_id);
CREATE INDEX idx_approvals_user_id ON approvals(user_id);

-- vtubers
CREATE INDEX idx_vtubers_channel_id ON vtubers(channel_id);
CREATE INDEX idx_vtubers_agency_id ON vtubers(agency_id);
CREATE INDEX idx_vtubers_group_id ON vtubers(group_id);
CREATE INDEX idx_vtubers_favorites_count ON vtubers(favorites_count DESC);

-- tags
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX idx_tags_slug ON tags(slug);

-- favorites
CREATE INDEX idx_favorites_vtuber_id ON favorites(vtuber_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- groups
CREATE INDEX idx_groups_agency_id ON groups(agency_id);

-- playlists
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlists_visibility ON playlists(visibility);
CREATE INDEX idx_playlists_likes_count ON playlists(likes_count DESC);
CREATE INDEX idx_playlists_created_at ON playlists(created_at DESC);
CREATE INDEX idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX idx_playlist_items_position ON playlist_items(playlist_id, position);

-- ========================================
-- RLS（Row Level Security）
-- ========================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vtubers ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_bookmarks ENABLE ROW LEVEL SECURITY;

-- マスタデータ: 全員閲覧可能
CREATE POLICY "Public agencies" ON agencies FOR SELECT USING (true);
CREATE POLICY "Public groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Public vtubers" ON vtubers FOR SELECT USING (true);
CREATE POLICY "Public tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Public post_tags" ON post_tags FOR SELECT USING (true);
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public favorites read" ON favorites FOR SELECT USING (true);

-- 投稿: 公開済み・承認待ち・自分の投稿を閲覧可能
CREATE POLICY "Posts visible" ON posts FOR SELECT
  USING (status = 'published' OR status = 'pending' OR auth.uid() = user_id);

-- 承認: 全員閲覧可能
CREATE POLICY "Public approvals read" ON approvals FOR SELECT USING (true);

-- プロフィール CRUD
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 投稿 CRUD
CREATE POLICY "Users create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- 承認・アクション
CREATE POLICY "Users manage own approvals" ON approvals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own likes" ON likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public likes read" ON likes FOR SELECT USING (true);
CREATE POLICY "Users manage own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public bookmarks read" ON bookmarks FOR SELECT USING (true);
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- 再生リスト
CREATE POLICY "Public playlists" ON playlists FOR SELECT
  USING (visibility = 'public' OR visibility = 'unlisted' OR auth.uid() = user_id);
CREATE POLICY "Users manage own playlists" ON playlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public playlist items" ON playlist_items FOR SELECT USING (true);
CREATE POLICY "Users manage own playlist items" ON playlist_items FOR ALL
  USING (auth.uid() = (SELECT user_id FROM playlists WHERE id = playlist_id));
CREATE POLICY "Users manage own playlist likes" ON playlist_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public playlist likes read" ON playlist_likes FOR SELECT USING (true);
CREATE POLICY "Users manage own playlist bookmarks" ON playlist_bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public playlist bookmarks read" ON playlist_bookmarks FOR SELECT USING (true);

-- ========================================
-- DBトリガー
-- ========================================

-- 承認処理トリガー
CREATE OR REPLACE FUNCTION handle_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action = 'approve' THEN
    UPDATE posts SET
      approvals_count = approvals_count + 1,
      status = CASE
        WHEN approvals_count + 1 >= approvals_required THEN 'published'
        ELSE status
      END,
      published_at = CASE
        WHEN approvals_count + 1 >= approvals_required THEN NOW()
        ELSE published_at
      END
    WHERE id = NEW.post_id;

    -- 公開されたら投稿者の承認済みカウント更新＋信頼度レベル昇格チェック
    IF (SELECT status FROM posts WHERE id = NEW.post_id) = 'published' THEN
      UPDATE profiles SET
        approved_posts_count = approved_posts_count + 1,
        trust_level = CASE
          WHEN approved_posts_count + 1 >= 50 THEN 'senior'
          WHEN approved_posts_count + 1 >= 10 THEN 'trusted'
          ELSE trust_level
        END
      WHERE id = (SELECT user_id FROM posts WHERE id = NEW.post_id);
    END IF;
  ELSIF NEW.action = 'reject' THEN
    -- 不適切報告が2件に達したら rejected に
    IF (SELECT COUNT(*) FROM approvals WHERE post_id = NEW.post_id AND action = 'reject') >= 2 THEN
      UPDATE posts SET status = 'rejected' WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_approval_insert
AFTER INSERT ON approvals
FOR EACH ROW EXECUTE FUNCTION handle_approval();

-- 投稿作成時に信頼度に応じた必要承認数を設定
CREATE OR REPLACE FUNCTION set_approval_requirements()
RETURNS TRIGGER AS $$
DECLARE
  user_trust TEXT;
BEGIN
  SELECT trust_level INTO user_trust FROM profiles WHERE id = NEW.user_id;

  IF user_trust = 'senior' THEN
    NEW.approvals_required := 0;
    NEW.status := 'published';
    NEW.published_at := NOW();
  ELSIF user_trust = 'trusted' THEN
    NEW.approvals_required := 1;
  ELSE
    NEW.approvals_required := 3;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_post_insert
BEFORE INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION set_approval_requirements();

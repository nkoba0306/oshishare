# Phase 1-A: プロジェクト基盤・DB・レイアウト（Day 1-2）

## 目的
Next.js + Supabase の基盤構築、DBスキーマ投入、レスポンシブレイアウトの実装

## タスク

### 1. 依存パッケージ追加
- [x] `@supabase/supabase-js` / `@supabase/ssr` インストール
- [x] `shadcn/ui` セットアップ（Button, Input, Textarea, Dialog, Tabs, Badge, Avatar, Card, DropdownMenu 等）
- [x] `zustand` インストール（クライアント状態管理）
- [x] `react-hook-form` + `zod` インストール（フォームバリデーション）
- [x] `lucide-react` インストール（アイコン）

### 2. プロジェクト構成
```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── callback/page.tsx
├── (main)/
│   ├── layout.tsx          ← ボトムナビ/サイドバー共通レイアウト
│   ├── page.tsx            ← ホームフィード
│   ├── explore/page.tsx    ← 探す
│   ├── post/new/page.tsx   ← 投稿作成
│   ├── vtuber/[id]/page.tsx ← VTuber詳細
│   ├── playlist/
│   │   ├── page.tsx        ← 再生リスト一覧
│   │   ├── new/page.tsx    ← 再生リスト作成
│   │   └── [id]/page.tsx   ← 再生リスト詳細
│   ├── mypage/page.tsx     ← マイページ
│   └── settings/page.tsx   ← 設定
├── api/
│   ├── og/route.tsx        ← OGP画像生成
│   └── metadata/route.ts   ← URL→メタデータ取得
├── layout.tsx              ← ルートレイアウト
└── globals.css
lib/
├── supabase/
│   ├── client.ts           ← ブラウザ用Supabaseクライアント
│   ├── server.ts           ← サーバー用Supabaseクライアント
│   └── middleware.ts       ← セッション更新ミドルウェア
├── types/
│   └── database.ts         ← Supabase型定義（自動生成）
└── utils/
    ├── url-detector.ts     ← URL種別判別
    └── metadata-fetcher.ts ← メタデータ取得
components/
├── layout/
│   ├── bottom-nav.tsx      ← モバイルボトムナビ
│   ├── sidebar.tsx         ← デスクトップサイドバー
│   ├── header.tsx          ← トップバー
│   └── app-shell.tsx       ← レスポンシブシェル
├── post/
│   ├── post-card.tsx       ← 投稿カード
│   ├── post-form.tsx       ← 投稿フォーム
│   └── post-actions.tsx    ← いいね/ブックマークボタン
├── vtuber/
│   ├── vtuber-card.tsx     ← VTuberカード
│   └── vtuber-selector.tsx ← VTuber選択ドロップダウン
└── playlist/
    ├── playlist-card.tsx   ← 再生リストカード
    └── playlist-form.tsx   ← 再生リスト作成フォーム
```

### 3. Supabase セットアップ
- [x] Supabaseプロジェクト作成
- [x] 環境変数設定（`.env.local`）
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [x] Supabaseクライアント初期化（ブラウザ用/サーバー用）
- [x] ミドルウェア設定（セッション更新）

### 4. DBスキーマ投入
以下のテーブルを作成（idea/03_technical_architecture.md のSQL定義に準拠）:
- [x] `agencies`（事務所マスタ）
- [x] `groups`（グループマスタ）
- [x] `profiles`（ユーザープロフィール: 信頼度レベル付き）
- [x] `vtubers`（VTuberマスタ）
- [x] `posts`（おすすめ投稿: 承認ステータス付き）
- [x] `tags` / `post_tags`（タグ）
- [x] `approvals`（承認/不適切報告）
- [x] `favorites`（♡お気に入り: ユーザー⇔VTuber）
- [x] `likes`（👍いいね: ユーザー⇔投稿）
- [x] `bookmarks`（🔖ブックマーク: ユーザー⇔投稿）
- [x] `playlists` / `playlist_items`（再生リスト: 07_playlist.md参照）
- [x] インデックス作成
- [x] RLSポリシー設定
- [x] DBトリガー2つ:
  - `handle_approval()` — 承認数到達で自動公開＋信頼度昇格
  - `set_approval_requirements()` — 投稿時に信頼度に応じた必要承認数を設定

### 5. レスポンシブレイアウト実装
Stitchデザインに基づく:
- [x] `app-shell.tsx`: モバイル（ボトムナビ）/ デスクトップ（サイドバー）の切替
- [x] `bottom-nav.tsx`: ホーム / 探す / 投稿する(+) / お気に入り / マイページ
- [x] `sidebar.tsx`: 左サイドバーナビ（デスクトップ `lg:` 以上）
- [x] `header.tsx`: ロゴ + 検索 + 通知 + ユーザーアバター
- [x] ダークテーマ設定（パープル/ピンクグラデーションアクセント）
- [x] Tailwind CSS テーマカスタマイズ（`globals.css`）

## 完了条件
- [x] Supabaseに全テーブル・RLS・トリガーが投入されている
- [x] レスポンシブレイアウト（ボトムナビ/サイドバー）が動作する
- [x] ダークテーマが適用されている
- [x] `npm run dev` でエラーなく起動する

# 推しシェア - 開発タスク一覧

## フェーズ構成

| フェーズ | 期間 | 概要 | ドキュメント |
|---------|------|------|------------|
| Phase 1-A | Day 1-2 | プロジェクト基盤・DB・レイアウト | [01_foundation.md](./01_foundation.md) |
| Phase 1-B | Day 3-4 | 認証（Google/X OAuth） | [02_auth.md](./02_auth.md) |
| Phase 1-C | Day 5-6 | 投稿機能（マルチソース） | [03_post.md](./03_post.md) |
| Phase 1-D | Day 7-8 | 承認システム・フィード表示 | [04_approval-feed.md](./04_approval-feed.md) |
| Phase 1-E | Day 9-10 | フィルタ・ソート・3つのアクション | [05_filter-actions.md](./05_filter-actions.md) |
| Phase 1-F | Day 11-12 | SNS共有・OGP画像生成 | [06_share-ogp.md](./06_share-ogp.md) |
| Phase 1-G | Day 13-14 | 再生リスト機能 | [07_playlist.md](./07_playlist.md) |
| Phase 1-H | Day 15-16 | マスタデータ投入・デプロイ・テスト | [08_deploy.md](./08_deploy.md) |

## 技術スタック

- **フロントエンド**: Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- **BaaS**: Supabase (PostgreSQL + Auth + Storage)
- **ホスティング**: Vercel
- **画像ストレージ**: Cloudflare R2
- **外部API**: YouTube Data API v3 / X oEmbed API

## Stitchデザイン

プロジェクトID: `8750880156755033078`

### モバイル版
- ホームフィード（フィルタ・ソート・カード型おすすめ一覧・ボトムナビ）
- 投稿作成（URL貼り付け→自動プレビュー→VTuber選択→タグ→投稿）
- VTuber詳細（プロフィール・おすすめ一覧・関連VTuber）
- マイページ（ユーザー情報・信頼レベルバッジ・タブ切替）
- 再生リスト作成（タイトル・用件・動画追加・公開設定）
- 再生リスト詳細（用件表示・全再生・番号付き動画リスト）
- 再生リスト一覧（カード型ブラウズ・ソート）

### デスクトップ版
- ホームフィード（左サイドバー・3カラムグリッド・右サイドバー）
- 投稿作成（中央フォーム・左サイドバー）
- VTuber詳細（ワイドレイアウト・サイドバー）
- マイページ（3カラムグリッド・サイドバー）

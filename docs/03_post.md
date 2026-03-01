# Phase 1-C: 投稿機能（Day 5-6）

## 目的
URL入力でYouTube本配信/切り抜き/Xクリップを自動判別し、メタデータ取得→投稿

## タスク

### 1. URL種別判別ロジック（`lib/utils/url-detector.ts`）
- [x] YouTube URL判定（`youtube.com/watch`, `youtu.be`）
- [x] X/Twitter URL判定（`twitter.com`, `x.com`）
- [x] 動画IDの抽出
- [x] コンテンツ種別の自動判定:
  - VTuber本人のチャンネル → `stream`（本配信）
  - それ以外のチャンネル → `clip`（切り抜き）
  - X/Twitter → `x_clip`（Xクリップ）

### 2. メタデータ取得API（`app/api/metadata/route.ts`）
- [x] YouTube Data API v3 連携
  - 環境変数: `YOUTUBE_API_KEY`
  - 取得項目: title, thumbnailUrl, channelId, channelTitle, duration, publishedAt, viewCount
  - API使用量: 1ユニット/リクエスト（1日10,000ユニット無料）
- [x] X oEmbed API 連携
  - `https://publish.twitter.com/oembed?url=...`（認証不要）
  - 取得項目: authorName, authorUrl, html（埋め込みHTML）
- [x] VTuber自動マッチング（channelIdでvtubersテーブルを検索）
- [x] エラーハンドリング（無効URL、API制限、非公開動画等）

### 3. 投稿フォーム（Stitchデザイン準拠）
- [x] URL入力フィールド + 貼り付けボタン
- [x] URL入力後の自動プレビュー表示:
  - サムネイル画像
  - タイトル、チャンネル名、再生時間
  - 種別バッジ（本配信 / 切り抜き / Xクリップ）
- [x] VTuber選択（検索可能ドロップダウン）
  - 自動マッチング結果をデフォルト選択
  - 手動変更も可能
- [x] タグ入力（チップ形式、既存タグのサジェスト、新規作成可能）
- [x] おすすめコメント入力（テキストエリア、1〜500文字）
- [x] おすすめ度（1〜5の星評価）
- [ ] 切り抜きの場合: 元配信URLの紐づけ（任意）
- [x] 「投稿する」ボタン（グラデーション）
- [x] react-hook-form + zod によるバリデーション

### 4. 投稿保存処理
- [x] Server Action または API Route で投稿を `posts` テーブルに保存
- [x] ステータスは `pending`（承認待ち）で保存（DBトリガーが信頼度に応じて変更）
- [x] タグの保存（`tags` + `post_tags`）
- [x] 同一ユーザー・同一URLの重複投稿チェック
- [x] 投稿成功後のフィードバック表示

## 完了条件
- [x] YouTube / X のURLを貼り付けるとメタデータが自動取得される
- [x] 種別バッジが正しく表示される
- [x] 投稿がDBに保存され、承認待ちステータスになる
- [x] バリデーションエラーが適切に表示される

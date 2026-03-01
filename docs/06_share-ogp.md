# Phase 1-F: SNS共有・OGP画像生成（Day 11-12）

## 目的
動的OGP画像の生成とTwitter/X・LINE共有ボタンの実装

## タスク

### 1. OGP画像生成（`app/api/og/route.tsx`）
- [x] `@vercel/og` (Satori) を使用したEdge Functionでの動的生成
- [x] OGP画像仕様（1200x630px）:
  - VTuberチャンネルアイコン
  - 配信サムネイル
  - 配信タイトル（最大2行）
  - コンテンツ種別バッジ: [本配信] [切り抜き] [Xクリップ]
  - おすすめコメント抜粋（最大3行）
  - ★評価 + いいね数
  - 推しシェアロゴ
- [ ] 日本語フォント対応（Noto Sans JP）
- [x] ダークテーマデザイン（パープル/ピンクアクセント）
- [x] キャッシュ設定（Cache-Control）

### 2. メタデータ設定
- [x] 投稿詳細ページの `generateMetadata` で動的OGP設定
  - `og:title`: VTuber名 + 配信タイトル
  - `og:description`: おすすめコメント
  - `og:image`: OGP画像URL
  - `twitter:card`: `summary_large_image`
- [x] VTuber詳細ページのOGP
- [ ] 再生リスト詳細ページのOGP
- [x] トップページのデフォルトOGP

### 3. SNS共有ボタン
- [x] Twitter/X共有ボタン（Web Intent API）
  - `https://twitter.com/intent/tweet?text=...&url=...`
  - テキスト: 「[VTuber名]のおすすめ配信を見つけた！ #推しシェア」
- [x] LINE共有ボタン
  - `https://social-plugins.line.me/lineit/share?url=...`
- [x] URL直接コピーボタン
- [x] 共有は**公開済み投稿のみ**可能（承認待ちは共有不可）

### 4. 再生リスト共有
- [ ] 再生リスト用OGP画像（サムネイルグリッド + タイトル + 用件抜粋）
- [ ] 再生リスト共有ボタン

## 完了条件
- [x] OGP画像が動的に生成される（投稿・VTuber）
- [x] Twitter/X・LINE共有ボタンが動作する
- [x] 共有されたURLのOGPプレビューがSNS上で正しく表示される
- [x] 承認待ち投稿の共有ボタンは非表示

# 技術アーキテクチャ・MVP設計書

## 推しシェア - VTuber配信おすすめ共有プラットフォーム

---

## 1. 技術スタック選定

### 1.1 フロントエンドフレームワーク

| 項目 | Next.js 15 (React) | Nuxt 4 (Vue) |
|------|-------------------|---------------|
| エコシステム | 非常に大きい | 大きい |
| バンドルサイズ | 32-40KB (React 19) | 18-22KB (Vue 3.5) |
| SSR/SSG | App Router + RSC対応 | Nitroエンジン搭載 |
| 学習コスト | やや高い（RSC概念） | 低い（直感的） |
| BaaS連携 | Supabase公式SDKあり | Supabase公式SDKあり |
| OGP生成 | @vercel/og（ネイティブ） | 別途設定が必要 |
| ホスティング | Vercelと完全統合 | Cloudflare/Vercel対応 |
| 日本語情報 | 豊富 | やや少ない |

**選定: Next.js 15 (App Router)**

理由:
- Vercelとの完全統合により、OGP画像の動的生成が`@vercel/og`でシームレスに実現可能
- React Server Componentsによりクライアントバンドルの最小化が可能
- Supabase公式のNext.js向けヘルパー（`@supabase/ssr`）が充実
- 日本語の技術情報・コミュニティが豊富で個人開発に有利
- TypeScript対応が成熟している

### 1.2 バックエンド / BaaS

| 項目 | Supabase | Firebase | PlanetScale |
|------|----------|----------|-------------|
| DB種別 | PostgreSQL (RDB) | Firestore (NoSQL) | MySQL (RDB) |
| 無料枠DB容量 | 500MB | 1GB | サービス終了(※) |
| 認証 | 50,000 MAU | 無制限 | なし |
| リアルタイム | あり | あり（強力） | なし |
| RLS (行レベルセキュリティ) | PostgreSQL RLS | Firestoreルール | なし |
| Edge Functions | Deno ベース | Cloud Functions | なし |
| ベンダーロックイン | 低（OSS・セルフホスト可） | 高（Google Cloud依存） | - |
| 料金体系 | 定額 + 従量 | 完全従量（読み書き課金） | - |
| ストレージ | 1GB無料 | 5GB無料 | なし |

※ PlanetScaleは2024年に無料プランを廃止

**選定: Supabase**

理由:
- PostgreSQLベースでリレーショナルなデータモデルに最適（VTuber/タグ/投稿の関係性が複雑）
- Row Level Security (RLS) でサーバーレスでもセキュアなデータアクセスが可能
- 予測可能な料金体系（Firebaseの従量課金は個人開発者にリスク）
- OSSのためベンダーロックインが低く、将来的にセルフホスト移行可能
- 認証（OAuth）、ストレージ、Edge Functionsが一括で利用可能
- 無料枠：500MB DB + 1GB Storage + 50,000 MAU

**注意点**: 無料プランは7日間非アクティブでプロジェクトが一時停止される。MVP検証期間中は定期的なアクセスまたはcronジョブで対応。本番移行時はPro（$25/月）への移行を推奨。

### 1.3 ホスティング

| 項目 | Vercel (Hobby) | Cloudflare Pages | Netlify |
|------|---------------|-----------------|---------|
| 帯域幅 | 100GB/月 | 無制限 | 100GB/月 |
| ビルド | 6,000分/月 | 500ビルド/月 | 300分/月 |
| Serverless関数 | 150,000回/月 | Workers 100,000回/日 | 125,000回/月 |
| 関数実行時間 | 60秒 | 10ms CPU / 30秒 | 10秒 |
| 商用利用 | 不可（Hobby） | 可 | 可 |
| Edge対応 | あり | あり（強力） | あり |
| Next.js対応 | 完全 | 部分的 | 部分的 |

**選定: Vercel (Hobby → 成長後 Pro)**

理由:
- Next.jsの開発元であり、App Router / RSC / OG画像生成等の最新機能を完全サポート
- Hobby Plan（無料）で月10万PV程度まで対応可能
- ISR（Incremental Static Regeneration）が標準でサポートされ、パフォーマンスとコストを両立
- 商用化段階でPro（$20/月）に移行

**補足**: CDNとしてCloudflare（無料）を前段に配置し、帯域幅の節約とDDoS防御を実現する構成も検討可能。

### 1.4 その他の技術選定

| 用途 | 技術 | 理由 |
|------|------|------|
| OGP画像生成 | @vercel/og (Satori) | Edge Functionで動的生成、JSXでテンプレート記述 |
| 画像ストレージ | Cloudflare R2 | 10GB無料、エグレス無料、CDN配信込み |
| スタイリング | Tailwind CSS v4 | ユーティリティファースト、モバイルファースト設計に最適 |
| UIコンポーネント | shadcn/ui | コピー&ペースト型、軽量、レスポンシブ対応済み |
| 状態管理 | Zustand / React Server Components | 軽量、RSCとの相性良好 |
| フォーム | React Hook Form + Zod | バリデーション一体型 |
| アナリティクス | Vercel Analytics (無料枠) / Umami | プライバシーフレンドリー |
| メール | Resend (無料枠: 100通/日) | 開発者フレンドリーなAPIメール |

### 1.5 スマホ対応戦略

VTuberファンの60%がモバイル視聴というデータを踏まえ、**モバイルファースト**で設計する。

**フェーズ別対応:**

| フェーズ | 方式 | 内容 |
|---------|------|------|
| Phase 1（MVP） | **モバイルファーストUI** | Tailwind CSSのレスポンシブ設計、タッチ操作最適化、ビューポート最適化 |
| Phase 2（1ヶ月） | **PWA化** | Service Worker、ホーム画面追加、オフラインキャッシュ、Web Push通知（Android） |
| Phase 4（1年〜） | **Capacitor** | App Store / Google Play公開、ネイティブプッシュ通知（iOS含む） |

**方式選定の理由:**

| 方式 | 開発コスト | ストア公開 | プッシュ通知 | 選定理由 |
|------|-----------|-----------|------------|---------|
| PWA | ほぼゼロ（Web流用） | 不要 | Android○ / iOS△ | SNS共有→即利用の導線を妨げない。インストール不要 |
| Capacitor | 低（Webをラップ） | App Store/Google Play | フル対応 | 既存Next.jsコードをそのままラップ可能。作り直し不要 |
| ネイティブ（Flutter等） | 高（別開発） | App Store/Google Play | フル対応 | 個人開発には過剰。採用しない |

**Phase 1: モバイルファーストUI設計方針:**

```
レスポンシブブレークポイント:
  - sm (640px~): スマホ横向き
  - md (768px~): タブレット
  - lg (1024px~): デスクトップ
  ※ デフォルトスタイルがスマホ縦向き（モバイルファースト）

タッチ操作の最適化:
  - タップターゲット最小44x44px（Apple HIG準拠）
  - スワイプジェスチャー対応（投稿カードの横スワイプで承認/不適切）
  - ボトムナビゲーション（モバイル時）/ サイドバー（デスクトップ時）

モバイル特有のUI:
  ┌──────────────────────┐
  │ [検索]    ロゴ   [通知] │  ← ヘッダー
  ├──────────────────────┤
  │                        │
  │  フィード / 投稿カード   │  ← メインコンテンツ
  │  （縦スクロール）        │
  │                        │
  ├──────────────────────┤
  │ 🏠  🔍  ➕  ♡  👤    │  ← ボトムナビ
  │ ホーム 探す 投稿 推し マイ │
  └──────────────────────┘

投稿カード（モバイル）:
  ┌──────────────────────┐
  │ [サムネイル画像]        │
  │ [本配信] ★★★★☆ 👍12   │
  │ ぺこらのマイクラ建築配信 │
  │ 「神回すぎた...」       │
  │ @user123 · 2時間前     │
  └──────────────────────┘

パフォーマンス最適化:
  - 画像の遅延読み込み（Intersection Observer）
  - 無限スクロール（ページネーションではなく）
  - Service Workerによるプリキャッシュ
  - next/image による画像サイズ最適化（WebP/AVIF自動変換）
```

**Phase 2: PWA設定:**

```typescript
// next.config.js に next-pwa を追加
// Service Worker による:
//   - 静的アセットのプリキャッシュ
//   - APIレスポンスのランタイムキャッシュ（stale-while-revalidate）
//   - オフライン時のフォールバックページ

// manifest.json
{
  "name": "推しシェア",
  "short_name": "推しシェア",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Phase 4: Capacitor移行（MAU 2〜3万超過時）:**
```
移行手順:
1. npx cap init でCapacitorプロジェクト初期化
2. 既存Next.jsのビルド出力をCapacitorでラップ
3. ネイティブプッシュ通知プラグイン追加（@capacitor/push-notifications）
4. App Store / Google Play 審査・公開
5. ディープリンク設定（SNS共有URLからアプリ直接起動）

コスト:
- Apple Developer Program: $99/年（約15,000円/年）
- Google Play Developer: $25（一回のみ）
```

---

## 2. コア機能設計（MVP）

### 2.1 おすすめ投稿機能（マルチソース対応）

```
投稿フロー:
1. ユーザーがURLを入力（YouTube本配信 / YouTube切り抜き / X(Twitter)クリップ）
2. URLから自動判別し、対応するAPIでメタデータ取得
   - YouTube → Data API v3（1ユニット/リクエスト、1日10,000ユニット無料）
   - X(Twitter) → oEmbed API（認証不要、無料）
3. コンテンツ種別の自動タグ付け: [本配信] [切り抜き] [Xクリップ]
4. VTuber情報の自動紐付け（チャンネルIDベースでDBマッチング）
5. 切り抜き/クリップの場合 → 元配信URLの紐づけ（任意）
6. ユーザーがおすすめコメント入力（140-500文字）
7. タグ選択/新規作成（例：#歌枠 #ゲーム実況 #雑談 #コラボ）
8. おすすめ度（1-5段階）設定
9. 投稿 → ステータス「承認待ち（pending）」で保存
10. 他ユーザーが承認 → 必要数に達したら「公開（published）」に昇格
11. OGP画像自動生成 → 共有可能に

※ ホスティングは一切しない。すべてリンク共有のみ。
```

### 2.1.1 コミュニティ承認システム

投稿の品質を担保し、不適切なリンクの登録を防ぐため、コミュニティによる承認制を採用する。

**投稿ステータス:**
```
pending（承認待ち）→ published（公開） or rejected（却下）

投稿 → [pending] → 必要数の承認を獲得 → [published]（正式公開）
              ↓
         一定数の「不適切」報告 → [rejected]（却下・非公開）
```

**ユーザー信頼度と必要承認数:**

| レベル | 条件 | 必要承認数 | 承認権限 |
|--------|------|-----------|---------|
| 新規ユーザー | 初期状態 | 3人 | なし |
| 信頼ユーザー | 承認済み投稿10件以上 | 1人 | あり（他者の投稿を承認可能） |
| 上級ユーザー | 承認済み投稿50件以上 | 0（即公開） | あり + 却下権限 |

**承認待ち投稿の表示ルール:**
```
表示場所:
- トップページ（新着順）: 正式投稿の間に承認待ちを適度に混ぜて表示
- VTuber別ページ: そのVTuberの承認待ちを上部にまとめて表示
- お気に入りフィード: お気に入りVTuberの承認待ちを優先表示（最も効果的）

表示方法:
- 「🔍 承認待ち」バッジを目立つように表示
- いいね/ブックマーク/共有ボタンの代わりに [✅ 承認する] [❌ 不適切] ボタンを表示
- 「あとN人の承認で公開されます」の進捗表示
- リンク先のプレビュー（サムネイル、タイトル、チャンネル名）を表示し判断を容易に

制限:
- 承認待ち投稿はSNS共有不可（公開後に共有可能になる）
- 投稿者本人のマイページでは常に自分の承認待ち投稿を確認可能
```

**承認者が確認すること:**
```
1. リンク先が実際にVTuber関連のコンテンツか？
2. 選択されたVTuberと一致しているか？
3. コメントが適切か（スパム・宣伝・攻撃的でないか）？
```

**却下ルール:**
```
- 「不適切」報告が2件に達した投稿は自動的に rejected に
- 上級ユーザーは1人で即却下可能
- 却下された投稿は投稿者にのみ理由付きで通知
- 却下が3回累積したユーザーは新規→信頼への昇格条件が厳しくなる
```

**メタデータ自動取得の詳細:**

```typescript
// コンテンツ種別
type ContentType = 'stream' | 'clip' | 'x_clip';

// URL判別ロジック
function detectContentType(url: string): ContentType {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'x_clip';
  // YouTube: 切り抜きチャンネルか本配信かはチャンネルIDで判別
  // VTuber本人のチャンネル → 'stream'、それ以外 → 'clip'
  return isOfficialChannel(url) ? 'stream' : 'clip';
}

// YouTube メタデータ
interface YouTubeMetadata {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: number;
  liveBroadcastContent: 'live' | 'upcoming' | 'none';
}

// X(Twitter) メタデータ（oEmbed API経由）
interface XClipMetadata {
  tweetId: string;
  authorName: string;
  authorUrl: string;
  html: string;  // 埋め込み用HTML
  thumbnailUrl?: string;
}
```

### 2.2 SNS共有機能

**Twitter/X共有:**
- Web Intent APIを使用（API認証不要）
- `https://twitter.com/intent/tweet?text=...&url=...`
- 動的OGP画像付き（@vercel/ogで生成）
- OGPに含める情報：VTuber名、配信タイトル、サムネイル、おすすめコメント抜粋

**LINE共有:**
- LINE URLスキーム使用
- `https://social-plugins.line.me/lineit/share?url=...`
- OGPが自動的にプレビュー表示される

**OGP画像生成仕様:**
```
サイズ: 1200x630px
内容:
  - VTuberチャンネルアイコン
  - 配信サムネイル
  - 配信タイトル（最大2行）
  - コンテンツ種別バッジ: [本配信] [切り抜き] [Xクリップ]
  - おすすめコメント抜粋（最大3行）
  - ★評価 + いいね数
  - 推しシェアロゴ
フォント: Noto Sans JP（日本語対応）
```

### 2.3 ユーザー認証

**Supabase Auth + OAuth プロバイダー:**

| プロバイダー | 理由 |
|------------|------|
| Google | VTuberファンの主要プラットフォーム（YouTube連携の親和性） |
| Twitter/X | VTuberコミュニティの主要SNS、共有との相乗効果 |

**認証フロー:**
```
1. 「Googleでログイン」「Xでログイン」ボタン
2. Supabase Auth → OAuth リダイレクト
3. コールバック → JWTセッション発行
4. クライアント側でSupabase Client自動認証
5. RLSにより認証済みユーザーのみがCRUD操作可能
```

### 2.4 3つのユーザーアクション

```
♡ お気に入り（VTuberに対する）:
- 「この人が推し」というファン登録
- マイページにお気に入りVTuber一覧を表示
- お気に入りVTuberの新着おすすめをフィードに表示
- レコメンドエンジンの入力データ（最重要）
- 1ユーザーが複数VTuberをお気に入り可能

👍 いいね（個別投稿に対する）:
- 「このおすすめ投稿が参考になった」の評価
- 楽観的UI更新（即座にUI反映、バックグラウンドでDB更新）
- いいね数によるソート・人気ランキング
- 1ユーザー1投稿につき1回

🔖 ブックマーク（個別投稿に対する）:
- 「後で見る」的な保存機能
- マイページからブックマーク一覧表示
- フォルダ分類（Phase 2以降）
```

### 2.5 ブラウズ・絞り込み機能

```
階層フィルタリング:
- 事務所別: [すべて] [カバー(ホロライブ)] [ANYCOLOR(にじさんじ)] [ぶいすぽ] [個人勢] ...
- グループ別: [すべて] [JP] [EN] [ID] [ホロスターズ] ...
- VTuber別: 特定VTuberのプロフィールページ

コンテンツ種別フィルタ:
- [すべて] [本配信] [切り抜き] [Xクリップ]

タグ別:
- タグ一覧ページ（人気順・新着順）
- タグ詳細ページ（そのタグが付いた投稿一覧）
- 複数タグでの絞り込み

ソート:
- いいね多い順（人気順）
- 新着順（投稿日時）

トレンド:
- 直近24時間/週間のいいね数によるランキング
- 新着投稿フィード
```

### 2.6 レコメンド機能（Phase 3）

```
「このVTuberが好きな人はこの人も好き」:
- お気に入りデータを使った協調フィルタリング
- 一致率（%）付きで表示

ロジック:
1. ユーザーAがお気に入りにしているVTuber集合を取得
2. 同じVTuberをお気に入りにしている他ユーザー群を検索
3. そのユーザー群が他にお気に入りにしているVTuberを集計
4. ユーザーAがまだお気に入りにしていないVTuberを一致率順に提案

表示例:
  ぺこら＋マリンをお気に入りの人の82% → 「さくらみこ」も好き
  ぺこら＋スバルをお気に入りの人の71% → 「大神ミオ」も好き

プレミアム差別化:
- 無料: 上位3件のみ表示
- プレミアム: 全件表示 + 詳細な一致率分析
```

---

## 3. データモデル設計

### 3.1 ER図（主要テーブル）

```
┌──────────────┐
│   agencies   │  事務所マスタ
├──────────────┤
│ id (PK)      │
│ name         │──┐
│ slug         │  │
│ website_url  │  │
│ created_at   │  │
└──────────────┘  │
                   │ 1:N
┌──────────────┐  │
│    groups    │  │  グループマスタ
├──────────────┤  │
│ id (PK)      │  │
│ agency_id(FK)│──┘
│ name         │──┐
│ slug         │  │
│ created_at   │  │
└──────────────┘  │
                   │ 1:N
┌─────────────┐   │  ┌──────────────┐     ┌─────────────┐
│   profiles   │  │  │    posts     │     │   vtubers   │
├─────────────┤   │  ├──────────────┤     ├─────────────┤
│ id (PK/FK)  │──┼─<│ user_id (FK) │  ┌─>│ id (PK)     │
│ username     │  │  │ id (PK)      │  │  │ channel_id  │
│ display_name │  │  │ vtuber_id(FK)│──┘  │ name        │
│ avatar_url   │  │  │ content_type │     │ agency_id(FK)│──┐
│ bio          │  │  │ source_url   │     │ group_id(FK) │──┘
│ twitter_     │  │  │ video_id     │     │ avatar_url  │
│  handle      │  │  │ video_title  │     │ subscriber_# │
│ created_at   │  │  │ thumbnail_url│     │ favorites_# │
│ updated_at   │  │  │ parent_post  │     │ created_at  │
└─────────────┘  │  │  _id (FK)    │     │ updated_at  │
                  │  │ comment      │     └─────────────┘
                  │  │ rating (1-5) │            ^
                  │  │ likes_count  │            │
                  │  │ created_at   │     ┌──────────────┐
                  │  │ updated_at   │     │  favorites   │ お気に入り
                  │  └──────┬───────┘     ├──────────────┤ (VTuberに対する)
                  │         │             │ user_id (FK) │
                  │         │             │ vtuber_id(FK)│
       ┌──────────┼─────────┼──────┐      │ created_at   │
       │          │         │      │      └──────────────┘
       v          │         v      v
┌──────────────┐  │  ┌────────┐ ┌──────────────┐
│  post_tags   │  │  │ likes  │ │  bookmarks   │
├──────────────┤  │  ├────────┤ ├──────────────┤
│ post_id (FK) │  │  │user_id │ │ user_id (FK) │
│ tag_id (FK)  │  │  │post_id │ │ post_id (FK) │
└──────────────┘  │  │created │ │ created_at   │
       ^          │  └────────┘ └──────────────┘
       │          │
┌──────────────┐  │
│     tags     │  │
├──────────────┤  │
│ id (PK)      │  │
│ name         │  │
│ slug         │  │
│ post_count   │  │
│ created_at   │  │
└──────────────┘  │
```

### 3.2 テーブル定義詳細

```sql
-- ========================================
-- マスタデータ
-- ========================================

-- 事務所マスタ
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,               -- 例: カバー株式会社, ANYCOLOR
  slug TEXT UNIQUE NOT NULL,               -- 例: hololive, nijisanji
  display_name TEXT NOT NULL,              -- 例: ホロライブ, にじさんじ
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- グループマスタ
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  name TEXT NOT NULL,                      -- 例: ホロライブJP, NIJISANJI EN
  slug TEXT UNIQUE NOT NULL,               -- 例: hololive-jp, nijisanji-en
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
    CHECK (trust_level IN ('new', 'trusted', 'senior')),  -- 信頼度レベル
  approved_posts_count INTEGER DEFAULT 0,                   -- 承認済み投稿数（カウンターキャッシュ）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VTuber（配信者）マスタ
CREATE TABLE vtubers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT UNIQUE NOT NULL,          -- YouTubeチャンネルID
  name TEXT NOT NULL,
  name_reading TEXT,                         -- 読み仮名（検索用）
  avatar_url TEXT,
  banner_url TEXT,
  subscriber_count INTEGER,
  description TEXT,
  agency_id UUID REFERENCES agencies(id),   -- 所属事務所（NULLなら個人勢）
  group_id UUID REFERENCES groups(id),      -- 所属グループ（NULLなら未分類）
  favorites_count INTEGER DEFAULT 0,         -- お気に入り数（カウンターキャッシュ）
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- おすすめ投稿（マルチソース対応）
-- ========================================

-- おすすめ投稿
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vtuber_id UUID NOT NULL REFERENCES vtubers(id),
  content_type TEXT NOT NULL DEFAULT 'stream'
    CHECK (content_type IN ('stream', 'clip', 'x_clip')),  -- 本配信/切り抜き/Xクリップ
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'rejected')), -- 承認ステータス
  source_url TEXT NOT NULL,                  -- 元URL（YouTube URL or X URL）
  video_id TEXT,                             -- YouTube動画ID（Xクリップの場合NULL）
  tweet_id TEXT,                             -- XツイートID（YouTube系の場合NULL）
  video_title TEXT NOT NULL,
  video_thumbnail_url TEXT,
  video_published_at TIMESTAMPTZ,
  video_duration TEXT,
  parent_post_id UUID REFERENCES posts(id), -- 元配信の投稿ID（切り抜き→元配信の紐づけ）
  comment TEXT NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 500),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  approvals_count INTEGER DEFAULT 0,         -- 承認数（カウンターキャッシュ）
  approvals_required INTEGER NOT NULL DEFAULT 3, -- 必要承認数（信頼度に応じて変動）
  likes_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,                  -- 正式公開日時（承認完了時にセット）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_url)               -- 同一ユーザーは同じURLに1回のみ投稿可能
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

-- ✅ 承認（投稿に対する承認/不適切報告）
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),  -- 承認 or 不適切報告
  reason TEXT,                               -- 不適切報告の理由（任意）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)                   -- 同一ユーザーは同じ投稿に1回のみ
);

-- ========================================
-- ユーザーアクション（3種類）
-- ========================================

-- ♡ お気に入り（VTuberに対する推し登録）
CREATE TABLE favorites (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vtuber_id UUID REFERENCES vtubers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, vtuber_id)
);

-- 👍 いいね（個別投稿に対する評価）
CREATE TABLE likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- 🔖 ブックマーク（個別投稿の保存）
CREATE TABLE bookmarks (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
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

-- ========================================
-- RLS（Row Level Security）ポリシー
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 全員が閲覧可能（マスタデータ）
CREATE POLICY "Public vtubers" ON vtubers FOR SELECT USING (true);
CREATE POLICY "Public tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Public agencies" ON agencies FOR SELECT USING (true);
CREATE POLICY "Public groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public favorites read" ON favorites FOR SELECT USING (true);

-- 投稿の閲覧: 公開済みは全員、承認待ちも全員（承認UIのため）、自分の投稿は常に閲覧可能
CREATE POLICY "Public published posts" ON posts FOR SELECT
  USING (status = 'published' OR status = 'pending' OR auth.uid() = user_id);

-- 承認の閲覧: 全員が閲覧可能（承認状況の表示のため）
CREATE POLICY "Public approvals read" ON approvals FOR SELECT USING (true);

-- 自分のデータのみ作成・更新・削除可能
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own approvals" ON approvals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own likes" ON likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
```

### 3.3 主要クエリパターン

```sql
-- ========================================
-- 承認システム関連クエリ
-- ========================================

-- 承認待ち投稿の取得（お気に入りVTuber優先で表示）
SELECT p.*, v.name AS vtuber_name, v.avatar_url AS vtuber_avatar,
       pr.display_name AS author_name, pr.trust_level,
       p.approvals_count, p.approvals_required,
       (p.approvals_required - p.approvals_count) AS remaining_approvals,
       EXISTS(SELECT 1 FROM favorites f WHERE f.user_id = auth.uid() AND f.vtuber_id = p.vtuber_id) AS is_favorite_vtuber
FROM posts p
JOIN vtubers v ON p.vtuber_id = v.id
JOIN profiles pr ON p.user_id = pr.id
WHERE p.status = 'pending'
  AND p.user_id != auth.uid()               -- 自分の投稿は除外
  AND NOT EXISTS (                           -- まだ自分が承認/報告していない投稿のみ
    SELECT 1 FROM approvals a WHERE a.post_id = p.id AND a.user_id = auth.uid()
  )
ORDER BY is_favorite_vtuber DESC, p.created_at DESC  -- お気に入りVTuber優先
LIMIT 10;

-- 承認実行後のステータス更新（Supabase Edge Function / DB Trigger）
-- approvals_count が approvals_required に達したら published に昇格
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

    -- 投稿が公開されたら投稿者の承認済みカウントを更新＆信頼度レベル昇格チェック
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_approval_insert
AFTER INSERT ON approvals
FOR EACH ROW EXECUTE FUNCTION handle_approval();

-- 投稿作成時に信頼度に応じた必要承認数を設定 & 上級ユーザーは即公開
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_post_insert
BEFORE INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION set_approval_requirements();

-- ========================================
-- 通常の投稿取得クエリ（公開済みのみ）
-- ========================================

-- トレンド投稿（直近7日間でいいねが多い順、公開済みのみ）
SELECT p.*, v.name AS vtuber_name, v.avatar_url AS vtuber_avatar,
       a.display_name AS agency_name,
       pr.display_name AS author_name
FROM posts p
JOIN vtubers v ON p.vtuber_id = v.id
LEFT JOIN agencies a ON v.agency_id = a.id
JOIN profiles pr ON p.user_id = pr.id
WHERE p.status = 'published'
  AND p.published_at > NOW() - INTERVAL '7 days'
ORDER BY p.likes_count DESC
LIMIT 20;

-- 事務所別 × いいね順（公開済みのみ）
SELECT p.*, v.name AS vtuber_name, pr.display_name AS author_name
FROM posts p
JOIN vtubers v ON p.vtuber_id = v.id
JOIN profiles pr ON p.user_id = pr.id
WHERE p.status = 'published'
  AND v.agency_id = :agency_id              -- 事務所で絞り込み
  AND (:content_type IS NULL OR p.content_type = :content_type)  -- 種別フィルタ
ORDER BY p.likes_count DESC                 -- いいね順
LIMIT 20 OFFSET :offset;

-- グループ別 × 新着順（公開済みのみ）
SELECT p.*, v.name AS vtuber_name, pr.display_name AS author_name
FROM posts p
JOIN vtubers v ON p.vtuber_id = v.id
JOIN profiles pr ON p.user_id = pr.id
WHERE p.status = 'published'
  AND v.group_id = :group_id
ORDER BY p.published_at DESC               -- 新着順
LIMIT 20 OFFSET :offset;

-- VTuber別ページ（公開済み + 承認待ちを混在表示）
-- 公開済み投稿
SELECT p.*, pr.display_name AS author_name,
       pp.video_title AS parent_title,
       'published' AS display_type
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN posts pp ON p.parent_post_id = pp.id
WHERE p.vtuber_id = :vtuber_id AND p.status = 'published'
ORDER BY p.published_at DESC
LIMIT 20 OFFSET :offset;

-- 同VTuberの承認待ち投稿（上部にまとめて表示用）
SELECT p.*, pr.display_name AS author_name, pr.trust_level,
       p.approvals_count, p.approvals_required,
       'pending' AS display_type
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.vtuber_id = :vtuber_id AND p.status = 'pending'
ORDER BY p.created_at DESC
LIMIT 5;

-- タグ別投稿一覧（公開済みのみ）
SELECT p.*, v.name AS vtuber_name, pr.display_name AS author_name
FROM posts p
JOIN post_tags pt ON p.id = pt.post_id
JOIN tags t ON pt.tag_id = t.id
JOIN vtubers v ON p.vtuber_id = v.id
JOIN profiles pr ON p.user_id = pr.id
WHERE p.status = 'published' AND t.slug = :tag_slug
ORDER BY p.published_at DESC
LIMIT 20;

-- お気に入りVTuberフィード（公開済み + 承認待ち混在）
-- お気に入りVTuberの承認待ちを優先表示し、承認を促進
(SELECT p.*, v.name AS vtuber_name, v.avatar_url AS vtuber_avatar,
       pr.display_name AS author_name,
       'pending' AS display_type, p.created_at AS sort_date
FROM posts p
JOIN vtubers v ON p.vtuber_id = v.id
JOIN profiles pr ON p.user_id = pr.id
WHERE p.status = 'pending'
  AND p.vtuber_id IN (SELECT vtuber_id FROM favorites WHERE user_id = auth.uid())
  AND p.user_id != auth.uid()
  AND NOT EXISTS (SELECT 1 FROM approvals a WHERE a.post_id = p.id AND a.user_id = auth.uid())
ORDER BY p.created_at DESC LIMIT 3)
UNION ALL
(SELECT p.*, v.name AS vtuber_name, v.avatar_url AS vtuber_avatar,
       pr.display_name AS author_name,
       'published' AS display_type, p.published_at AS sort_date
FROM posts p
JOIN vtubers v ON p.vtuber_id = v.id
JOIN profiles pr ON p.user_id = pr.id
WHERE p.status = 'published'
  AND p.vtuber_id IN (SELECT vtuber_id FROM favorites WHERE user_id = auth.uid())
ORDER BY p.published_at DESC LIMIT 20);

-- ========================================
-- レコメンド: 「このVTuberが好きな人はこの人も好き」
-- ========================================

-- 指定VTuberをお気に入りにしている人が、他にお気に入りにしているVTuberを集計
WITH target_users AS (
  SELECT user_id FROM favorites WHERE vtuber_id = :vtuber_id
),
candidate_vtubers AS (
  SELECT f.vtuber_id,
         COUNT(*) AS overlap_count,
         ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM target_users) * 100, 1) AS match_rate
  FROM favorites f
  JOIN target_users tu ON f.user_id = tu.user_id
  WHERE f.vtuber_id != :vtuber_id
  GROUP BY f.vtuber_id
  HAVING COUNT(*) >= 3                     -- 最低3人以上の重複
)
SELECT v.id, v.name, v.avatar_url, v.favorites_count,
       a.display_name AS agency_name,
       cv.overlap_count, cv.match_rate
FROM candidate_vtubers cv
JOIN vtubers v ON cv.vtuber_id = v.id
LEFT JOIN agencies a ON v.agency_id = a.id
ORDER BY cv.match_rate DESC
LIMIT 10;

-- ユーザーの全お気に入りに基づくパーソナライズレコメンド
WITH my_favorites AS (
  SELECT vtuber_id FROM favorites WHERE user_id = auth.uid()
),
similar_users AS (
  SELECT f.user_id, COUNT(*) AS common_count
  FROM favorites f
  JOIN my_favorites mf ON f.vtuber_id = mf.vtuber_id
  WHERE f.user_id != auth.uid()
  GROUP BY f.user_id
  HAVING COUNT(*) >= 2                     -- 2人以上共通のお気に入りがある
),
recommendations AS (
  SELECT f.vtuber_id,
         COUNT(*) AS recommend_score,
         ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM similar_users) * 100, 1) AS match_rate
  FROM favorites f
  JOIN similar_users su ON f.user_id = su.user_id
  WHERE f.vtuber_id NOT IN (SELECT vtuber_id FROM my_favorites)
  GROUP BY f.vtuber_id
)
SELECT v.id, v.name, v.avatar_url, v.favorites_count,
       a.display_name AS agency_name,
       r.recommend_score, r.match_rate
FROM recommendations r
JOIN vtubers v ON r.vtuber_id = v.id
LEFT JOIN agencies a ON v.agency_id = a.id
ORDER BY r.match_rate DESC
LIMIT 10;
```

---

## 4. MVP開発ロードマップ

### Phase 1: コアMVP（2週間）

**目標: 投稿・閲覧・共有の基本フローを完成させる**

| 日程 | タスク | 詳細 |
|------|-------|------|
| Day 1-2 | プロジェクトセットアップ | Next.js 15 + TypeScript + Tailwind + shadcn/ui 初期構成（モバイルファースト）、ボトムナビ/レスポンシブレイアウト、Supabase プロジェクト作成、DBスキーマ投入 |
| Day 3-4 | 認証実装 | Supabase Auth (Google/Twitter OAuth)、プロフィール自動作成、ログイン/ログアウトUI |
| Day 5-6 | 投稿機能（マルチソース） | URL入力 → 自動判別（YouTube本配信/切り抜き/Xクリップ）→ メタデータ取得 → コメント+タグ+評価 → 承認待ちとして投稿保存。切り抜きの場合は元配信の紐づけ（任意） |
| Day 7-8 | 承認システム＋一覧表示 | 承認待ちのフィード混在表示、[✅承認][❌不適切]ボタン、DBトリガーによる自動ステータス昇格、信頼度レベル管理 |
| Day 9-10 | 絞り込み＋3つのアクション | 事務所/グループ/種別フィルタ、いいね順/新着順ソート、♡お気に入り（VTuber）、👍いいね（投稿）、🔖ブックマーク（投稿） |
| Day 11-12 | SNS共有・OGP | 動的OGP画像生成（@vercel/og）、種別バッジ表示、Twitter/LINE共有ボタン |
| Day 13-14 | デプロイ・テスト | Vercelデプロイ、初期VTuber/事務所/グループデータ投入、バグ修正 |

**Phase 1完了時の機能:**
- Google/X ログイン
- YouTube本配信 / 切り抜き / Xクリップのおすすめ投稿
- コミュニティ承認システム（信頼度レベルに応じた必要承認数）
- 事務所・グループ・種別での絞り込み
- いいね順 / 新着順のソート
- ♡お気に入り・👍いいね・🔖ブックマーク
- OGP付きSNS共有（公開済み投稿のみ）

### Phase 2: ソーシャル機能拡充（+2週間、計1ヶ月）

| タスク | 詳細 |
|-------|------|
| お気に入りフィード | お気に入りVTuberの新着おすすめをフィード表示 |
| 元配信⇔切り抜き紐づけ表示 | 配信詳細ページに関連切り抜き一覧、切り抜きから元配信へのリンク |
| タグブラウズ | タグ一覧、タグ別フィルタリング、人気タグ表示 |
| ユーザープロフィール | マイページ: お気に入りVTuber一覧、投稿履歴、いいね/ブックマーク一覧 |
| トレンド機能 | 日間/週間ランキング（いいね順）、注目の投稿 |
| 検索機能 | VTuber名検索、タグ検索、全文検索（Supabase Full Text Search） |
| 通知基盤 | いいね通知（アプリ内）、お気に入りVTuber新着通知 |
| **PWA化** | **Service Worker導入、manifest.json設定、ホーム画面追加プロンプト、オフラインキャッシュ（ブックマーク閲覧可能）、Web Push通知（Android対応）** |

### Phase 3: 成長・拡張（+1ヶ月、計2ヶ月）

| タスク | 詳細 |
|-------|------|
| **レコメンド機能** | **「このVTuberが好きな人はこの人も好き」をお気に入りデータの協調フィルタリングで実装。一致率(%)付き表示。無料は3件、プレミアムは全件+詳細分析** |
| 布教リスト機能 | おすすめ配信5〜10本をまとめて1URLで共有できるリスト作成 |
| コメント機能 | 投稿へのコメント・返信スレッド |
| VTuberデータ充実 | 主要VTuber（ホロライブ、にじさんじ等）の初期データ一括登録、チャンネル情報の定期更新バッチ |
| マルチプラットフォーム | Twitch、ニコニコ動画への対応拡張 |
| 管理画面 | VTuber/事務所/グループデータ管理、不適切投稿の通報/モデレーション |
| パフォーマンス最適化 | ISR活用、画像最適化、DBクエリチューニング |
| SEO強化 | 構造化データ（JSON-LD）、サイトマップ自動生成 |
| アナリティクス | ユーザー行動分析、KPIダッシュボード |

### Phase 4: ストアアプリ化（1年〜、MAU 2〜3万超過時）

| タスク | 詳細 |
|-------|------|
| **Capacitorでアプリ化** | **既存Next.jsコードをCapacitorでラップしてApp Store/Google Playに公開。コード書き直し不要** |
| ネイティブプッシュ通知 | iOS含むフルプッシュ通知対応（@capacitor/push-notifications） |
| ディープリンク | SNS共有URLからアプリを直接起動、未インストール時はWeb版にフォールバック |
| アプリ内課金 | App Store/Google Play経由のサブスクリプション決済（手数料15-30%に注意） |

---

## 5. インフラコスト見積もり

### 5.1 無料枠でのカバー範囲

| サービス | 無料枠 | カバー範囲 |
|---------|-------|-----------|
| **Vercel (Hobby)** | 帯域幅100GB/月、関数15万回/月 | 月間~10万PV、~5,000投稿/月 |
| **Supabase (Free)** | DB 500MB、Storage 1GB、50K MAU | ~100,000投稿、~5,000画像、~10,000ユーザー |
| **Cloudflare R2 (Free)** | Storage 10GB、エグレス無制限 | ~10,000枚のOGP画像 |
| **YouTube Data API** | 10,000ユニット/日 | ~10,000メタデータ取得/日 |
| **Cloudflare (Free)** | CDN無制限、DDoS防御 | 全トラフィックのCDNキャッシュ |

**想定: 月間1,000-5,000ユーザー（10万PV以下）であれば完全無料で運用可能**

### 5.2 スケーリングコスト見積もり

| ユーザー規模 | 月間PV想定 | 月額コスト | 内訳 |
|------------|-----------|-----------|------|
| ~1,000 MAU | ~50,000 | **$0** | 全サービス無料枠内 |
| ~5,000 MAU | ~250,000 | **$0-5** | 無料枠ぎりぎり、R2ストレージのみ有料化の可能性 |
| ~10,000 MAU | ~500,000 | **$45/月** | Supabase Pro ($25) + Vercel Pro ($20) |
| ~50,000 MAU | ~2,500,000 | **$75-120/月** | 上記 + Supabase従量課金 + Vercel帯域超過分 |
| ~100,000 MAU | ~5,000,000 | **$150-250/月** | 上記 + CDN最適化必須、R2有料枠 |

### 5.3 コスト最適化戦略

1. **ISR（Incremental Static Regeneration）の積極活用**
   - VTuber詳細ページ、タグページ等を静的生成 → サーバーレス関数呼び出し削減
   - revalidate: 300（5分）程度で鮮度とコストのバランスを取る

2. **Cloudflare CDNの前段配置**
   - 静的アセット（画像、CSS、JS）のキャッシュ
   - OGP画像のキャッシュ（Cache-Control設定）

3. **クライアントサイドキャッシュ**
   - SWR / React Queryによるデータフェッチキャッシュ
   - Service Worker による静的リソースキャッシュ

4. **DB最適化**
   - 適切なインデックス設計（上記SQL参照）
   - likes_count / bookmarks_count のカウンターキャッシュ（JOINなしで集計値取得）
   - Supabase Realtime は必要な箇所（いいね数リアルタイム更新等）のみ有効化

---

## 6. 技術アーキテクチャ図

```
┌──────────────────────────────────────────────────────────────┐
│                       クライアント                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ 📱 スマホ     │  │ 💻 PC       │  │ 📱 ストアアプリ   │   │
│  │ (モバイルWeb) │  │ (デスクトップ) │  │ (Capacitor)     │   │
│  │ ボトムナビUI  │  │ サイドバーUI  │  │ Phase 4〜       │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         └─────────────────┼───────────────────┘              │
│                           ▼                                   │
│  Next.js 15 (App Router + RSC) + PWA (Phase 2〜)             │
│  Tailwind CSS (モバイルファースト) + shadcn/ui                 │
│  Supabase Client SDK                                         │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│              Vercel (Hosting)                                 │
│  ┌──────────────┐  ┌────────────────────┐                   │
│  │ Static Pages │  │ API Routes         │                   │
│  │ (ISR/SSG)    │  │ (Server Actions)   │                   │
│  └──────────────┘  └────────┬───────────┘                   │
│  ┌──────────────────────────┼───────────┐                   │
│  │ Edge Functions                        │                   │
│  │ - OGP画像生成 (@vercel/og)            │                   │
│  │ - YouTube API Proxy                   │                   │
│  └──────────────────────────┘           │                   │
└───────────────────────┬──────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   Supabase   │ │ YouTube  │ │  Cloudflare  │
│              │ │ Data API │ │              │
│ - Auth       │ │ v3       │ │ - R2 Storage │
│ - DB (PgSQL) │ │          │ │ - CDN        │
│ - Storage    │ │ X oEmbed │ │              │
│ - Edge Funcs │ │ API      │ │              │
│ - Realtime   │ │          │ │              │
└──────────────┘ └──────────┘ └──────────────┘
```

---

## 7. 技術スタックまとめ

| レイヤー | 技術 | バージョン/プラン | 導入フェーズ |
|---------|------|-----------------|------------|
| フロントエンド | Next.js (App Router) | 15.x | Phase 1 |
| 言語 | TypeScript | 5.x | Phase 1 |
| スタイリング | Tailwind CSS（モバイルファースト） | 4.x | Phase 1 |
| UIライブラリ | shadcn/ui | latest | Phase 1 |
| BaaS | Supabase | Free → Pro | Phase 1 |
| データベース | PostgreSQL (via Supabase) | 15 | Phase 1 |
| 認証 | Supabase Auth (OAuth) | - | Phase 1 |
| ホスティング | Vercel | Hobby → Pro | Phase 1 |
| 画像ストレージ | Cloudflare R2 | Free | Phase 1 |
| CDN | Cloudflare | Free | Phase 1 |
| OGP生成 | @vercel/og (Satori) | latest | Phase 1 |
| 外部API | YouTube Data API v3 | - | Phase 1 |
| 外部API | X oEmbed API | - | Phase 1 |
| アナリティクス | Vercel Analytics / Umami | Free | Phase 1 |
| **PWA** | **next-pwa / Service Worker** | **latest** | **Phase 2** |
| **ストアアプリ** | **Capacitor** | **6.x** | **Phase 4** |

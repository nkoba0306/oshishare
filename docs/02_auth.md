# Phase 1-B: 認証（Day 3-4）

## 目的
Google / X (Twitter) OAuth によるログイン・ログアウト、プロフィール自動作成

## タスク

### 1. Supabase Auth 設定
- [x] Supabaseダッシュボードで Google OAuth プロバイダーを有効化
  - Google Cloud Console で OAuth クライアントID/シークレット取得
  - コールバックURL設定
- [x] Supabase ダッシュボードで Twitter/X OAuth プロバイダーを有効化
  - X Developer Portal でAPI Key/Secret 取得
  - コールバックURL設定

### 2. ログインページ（`/login`）
- [x] 「Googleでログイン」ボタン
- [x] 「Xでログイン」ボタン
- [x] 未ログイン時のリダイレクト処理
- [x] ログイン後のコールバック処理（`/callback`）

### 3. プロフィール自動作成
- [x] 初回ログイン時に `profiles` テーブルにレコード作成
  - `id`: Supabase Auth の UID
  - `username`: OAuth プロバイダーから取得（重複時はサフィックス付与）
  - `display_name`: OAuth プロバイダーから取得
  - `avatar_url`: OAuth プロバイダーから取得
  - `trust_level`: `'new'`（初期値）
- [x] Supabase の `on_auth_user_created` トリガーまたは Server Action で実装

### 4. セッション管理
- [x] ミドルウェアでセッション更新（`middleware.ts`）
- [x] サーバーコンポーネントでの認証状態取得ヘルパー
- [x] クライアントでの認証状態取得フック（`useUser`）

### 5. ログアウト
- [x] ログアウト処理実装
- [x] ログアウト後のリダイレクト

### 6. 認証ガード
- [x] 投稿・いいね・ブックマーク等のアクション時に未ログインならログインページへ誘導
- [x] 閲覧は未ログインでも可能にする

## 完了条件
- [x] Google / X でログイン・ログアウトが動作する
- [x] 初回ログイン時に profiles レコードが自動作成される
- [x] 認証状態がサーバー/クライアント両方で取得できる

-- 初回ログイン時にprofilesレコードを自動作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  base_username TEXT;
  suffix INTEGER := 0;
BEGIN
  -- OAuthプロバイダーからユーザー名を生成
  base_username := COALESCE(
    NEW.raw_user_meta_data ->> 'user_name',       -- X/Twitter
    NEW.raw_user_meta_data ->> 'preferred_username',
    SPLIT_PART(NEW.email, '@', 1),                 -- Google
    'user'
  );

  new_username := base_username;

  -- 重複チェック（重複時はサフィックス付与）
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    suffix := suffix + 1;
    new_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, trust_level)
  VALUES (
    NEW.id,
    new_username,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      new_username
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    ),
    'new'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- VTuber登録申請テーブル
CREATE TABLE vtuber_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel_id TEXT,
  channel_url TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  approvals_count INTEGER DEFAULT 0,
  approvals_required INTEGER DEFAULT 3,
  created_vtuber_id UUID REFERENCES vtubers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VTuber登録申請の承認テーブル
CREATE TABLE vtuber_request_approvals (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES vtuber_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, request_id)
);

-- インデックス
CREATE INDEX idx_vtuber_requests_status ON vtuber_requests(status);
CREATE INDEX idx_vtuber_requests_user_id ON vtuber_requests(user_id);
CREATE INDEX idx_vtuber_requests_created_at ON vtuber_requests(created_at DESC);

-- RLS
ALTER TABLE vtuber_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vtuber_request_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vtuber requests" ON vtuber_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create requests" ON vtuber_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read request approvals" ON vtuber_request_approvals FOR SELECT USING (true);
CREATE POLICY "Authenticated users can approve" ON vtuber_request_approvals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 承認トリガー: 必要数に到達したらVTuberを自動作成
CREATE OR REPLACE FUNCTION handle_vtuber_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  req RECORD;
  new_vtuber_id UUID;
  reject_count INTEGER;
BEGIN
  IF NEW.action = 'approve' THEN
    UPDATE vtuber_requests
    SET approvals_count = approvals_count + 1,
        updated_at = NOW()
    WHERE id = NEW.request_id;

    SELECT * INTO req FROM vtuber_requests WHERE id = NEW.request_id;

    IF req.approvals_count >= req.approvals_required AND req.status = 'pending' THEN
      -- VTuberを作成
      INSERT INTO vtubers (name, channel_id)
      VALUES (req.name, COALESCE(req.channel_id, 'manual_' || req.id))
      RETURNING id INTO new_vtuber_id;

      UPDATE vtuber_requests
      SET status = 'approved', created_vtuber_id = new_vtuber_id, updated_at = NOW()
      WHERE id = NEW.request_id;
    END IF;
  ELSIF NEW.action = 'reject' THEN
    SELECT COUNT(*) INTO reject_count
    FROM vtuber_request_approvals
    WHERE request_id = NEW.request_id AND action = 'reject';

    IF reject_count >= 2 THEN
      UPDATE vtuber_requests
      SET status = 'rejected', updated_at = NOW()
      WHERE id = NEW.request_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vtuber_request_approval
  AFTER INSERT ON vtuber_request_approvals
  FOR EACH ROW
  EXECUTE FUNCTION handle_vtuber_request_approval();

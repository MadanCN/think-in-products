-- ── Admin activity log ────────────────────────────────────────────────────────
-- Records all create / update / delete / send actions performed in the admin.
-- Inserted via service-role key (bypasses RLS). Authenticated users can read.

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id           uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  action       text         NOT NULL,        -- e.g. 'article_published'
  entity_type  text         NOT NULL,        -- e.g. 'article', 'broadcast'
  entity_name  text,                         -- human-readable name / title
  details      jsonb        DEFAULT '{}'::jsonb,
  performed_by text,                         -- admin email if available
  created_at   timestamptz  DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created
  ON admin_activity_log (created_at DESC);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Authenticated admin users can read the log
CREATE POLICY "auth_read_activity"
  ON admin_activity_log
  FOR SELECT
  TO authenticated
  USING (true);

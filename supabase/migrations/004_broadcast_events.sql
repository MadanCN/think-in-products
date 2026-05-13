-- ============================================================
-- 004_broadcast_events.sql
-- Stores per-email delivery events from Resend webhooks
-- ============================================================

-- NOTE: The application code references broadcasts as "broadcasts".
-- If your table is named "newsletter_broadcasts" from migration 001,
-- run this alias first (safe to skip if it already exists):
--
--   CREATE VIEW broadcasts AS SELECT * FROM newsletter_broadcasts;
--
-- Or rename: ALTER TABLE newsletter_broadcasts RENAME TO broadcasts;

CREATE TABLE IF NOT EXISTS broadcast_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id     uuid        NOT NULL,   -- references broadcasts(id), no FK for flexibility
  event_type       text        NOT NULL
                               CHECK (event_type IN ('delivered','bounced','opened','clicked','complained')),
  recipient_email  text,
  resend_email_id  text,       -- Resend's internal email ID
  occurred_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  broadcast_events                 IS 'Resend webhook events per broadcast email';
COMMENT ON COLUMN broadcast_events.event_type      IS 'Resend event: delivered | bounced | opened | clicked | complained';
COMMENT ON COLUMN broadcast_events.resend_email_id IS 'Resend email_id for deduplication';

CREATE INDEX idx_broadcast_events_broadcast_id ON broadcast_events(broadcast_id);
CREATE INDEX idx_broadcast_events_event_type   ON broadcast_events(event_type);
CREATE INDEX idx_broadcast_events_occurred_at  ON broadcast_events(occurred_at DESC);

-- Unique constraint to prevent duplicate webhook deliveries
CREATE UNIQUE INDEX idx_broadcast_events_dedup
  ON broadcast_events(resend_email_id, event_type)
  WHERE resend_email_id IS NOT NULL;

ALTER TABLE broadcast_events ENABLE ROW LEVEL SECURITY;

-- Only service role (server-side) reads/writes — no public access
CREATE POLICY "service_role_all_broadcast_events"
  ON broadcast_events
  USING (true)
  WITH CHECK (true);

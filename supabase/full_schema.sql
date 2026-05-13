-- ============================================================
-- full_schema.sql  —  Think In Products
-- IDEMPOTENT: safe to run against any DB state (fresh or existing).
-- Run this in Supabase SQL Editor → New query → Run.
-- ============================================================


-- ── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ============================================================
-- TABLES
-- ============================================================

-- 1. roadmap_phases
CREATE TABLE IF NOT EXISTS roadmap_phases (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text,
  order_index integer     NOT NULL DEFAULT 0,
  color       text        NOT NULL DEFAULT '#00E5CC',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. roadmap_nodes
CREATE TABLE IF NOT EXISTS roadmap_nodes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id        uuid        NOT NULL REFERENCES roadmap_phases(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  summary         text,
  description     text,
  difficulty      text        NOT NULL DEFAULT 'beginner'
                              CHECK (difficulty IN ('beginner','intermediate','advanced')),
  estimated_hours integer     NOT NULL DEFAULT 2 CHECK (estimated_hours > 0),
  order_index     integer     NOT NULL DEFAULT 0,
  is_published    boolean     NOT NULL DEFAULT true,
  resources       jsonb       NOT NULL DEFAULT '[]',
  tags            text[]      NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_phase_id     ON roadmap_nodes(phase_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_is_published ON roadmap_nodes(is_published);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_tags         ON roadmap_nodes USING gin(tags);


-- 3. articles
-- Create with correct column names (migration 003 renames apply below)
CREATE TABLE IF NOT EXISTS articles (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text        UNIQUE NOT NULL,
  title             text        NOT NULL,
  excerpt           text,
  content           text,
  cover_image       text,
  author            text        NOT NULL DEFAULT 'Think in Products',
  difficulty        text        NOT NULL DEFAULT 'beginner'
                                CHECK (difficulty IN ('beginner','intermediate','advanced')),
  tags              text[]      NOT NULL DEFAULT '{}',
  status            text        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','published','archived')),
  read_time_minutes integer     NOT NULL DEFAULT 5 CHECK (read_time_minutes > 0),
  view_count        integer     NOT NULL DEFAULT 0,
  published_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Handle legacy column names (migration 003 fix) — idempotent
DO $$
BEGIN
  -- cover_image_url → cover_image
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'cover_image_url'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'articles' AND column_name = 'cover_image'
    ) THEN
      -- Both columns exist: copy any data that cover_image is missing, then drop the old one
      UPDATE articles SET cover_image = cover_image_url WHERE cover_image IS NULL AND cover_image_url IS NOT NULL;
      ALTER TABLE articles DROP COLUMN cover_image_url;
    ELSE
      -- Only old name exists: rename it
      ALTER TABLE articles RENAME COLUMN cover_image_url TO cover_image;
    END IF;
  END IF;

  -- reading_time_minutes → read_time_minutes
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'reading_time_minutes'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'articles' AND column_name = 'read_time_minutes'
    ) THEN
      UPDATE articles SET read_time_minutes = reading_time_minutes WHERE read_time_minutes = 5 AND reading_time_minutes != 5;
      ALTER TABLE articles DROP COLUMN reading_time_minutes;
    ELSE
      ALTER TABLE articles RENAME COLUMN reading_time_minutes TO read_time_minutes;
    END IF;
  END IF;
END $$;

-- Add author column if missing (old DB)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS
  author text NOT NULL DEFAULT 'Think in Products';

-- Add difficulty column if missing (old DB)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE articles ADD COLUMN difficulty text NOT NULL DEFAULT 'beginner'
      CHECK (difficulty IN ('beginner','intermediate','advanced'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_articles_status       ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_tags         ON articles USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_articles_slug         ON articles(slug);


-- 4. portfolio_cases
CREATE TABLE IF NOT EXISTS portfolio_cases (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text        NOT NULL,
  slug            text        UNIQUE NOT NULL,
  company         text,
  role            text,
  timeline        text,
  problem         text,
  approach        text,
  outcome         text,
  learnings       text,
  tags            text[]      NOT NULL DEFAULT '{}',
  figma_url       text,
  cover_image_url text,
  metrics         jsonb       NOT NULL DEFAULT '[]',
  is_featured     boolean     NOT NULL DEFAULT false,
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','published')),
  order_index     integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_cases_status      ON portfolio_cases(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_cases_is_featured ON portfolio_cases(is_featured);
CREATE INDEX IF NOT EXISTS idx_portfolio_cases_tags        ON portfolio_cases USING gin(tags);


-- 5. newsletter_subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text        UNIQUE NOT NULL,
  name            text,
  status          text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','unsubscribed','bounced')),
  source          text,
  subscribed_at   timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email  ON newsletter_subscribers(email);


-- 6. broadcasts
-- The app uses table name 'broadcasts'. The original migration created
-- 'newsletter_broadcasts' — rename it if it still has the old name.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'newsletter_broadcasts'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'broadcasts'
  ) THEN
    ALTER TABLE newsletter_broadcasts RENAME TO broadcasts;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS broadcasts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject         text        NOT NULL,
  preview_text    text,
  content         text,
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','sent')),
  sent_at         timestamptz,
  recipient_count integer,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);


-- 7. site_settings
CREATE TABLE IF NOT EXISTS site_settings (
  key        text        PRIMARY KEY,
  value      jsonb       NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- 8. admin_activity_log  (migration 004)
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action       text        NOT NULL,
  entity_type  text        NOT NULL,
  entity_name  text,
  details      jsonb       DEFAULT '{}'::jsonb,
  performed_by text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON admin_activity_log (created_at DESC);


-- ============================================================
-- TRIGGERS — updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['roadmap_nodes','articles','portfolio_cases','broadcasts','site_settings']
  LOOP
    -- Drop and recreate so the trigger always points to the current function
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE roadmap_phases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_nodes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_cases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log     ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so this script is idempotent
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM   pg_policies
    WHERE  schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Public reads
CREATE POLICY "public_read_roadmap_phases"
  ON roadmap_phases FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_published_nodes"
  ON roadmap_nodes FOR SELECT TO anon, authenticated USING (is_published = true);

CREATE POLICY "public_read_published_articles"
  ON articles FOR SELECT TO anon, authenticated USING (status = 'published');

CREATE POLICY "public_read_published_portfolio"
  ON portfolio_cases FOR SELECT TO anon, authenticated USING (status = 'published');

CREATE POLICY "public_read_site_settings"
  ON site_settings FOR SELECT TO anon, authenticated USING (true);

-- Newsletter subscriptions — anon can subscribe / unsubscribe
CREATE POLICY "anon_insert_subscriber"
  ON newsletter_subscribers FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_own_subscription"
  ON newsletter_subscribers FOR UPDATE TO anon
  USING (true) WITH CHECK (status IN ('active','unsubscribed'));

-- Admin activity log — authenticated admin can read
CREATE POLICY "auth_read_activity"
  ON admin_activity_log FOR SELECT TO authenticated USING (true);

-- broadcasts — no public access; admin uses service-role key which bypasses RLS


-- ============================================================
-- FUNCTIONS
-- Drop first so we can freely change signatures / return types
-- ============================================================

DROP FUNCTION IF EXISTS get_roadmap_with_nodes();
DROP FUNCTION IF EXISTS get_roadmap_phase_with_nodes(uuid);
DROP FUNCTION IF EXISTS increment_article_views(uuid);
DROP FUNCTION IF EXISTS get_published_articles(text, integer, integer);
DROP FUNCTION IF EXISTS subscribe_to_newsletter(text, text, text);

CREATE OR REPLACE FUNCTION get_roadmap_with_nodes()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id',          p.id,
        'title',       p.title,
        'description', p.description,
        'order_index', p.order_index,
        'color',       p.color,
        'created_at',  p.created_at,
        'nodes', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id',              n.id,
                'title',           n.title,
                'summary',         n.summary,
                'difficulty',      n.difficulty,
                'estimated_hours', n.estimated_hours,
                'order_index',     n.order_index,
                'tags',            n.tags,
                'resources',       n.resources,
                'is_published',    n.is_published
              ) ORDER BY n.order_index
            ),
            '[]'::jsonb
          )
          FROM roadmap_nodes n
          WHERE n.phase_id = p.id AND n.is_published = true
        )
      ) ORDER BY p.order_index
    ),
    '[]'::jsonb
  )
  FROM roadmap_phases p;
$$;

CREATE OR REPLACE FUNCTION get_roadmap_phase_with_nodes(p_phase_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'id',          p.id,
    'title',       p.title,
    'description', p.description,
    'order_index', p.order_index,
    'color',       p.color,
    'nodes', (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id',              n.id,
            'title',           n.title,
            'summary',         n.summary,
            'description',     n.description,
            'difficulty',      n.difficulty,
            'estimated_hours', n.estimated_hours,
            'order_index',     n.order_index,
            'tags',            n.tags,
            'resources',       n.resources
          ) ORDER BY n.order_index
        ),
        '[]'::jsonb
      )
      FROM roadmap_nodes n
      WHERE n.phase_id = p.id AND n.is_published = true
    )
  )
  FROM roadmap_phases p WHERE p.id = p_phase_id;
$$;

CREATE OR REPLACE FUNCTION increment_article_views(p_article_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE articles
  SET    view_count = view_count + 1
  WHERE  id = p_article_id AND status = 'published';
$$;

CREATE OR REPLACE FUNCTION get_published_articles(
  p_tag    text    DEFAULT NULL,
  p_limit  integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id                uuid,
  slug              text,
  title             text,
  excerpt           text,
  cover_image       text,
  author            text,
  difficulty        text,
  tags              text[],
  read_time_minutes integer,
  view_count        integer,
  published_at      timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    a.id, a.slug, a.title, a.excerpt, a.cover_image,
    a.author, a.difficulty, a.tags,
    a.read_time_minutes, a.view_count, a.published_at
  FROM articles a
  WHERE a.status = 'published'
    AND (p_tag IS NULL OR p_tag = ANY(a.tags))
  ORDER BY a.published_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION subscribe_to_newsletter(
  p_email  text,
  p_name   text DEFAULT NULL,
  p_source text DEFAULT 'website'
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_id    uuid;
BEGIN
  IF v_email NOT LIKE '%@%.%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email address');
  END IF;

  INSERT INTO newsletter_subscribers (email, name, status, source, subscribed_at)
  VALUES (v_email, p_name, 'active', p_source, now())
  ON CONFLICT (email) DO UPDATE
    SET status          = 'active',
        name            = COALESCE(EXCLUDED.name, newsletter_subscribers.name),
        source          = COALESCE(EXCLUDED.source, newsletter_subscribers.source),
        subscribed_at   = CASE
                            WHEN newsletter_subscribers.status = 'unsubscribed' THEN now()
                            ELSE newsletter_subscribers.subscribed_at
                          END,
        unsubscribed_at = NULL
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- ── Grants ────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION get_roadmap_with_nodes()                             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_roadmap_phase_with_nodes(uuid)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_article_views(uuid)                        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_published_articles(text, integer, integer)       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION subscribe_to_newsletter(text, text, text)            TO anon, authenticated;

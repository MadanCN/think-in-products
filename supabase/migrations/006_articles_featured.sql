ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS articles_featured_idx ON articles (is_featured, status, published_at DESC);

-- ============================================================
-- 003_articles_schema_fix.sql
-- Run this in your Supabase SQL editor to align the articles
-- table with the app code (adds missing columns, renames two).
-- ============================================================

-- Rename cover_image_url → cover_image (matches app code)
ALTER TABLE articles RENAME COLUMN cover_image_url TO cover_image;

-- Rename reading_time_minutes → read_time_minutes (matches app code)
ALTER TABLE articles RENAME COLUMN reading_time_minutes TO read_time_minutes;

-- Add author column (with safe default for existing rows)
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS author text NOT NULL DEFAULT 'Think in Products';

-- Add difficulty column (with safe default for existing rows)
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'beginner'
  CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));

-- Update the get_published_articles function to use renamed columns
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
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    a.id,
    a.slug,
    a.title,
    a.excerpt,
    a.cover_image,
    a.author,
    a.difficulty,
    a.tags,
    a.read_time_minutes,
    a.view_count,
    a.published_at
  FROM articles a
  WHERE a.status = 'published'
    AND (p_tag IS NULL OR p_tag = ANY(a.tags))
  ORDER BY a.published_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION get_published_articles(text, integer, integer) TO anon, authenticated;

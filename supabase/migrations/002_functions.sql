  -- ============================================================
  -- 002_functions.sql
  -- Think In Products — Postgres functions
  -- Run after 001_initial_schema.sql
  -- ============================================================


  -- ============================================================
  -- FUNCTION: get_roadmap_with_nodes()
  -- Returns all phases with their published nodes nested as JSON.
  -- Call from the app:  supabase.rpc('get_roadmap_with_nodes')
  -- ============================================================

  CREATE OR REPLACE FUNCTION get_roadmap_with_nodes()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER   -- executes as the function owner, bypassing RLS on nodes
  AS $$
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
                )
                ORDER BY n.order_index
              ),
              '[]'::jsonb
            )
            FROM roadmap_nodes n
            WHERE n.phase_id = p.id
              AND n.is_published = true
          )
        )
        ORDER BY p.order_index
      ),
      '[]'::jsonb
    )
    FROM roadmap_phases p;
  $$;

  COMMENT ON FUNCTION get_roadmap_with_nodes IS
    'Returns all roadmap phases with their published nodes nested as a single JSONB array. Bypasses RLS via SECURITY DEFINER so unpublished nodes are still excluded by the WHERE clause.';


  -- Grant execute to anon and authenticated (public roadmap page)
  GRANT EXECUTE ON FUNCTION get_roadmap_with_nodes() TO anon, authenticated;


  -- ============================================================
  -- FUNCTION: get_roadmap_phase_with_nodes(p_phase_id uuid)
  -- Returns a single phase with its nodes — useful for detail pages.
  -- ============================================================

  CREATE OR REPLACE FUNCTION get_roadmap_phase_with_nodes(p_phase_id uuid)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  AS $$
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
            )
            ORDER BY n.order_index
          ),
          '[]'::jsonb
        )
        FROM roadmap_nodes n
        WHERE n.phase_id = p.id
          AND n.is_published = true
      )
    )
    FROM roadmap_phases p
    WHERE p.id = p_phase_id;
  $$;

  GRANT EXECUTE ON FUNCTION get_roadmap_phase_with_nodes(uuid) TO anon, authenticated;


  -- ============================================================
  -- FUNCTION: increment_article_views(p_article_id uuid)
  -- Safely increments view_count on a published article.
  -- Designed to be called from the client without exposing
  -- direct UPDATE access to the articles table.
  -- Usage: supabase.rpc('increment_article_views', { p_article_id: '<uuid>' })
  -- ============================================================

  CREATE OR REPLACE FUNCTION increment_article_views(p_article_id uuid)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  AS $$
    UPDATE articles
    SET    view_count = view_count + 1
    WHERE  id = p_article_id
      AND  status = 'published';
  $$;

  COMMENT ON FUNCTION increment_article_views IS
    'Increments view_count for a published article. SECURITY DEFINER so the anon role can call it without direct UPDATE on articles.';

  GRANT EXECUTE ON FUNCTION increment_article_views(uuid) TO anon, authenticated;


  -- ============================================================
  -- FUNCTION: get_published_articles(p_tag text DEFAULT NULL, p_limit int DEFAULT 20, p_offset int DEFAULT 0)
  -- Paginated article listing with optional tag filter.
  -- Usage: supabase.rpc('get_published_articles', { p_tag: 'discovery', p_limit: 10, p_offset: 0 })
  -- ============================================================

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


  -- ============================================================
  -- FUNCTION: subscribe_to_newsletter(p_email text, p_name text, p_source text)
  -- Upserts a subscriber — idempotent, re-activates unsubscribed emails.
  -- Usage: supabase.rpc('subscribe_to_newsletter', { p_email: 'x@x.com', p_source: 'homepage' })
  -- ============================================================

  CREATE OR REPLACE FUNCTION subscribe_to_newsletter(
    p_email  text,
    p_name   text    DEFAULT NULL,
    p_source text    DEFAULT 'website'
  )
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    v_email text := lower(trim(p_email));
    v_id    uuid;
  BEGIN
    -- Basic email sanity check
    IF v_email NOT LIKE '%@%.%' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid email address');
    END IF;

    INSERT INTO newsletter_subscribers (email, name, status, source, subscribed_at)
    VALUES (v_email, p_name, 'active', p_source, now())
    ON CONFLICT (email) DO UPDATE
      SET status        = 'active',
          name          = COALESCE(EXCLUDED.name, newsletter_subscribers.name),
          source        = COALESCE(EXCLUDED.source, newsletter_subscribers.source),
          subscribed_at = CASE
                            WHEN newsletter_subscribers.status = 'unsubscribed'
                            THEN now()
                            ELSE newsletter_subscribers.subscribed_at
                          END,
          unsubscribed_at = NULL
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
  END;
  $$;

  COMMENT ON FUNCTION subscribe_to_newsletter IS
    'Upserts a newsletter subscriber. Re-activates unsubscribed emails. Returns {success, id} or {success: false, error}.';

  GRANT EXECUTE ON FUNCTION subscribe_to_newsletter(text, text, text) TO anon, authenticated;

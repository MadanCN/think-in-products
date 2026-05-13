-- ============================================================
-- 005_storage_media.sql
-- General-purpose media bucket for admin image uploads
-- (article covers, portfolio covers, gallery images, OG images)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  5242880,  -- 5 MB limit
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read — media bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated upload — media bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Authenticated update — media bucket"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated delete — media bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media');

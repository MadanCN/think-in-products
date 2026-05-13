-- ============================================================
-- 003_storage_profiles.sql
-- Creates the `profiles` storage bucket for profile image uploads
-- ============================================================

-- Create the public bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  2097152,   -- 2 MB limit
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view profile images (public bucket read)
CREATE POLICY "Public read — profiles bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

-- Authenticated users (admin) can upload
CREATE POLICY "Authenticated upload — profiles bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profiles');

-- Authenticated users can replace/update their uploads
CREATE POLICY "Authenticated update — profiles bucket"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profiles');

-- Authenticated users can delete uploads
CREATE POLICY "Authenticated delete — profiles bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profiles');

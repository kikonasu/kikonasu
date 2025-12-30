-- Make wardrobe-images bucket public so public URLs work
UPDATE storage.buckets 
SET public = true 
WHERE name = 'wardrobe-images';

-- Note: The existing RLS policies will still control upload/delete operations
-- This only allows the public URLs to serve images
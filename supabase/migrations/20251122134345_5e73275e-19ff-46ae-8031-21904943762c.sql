-- Create food-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true);

-- Allow anyone to upload food images
CREATE POLICY "Anyone can upload food images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'food-images');

-- Allow anyone to view food images
CREATE POLICY "Anyone can view food images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'food-images');

-- Allow anyone to delete food images
CREATE POLICY "Anyone can delete food images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'food-images');
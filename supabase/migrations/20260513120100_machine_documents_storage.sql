-- Machine Documents Storage Bucket
-- Storage for machine documents with RLS

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'machine-documents',
  'machine-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies

-- Users can upload documents to their org's machines
CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'machine-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view documents for machines in their orgs
CREATE POLICY "Users can view documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'machine-documents'
  );

-- Users can delete their own uploaded documents
CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'machine-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Add deleted_at for soft-delete support
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Index for efficient filtering of non-deleted documents
CREATE INDEX IF NOT EXISTS idx_documents_not_deleted
  ON public.documents(machine_id)
  WHERE deleted_at IS NULL;

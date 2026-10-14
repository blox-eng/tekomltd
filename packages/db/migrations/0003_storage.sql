-- site-media: a public bucket, so files are served by URL without a policy. Only Tekom
-- (authenticated) may list, upload, replace or delete. Same bucket locally and in the cloud.

INSERT INTO storage.buckets (id, name, public) VALUES ('site-media', 'site-media', true) ON CONFLICT (id) DO NOTHING;--> statement-breakpoint
CREATE POLICY "site_media_authenticated_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'site-media');--> statement-breakpoint
CREATE POLICY "site_media_authenticated_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media');--> statement-breakpoint
CREATE POLICY "site_media_authenticated_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-media') WITH CHECK (bucket_id = 'site-media');--> statement-breakpoint
CREATE POLICY "site_media_authenticated_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-media');--> statement-breakpoint
CREATE POLICY "site_media_authenticated_mfa" ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
  USING (bucket_id <> 'site-media' OR public.mfa_satisfied()) WITH CHECK (bucket_id <> 'site-media' OR public.mfa_satisfied());

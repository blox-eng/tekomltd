-- Row level security. The website reads with the anon key, the control app writes as the one
-- shared Tekom account (`authenticated`; sign-ups are disabled). The service role bypasses RLS.

ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE project_slug_history ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE project_images       ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE rail_panels          ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE promises             ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE stats                ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE crews                ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE crew_roles           ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE partner_services     ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE partners             ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE material_brands      ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE eu_programmes        ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE publications         ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE legal_pages          ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE site_settings        ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE enquiries            ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- anon: published rows only.
CREATE POLICY "projects_anon_read"         ON projects         FOR SELECT TO anon USING (published);--> statement-breakpoint
CREATE POLICY "rail_panels_anon_read"      ON rail_panels      FOR SELECT TO anon USING (published);--> statement-breakpoint
CREATE POLICY "promises_anon_read"         ON promises         FOR SELECT TO anon USING (published);--> statement-breakpoint
CREATE POLICY "stats_anon_read"            ON stats            FOR SELECT TO anon USING (published);--> statement-breakpoint
CREATE POLICY "crews_anon_read"            ON crews            FOR SELECT TO anon USING (published);--> statement-breakpoint
CREATE POLICY "crew_roles_anon_read"       ON crew_roles       FOR SELECT TO anon USING (published);--> statement-breakpoint
CREATE POLICY "partner_services_anon_read" ON partner_services FOR SELECT TO anon USING (published);--> statement-breakpoint
CREATE POLICY "partners_anon_read"         ON partners         FOR SELECT TO anon USING (published);--> statement-breakpoint
CREATE POLICY "material_brands_anon_read"  ON material_brands  FOR SELECT TO anon USING (published);--> statement-breakpoint
CREATE POLICY "eu_programmes_anon_read"    ON eu_programmes    FOR SELECT TO anon USING (published);--> statement-breakpoint
CREATE POLICY "publications_anon_read"     ON publications     FOR SELECT TO anon USING (published);--> statement-breakpoint
CREATE POLICY "legal_pages_anon_read"      ON legal_pages      FOR SELECT TO anon USING (published);--> statement-breakpoint

-- Images and old slugs have no switch of their own: they follow their project.
CREATE POLICY "project_images_anon_read" ON project_images FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.published));--> statement-breakpoint
CREATE POLICY "project_slug_history_anon_read" ON project_slug_history FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.published));--> statement-breakpoint

-- The company details are always public.
CREATE POLICY "site_settings_anon_read" ON site_settings FOR SELECT TO anon USING (true);--> statement-breakpoint

-- anon may send an enquiry, never read one back.
CREATE POLICY "enquiries_anon_insert" ON enquiries FOR INSERT TO anon WITH CHECK (handled_at IS NULL);--> statement-breakpoint

-- authenticated (Tekom): everything.
CREATE POLICY "projects_authenticated_all"             ON projects             FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "project_slug_history_authenticated_all" ON project_slug_history FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "project_images_authenticated_all"       ON project_images       FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "rail_panels_authenticated_all"          ON rail_panels          FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "promises_authenticated_all"             ON promises             FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "stats_authenticated_all"                ON stats                FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crews_authenticated_all"                ON crews                FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crew_roles_authenticated_all"           ON crew_roles           FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "partner_services_authenticated_all"     ON partner_services     FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "partners_authenticated_all"             ON partners             FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "material_brands_authenticated_all"      ON material_brands      FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "eu_programmes_authenticated_all"        ON eu_programmes        FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "publications_authenticated_all"         ON publications         FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "legal_pages_authenticated_all"          ON legal_pages          FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "site_settings_authenticated_all"        ON site_settings        FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enquiries_authenticated_all"            ON enquiries            FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint

-- true when the session is aal2, or when the user has no verified MFA factor yet.
-- SECURITY DEFINER because authenticated cannot read auth.mfa_factors; it only looks at the caller's own factors.
CREATE FUNCTION public.mfa_satisfied() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
	SELECT array[auth.jwt() ->> 'aal'] <@ (
		SELECT CASE WHEN count(id) > 0 THEN array['aal2'] ELSE array['aal1', 'aal2'] END
		FROM auth.mfa_factors
		WHERE user_id = auth.uid() AND status = 'verified'
	);
$$;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.mfa_satisfied() FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.mfa_satisfied() TO authenticated;--> statement-breakpoint

-- MFA at the data layer: once the account has a verified factor, only an aal2 session may
-- read or write. Before enrolment (no verified factor) aal1 is enough, so TOTP can be set up.
DO $$
DECLARE t text;
BEGIN
	FOREACH t IN ARRAY ARRAY['projects', 'project_slug_history', 'project_images', 'rail_panels', 'promises', 'stats', 'crews', 'crew_roles', 'partner_services', 'partners', 'material_brands', 'eu_programmes', 'publications', 'legal_pages', 'site_settings', 'enquiries'] LOOP
		EXECUTE format(
			'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',
			t || '_authenticated_mfa', t, 'public.mfa_satisfied()', 'public.mfa_satisfied()'
		);
	END LOOP;
END;
$$;--> statement-breakpoint

-- Defence in depth: anon keeps only the grants its policies use (TRUNCATE ignores RLS).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES FROM anon;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE USAGE, UPDATE ON SEQUENCES FROM anon;--> statement-breakpoint
-- Only the fields the public form sends: id, created_at and handled_at always take the server's values.
GRANT INSERT (name, email, phone, scope, message, locale, consent_at) ON enquiries TO anon;

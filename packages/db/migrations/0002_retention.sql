-- Enquiries are kept for 12 months after created_at (spec §7), then deleted by pg_cron.

CREATE EXTENSION IF NOT EXISTS pg_cron;--> statement-breakpoint
CREATE FUNCTION public.purge_old_enquiries() RETURNS integer LANGUAGE sql SET search_path = '' AS $$
	WITH gone AS (DELETE FROM public.enquiries WHERE created_at < now() - interval '12 months' RETURNING 1)
	SELECT count(*)::integer FROM gone;
$$;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.purge_old_enquiries() FROM PUBLIC, anon, authenticated;--> statement-breakpoint
SELECT cron.schedule('purge-old-enquiries', '0 3 * * *', 'select public.purge_old_enquiries()');

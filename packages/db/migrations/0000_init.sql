CREATE TYPE "public"."crew_key" AS ENUM('site', 'office');--> statement-breakpoint
CREATE TYPE "public"."panel_kind" AS ENUM('capability', 'crew_stat');--> statement-breakpoint
CREATE TYPE "public"."publication_kind" AS ENUM('eu_notice', 'procurement', 'other');--> statement-breakpoint
CREATE TYPE "public"."scene" AS ENUM('site', 'office');--> statement-breakpoint
CREATE TYPE "public"."scope" AS ENUM('full', 'restore', 'facade', 'interior', 'stone');--> statement-breakpoint
CREATE TABLE "crew_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crew_id" uuid NOT NULL,
	"tool" text NOT NULL,
	"role_bg" text NOT NULL,
	"role_en" text,
	"role_de" text,
	"years" integer NOT NULL,
	"quip_bg" text,
	"quip_en" text,
	"quip_de" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crew_roles_tool" CHECK ("crew_roles"."tool" in ('plumb', 'trowel', 'boards', 'roller', 'tiles', 'spatula', 'hat', 'brick', 'truss', 'key', 'ledger', 'square', 'laptop')),
	CONSTRAINT "crew_roles_years" CHECK ("crew_roles"."years" >= 0)
);
--> statement-breakpoint
CREATE TABLE "crews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" "crew_key" NOT NULL,
	"title_bg" text NOT NULL,
	"title_en" text,
	"title_de" text,
	"body_bg" text NOT NULL,
	"body_en" text,
	"body_de" text,
	"group_photo_path" text,
	"scene" "scene" NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crews_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"scope" "scope" NOT NULL,
	"message" text NOT NULL,
	"locale" text NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"handled_at" timestamp with time zone,
	CONSTRAINT "enquiries_locale" CHECK ("enquiries"."locale" in ('bg', 'en', 'de')),
	CONSTRAINT "enquiries_email" CHECK ("enquiries"."email" ~ '^[^@[:space:]]+@[^@[:space:]]+$' and char_length("enquiries"."email") <= 320),
	CONSTRAINT "enquiries_lengths" CHECK (char_length("enquiries"."name") <= 200 and char_length("enquiries"."phone") <= 50 and char_length("enquiries"."message") <= 5000)
);
--> statement-breakpoint
CREATE TABLE "eu_programmes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"title_bg" text NOT NULL,
	"title_en" text,
	"title_de" text,
	"summary_bg" text NOT NULL,
	"summary_en" text,
	"summary_de" text,
	"objectives_bg" text NOT NULL,
	"objectives_en" text,
	"objectives_de" text,
	"results_bg" text NOT NULL,
	"results_en" text,
	"results_de" text,
	"total_budget_eur" numeric(14, 2) NOT NULL,
	"eu_contribution_eur" numeric(14, 2) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"programme_logo_path" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eu_programmes_code_unique" UNIQUE("code"),
	CONSTRAINT "eu_programmes_budget" CHECK ("eu_programmes"."eu_contribution_eur" >= 0 and "eu_programmes"."eu_contribution_eur" <= "eu_programmes"."total_budget_eur"),
	CONSTRAINT "eu_programmes_period" CHECK ("eu_programmes"."period_end" >= "eu_programmes"."period_start")
);
--> statement-breakpoint
CREATE TABLE "legal_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title_bg" text NOT NULL,
	"title_en" text,
	"title_de" text,
	"body_bg" text NOT NULL,
	"body_en" text,
	"body_de" text,
	"reviewed" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_pages_slug_unique" UNIQUE("slug"),
	CONSTRAINT "legal_pages_slug" CHECK ("legal_pages"."slug" in ('privacy', 'cookies', 'data-rights', 'terms'))
);
--> statement-breakpoint
CREATE TABLE "material_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_path" text NOT NULL,
	"url" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"icon" text NOT NULL,
	"title_bg" text NOT NULL,
	"title_en" text,
	"title_de" text,
	"body_bg" text NOT NULL,
	"body_en" text,
	"body_de" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_services_icon" CHECK ("partner_services"."icon" in ('blueprint', 'square', 'beam', 'permit', 'survey', 'bolt', 'drop', 'air', 'window', 'kitchen', 'leaf', 'solar', 'tree'))
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role_bg" text NOT NULL,
	"role_en" text,
	"role_de" text,
	"logo_path" text NOT NULL,
	"url" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt_bg" text NOT NULL,
	"alt_en" text,
	"alt_de" text,
	"is_cover" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_images_storage_path_unique" UNIQUE("storage_path"),
	CONSTRAINT "project_images_size_positive" CHECK ("project_images"."width" > 0 and "project_images"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "project_slug_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"old_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_slug_history_old_slug_unique" UNIQUE("old_slug")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title_bg" text NOT NULL,
	"title_en" text,
	"title_de" text,
	"summary_bg" text NOT NULL,
	"summary_en" text,
	"summary_de" text,
	"place_bg" text NOT NULL,
	"place_en" text,
	"place_de" text,
	"address" text,
	"lat" numeric,
	"lng" numeric,
	"show_on_map" boolean DEFAULT true NOT NULL,
	"year" integer,
	"built_area_m2" numeric,
	"scopes" "scope"[] DEFAULT '{}' NOT NULL,
	"wide" boolean DEFAULT false NOT NULL,
	"on_rail" boolean DEFAULT false NOT NULL,
	"wp_id" integer,
	"wp_slug" text,
	"meta_title_bg" text,
	"meta_title_en" text,
	"meta_title_de" text,
	"meta_description_bg" text,
	"meta_description_en" text,
	"meta_description_de" text,
	"og_image_path" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug"),
	CONSTRAINT "projects_wp_id_unique" UNIQUE("wp_id"),
	CONSTRAINT "projects_wp_slug_unique" UNIQUE("wp_slug"),
	CONSTRAINT "projects_slug_format" CHECK ("projects"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "projects_summary_length" CHECK (char_length("projects"."summary_bg") <= 420 and char_length("projects"."summary_en") <= 420 and char_length("projects"."summary_de") <= 420),
	CONSTRAINT "projects_lat_lng_together" CHECK (("projects"."lat" is null) = ("projects"."lng" is null)),
	CONSTRAINT "projects_lat_range" CHECK ("projects"."lat" between -90 and 90),
	CONSTRAINT "projects_lng_range" CHECK ("projects"."lng" between -180 and 180),
	CONSTRAINT "projects_year_range" CHECK ("projects"."year" between 1800 and 2200),
	CONSTRAINT "projects_built_area_positive" CHECK ("projects"."built_area_m2" > 0)
);
--> statement-breakpoint
CREATE TABLE "promises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_bg" text NOT NULL,
	"title_en" text,
	"title_de" text,
	"body_bg" text NOT NULL,
	"body_en" text,
	"body_de" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid,
	"kind" "publication_kind" NOT NULL,
	"title_bg" text NOT NULL,
	"title_en" text,
	"title_de" text,
	"file_path" text NOT NULL,
	"published_on" date NOT NULL,
	"wp_url" text,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "publications_wp_url_unique" UNIQUE("wp_url")
);
--> statement-breakpoint
CREATE TABLE "rail_panels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "panel_kind" NOT NULL,
	"label_bg" text NOT NULL,
	"label_en" text,
	"label_de" text,
	"title_bg" text,
	"title_en" text,
	"title_de" text,
	"body_bg" text NOT NULL,
	"body_en" text,
	"body_de" text,
	"stat_value" text,
	"accent" boolean DEFAULT false NOT NULL,
	"after_project_index" integer DEFAULT 0 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rail_panels_capability_title" CHECK ("rail_panels"."kind" <> 'capability' or "rail_panels"."title_bg" is not null),
	CONSTRAINT "rail_panels_crew_stat_value" CHECK ("rail_panels"."kind" <> 'crew_stat' or "rail_panels"."stat_value" is not null),
	CONSTRAINT "rail_panels_after_project_index" CHECK ("rail_panels"."after_project_index" >= 0)
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"legal_name" text NOT NULL,
	"eik" text NOT NULL,
	"vat" text,
	"address_bg" text NOT NULL,
	"address_en" text,
	"address_de" text,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"privacy_email" text NOT NULL,
	"socials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"headline_turn_bg" text[] NOT NULL,
	"headline_turn_en" text[],
	"headline_turn_de" text[],
	"quote_cta" boolean DEFAULT true NOT NULL,
	"meta_title_bg" text,
	"meta_title_en" text,
	"meta_title_de" text,
	"meta_description_bg" text,
	"meta_description_en" text,
	"meta_description_de" text,
	"og_image_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton" CHECK ("site_settings"."id"),
	CONSTRAINT "site_settings_headline_turn" CHECK (cardinality("site_settings"."headline_turn_bg") between 3 and 5 and cardinality("site_settings"."headline_turn_en") between 3 and 5 and cardinality("site_settings"."headline_turn_de") between 3 and 5)
);
--> statement-breakpoint
CREATE TABLE "stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"label_bg" text NOT NULL,
	"label_en" text,
	"label_de" text,
	"unconfirmed" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crew_roles" ADD CONSTRAINT "crew_roles_crew_id_crews_id_fk" FOREIGN KEY ("crew_id") REFERENCES "public"."crews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_slug_history" ADD CONSTRAINT "project_slug_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_programme_id_eu_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."eu_programmes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_images_one_cover" ON "project_images" USING btree ("project_id") WHERE "project_images"."is_cover";--> statement-breakpoint
CREATE UNIQUE INDEX "rail_panels_one_accent" ON "rail_panels" USING btree ("accent") WHERE "rail_panels"."accent";--> statement-breakpoint
-- Hand-written: supabase-js writes bypass Drizzle's $onUpdate, so the database stamps updated_at.
CREATE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
	NEW.updated_at := now();
	RETURN NEW;
END;
$$;--> statement-breakpoint
DO $$
DECLARE t text;
BEGIN
	FOREACH t IN ARRAY ARRAY['projects', 'project_slug_history', 'project_images', 'rail_panels', 'promises', 'stats', 'crews', 'crew_roles', 'partner_services', 'partners', 'material_brands', 'eu_programmes', 'publications', 'legal_pages', 'site_settings'] LOOP
		EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
	END LOOP;
END;
$$;

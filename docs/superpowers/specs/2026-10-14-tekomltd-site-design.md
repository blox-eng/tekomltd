# tekomltd.com: site and control app design

Status: design locked 2026-10-14 (Martin). Reference build: `design/mockup/index.html` (open in a browser; the dark strip on top is mockup-only).
Design canon: `DESIGN.md`. Feature → control mapping: `docs/control-pane-mapping.md`.

> **Amendment 2026-10-14 (Martin):** the control app, Supabase, the contact form, Resend, revalidation, backups and the daily pulse are out of scope. All content lives in this repo (`content/`) and changes through pull requests. The site is fully static on one Netlify site. The contact page shows phone, e-mail and address only, so the site collects no personal data. Sections below that describe the control app, `control.tekomltd.com`, Supabase tables, RLS, enquiries or Resend are superseded by the amended plan; §7's field lists still define the content fields.

## 1. Intent

Tekom (ТЕКОМ ООД, Stara Zagora) is a family-owned builder. The current WordPress site on SuperHosting is generic, slow and partly unindexed. The new site positions Tekom as **the premium construction and finishing-works partner in the local market**: a boutique firm whose own crew builds it right the first time, and which brings in trusted partners for everything else.

A visitor lands and sees Tekom's buildings at once (vamy.art model), can drill into any project, sees where Tekom has built on a map, understands that Tekom lowers the risk of building, and can ask for a quote. Public-information duties (EU programmes, publications, privacy) stay visible and compliant.

The first milestone is a demo for Tekom on Netlify. **This plan ends at that demo.** The demo runs on Tekom-owned accounts: Supabase organisation `cfpyqpxyrupjnfactjko` ("martin.yankov@tekomltd.com's Org") and a Netlify team for Tekom. Setup runs through the Supabase and Netlify MCP servers in `.mcp.json`.

**Hosting (decided 2026-10-14):** both apps run on Netlify exactly as vamy.art does (ISR, Netlify Image CDN in front of Supabase Storage, server actions). SuperHosting keeps only the DNS for tekomltd.com; the WordPress hosting is not renewed after cutover. Mail stays on Google Workspace (MX `smtp.google.com`) and is not touched. The DNS cutover is documented in `DEPLOYMENT.md` and runs after Tekom approves the demo.

## 2. Goals

1. A landing page that opens on a full-window horizontal rail of real projects, with capability panels and crew slides between them.
2. Minimal project detail pages; a project index; a map of every project (Bulgaria + Stara Zagora centre).
3. Every piece of public content is editable in a separate control app at `control.tekomltd.com`. Empty lists hide their sections.
4. BG (default), EN, DE, with a language switch and correct `hreflang`.
5. EU GDPR compliant with no cookie banner: no tracking cookies, no third-party requests at runtime.
6. SEO at least as good as today: every old WordPress URL redirects; structured data; sitemap.
7. Light and dark themes with a visitor toggle.

## 3. Non-goals (v1)

- No blog or news feed. No e-commerce, no client portal, no Blox integration (the "You see your site every day" panel is copy only).
- No studio subdomain (vamy's `studio.vamy.art` pattern); revisit later.
- No analytics in v1. A cookieless, EU-hosted counter can come later.
- No euro figures for project value (boutique positioning).

## 4. Anti-goals (failure even if it works)

- Looks like a corporate contractor template (stock photos, icon grids, big revenue numbers).
- Names a partner, supplier or architect that Tekom did not enter.
- Breaks Bulgarian: wrong gender, Russian letterforms, machine-sounding copy.
- Loses Google rankings because old URLs 404.
- Sends a visitor's IP to Google Fonts, map tile servers or analytics.

## 5. Constraints

- Repo `blox-eng/tekomltd` (private). pnpm 10 + Turborepo monorepo, the same shape as `blox-eng/vamyart`: one repo, two Next.js apps, each a separate Netlify site, one Supabase project.
- Next.js 15.5, React 19, TypeScript strict, Tailwind 3.4 (tokens from `packages/ui`), Drizzle ORM 0.45, `@supabase/supabase-js` 2 + `@supabase/ssr`, next-intl 4, Vitest, Playwright.
- Supabase project in an EU region (Frankfurt, `eu-central-1`). Storage bucket `site-media` (public read).
- Netlify sites: `tekomltd-website` (later `tekomltd.com`, `www` → apex) and `tekomltd-control` (later `control.tekomltd.com`). Netlify Image CDN in front of Supabase Storage.
- Fonts self-hosted via `next/font` (Cormorant Garamond, Sofia Sans, IBM Plex Mono; latin + cyrillic).
- The map is an SVG drawn by the site from stored coordinates. No tile server.
- Node ≥ 20.

## 6. Architecture (decided)

```
apps/website   Next.js App Router, routes under /[locale] (bg default without prefix: /, /en, /de)
               Static generation + on-demand revalidation (POST /api/revalidate with REVALIDATE_SECRET)
apps/control   Next.js App Router, Supabase Auth (email + password, magic link), server actions for writes
packages/db    Drizzle schema, SQL migrations with RLS, typed queries (read model for website, write model for control)
packages/ui    tokens.css, fonts, Button / GhostButton / ArrowLink / Stamp / Glyph (+ icon set), TurningWord
packages/i18n  locales, message catalogues, pick(field, locale) with Bulgarian fallback
scripts/       import-wordpress.ts (one-off import of the 17 projects, covers and coordinates)
```

- **Data access (decided):** both apps talk to Supabase through `supabase-js`, never through a privileged Postgres connection. The website uses the anon key, so RLS returns published rows only. The control app uses the signed-in user's session, so RLS allows writes to the `authenticated` role. The service-role key is used only in the one-off seed/import scripts, the backup workflow and the daily digest, never in a request path of the website.
- Drizzle owns the schema, the SQL migrations and the generated row types; queries are written with `supabase-js` against those types.
- After every publish, the control app calls the website's revalidate endpoint.
- Builder's call (recorded): server actions instead of vamy's tRPC layer, because no client needs a public API.
- Builder's call (recorded): the control app UI is Bulgarian by default with an English catalogue (next-intl), so Tekom's editors work in Bulgarian.

## 7. Data model

All user-facing text is stored per language: `<field>_bg`, `<field>_en`, `<field>_de` (bg required, en/de nullable). `sort` is an integer for manual order. Every content table has `published boolean default false`, `created_at`, `updated_at`.

| Table | Key columns |
|---|---|
| `projects` | `slug` unique, `title_*`, `summary_*` (≤ 420 chars), `place_*`, `address`, `lat`, `lng`, `show_on_map boolean`, `year` (nullable), `built_area_m2` (nullable), `scopes text[]` (`full`, `restore`, `facade`, `interior`, `stone`), `wide boolean`, `on_rail boolean`, `wp_id int`, `wp_slug` (for redirects), `meta_title_*`, `meta_description_*`, `og_image_path` (all nullable) |
| `project_slug_history` | `project_id`, `old_slug` unique (a slug change keeps a 301 from the old URL) |
| `project_images` | `project_id`, `storage_path`, `width`, `height`, `alt_*`, `is_cover`, `sort` |
| `rail_panels` | `kind` (`capability` \| `crew_stat`), `label_*`, `title_*`, `body_*`, `stat_value` (crew_stat), `accent boolean`, `after_project_index int`, `sort` |
| `promises` | `title_*`, `body_*`, `sort` (the four "Build it right" lines) |
| `stats` | `value text`, `label_*`, `unconfirmed boolean` (adds `*` until Tekom confirms), `sort` |
| `crews` | `key` (`site` \| `office`), `title_*`, `body_*`, `group_photo_path` (nullable), `scene` (`site` \| `office`), `sort` |
| `crew_roles` | `crew_id`, `tool` (glyph key), `role_*`, `years int`, `quip_*`, `sort` |
| `partner_services` | `icon` (glyph key), `title_*`, `body_*`, `sort` |
| `partners` | `name`, `role_*`, `logo_path`, `url`, `sort` (section hidden when none published) |
| `material_brands` | `name`, `logo_path`, `url`, `sort` |
| `eu_programmes` | `code`, `title_*`, `summary_*`, `objectives_*`, `results_*`, `total_budget_eur numeric`, `eu_contribution_eur numeric`, `period_start date`, `period_end date`, `programme_logo_path`, `sort` |
| `publications` | `programme_id` (nullable), `kind` (`eu_notice` \| `procurement` \| `other`), `title_*`, `file_path`, `published_on date`, `wp_url` (old upload URL, for its 301) |
| `legal_pages` | `slug` (`privacy`, `cookies`, `data-rights`, `terms`), `title_*`, `body_*` (Markdown), `reviewed boolean` (false = draft awaiting legal review; launch is blocked until all four are true) |
| `site_settings` | singleton: `legal_name`, `eik`, `vat`, `address_*`, `phone`, `email`, `privacy_email`, `socials jsonb` (`linkedin`, `instagram`, `facebook`), `headline_turn_*` (text[]: fixed start + turning phrases), `quote_cta boolean`, `meta_title_*`, `meta_description_*`, `og_image_path` |
| `enquiries` | `name`, `email`, `phone` (nullable), `scope`, `message`, `locale`, `consent_at`, `created_at`, `handled_at` |

**Access (decided):** one shared Supabase Auth account for Tekom (e-mail + password, as vamy's admin), used by everyone at Tekom. Sign-ups are disabled in Supabase Auth, so `authenticated` means Tekom. TOTP MFA is enabled on the account. There are no roles and no members screen. Password reset uses Supabase's built-in mail.

Retention: enquiries are deleted 12 months after `created_at` (scheduled SQL function); Tekom can delete one at once in the control app (erasure request).

## 8. Public pages

| Route | Content |
|---|---|
| `/` | rail → promise ("Build it right. Take the risk out.") + 4 promises → stats → crews (turning headline, site + office split with scene placeholders) → partner services rail → map → materials → partners |
| `/projects` | gallery grid of published projects |
| `/projects/[slug]` | cover, scopes, title, summary, facts (address, year, area, scope), gallery, quote CTA, next project |
| `/eu-programmes` | programmes and their publications (PDF links) |
| `/publications` | all publications, newest first, filter by kind |
| `/contact` | enquiry form (consent checkbox required), phone, email, office |
| `/privacy`, `/cookies`, `/data-rights`, `/terms` | legal pages from `legal_pages` |
| `/api/revalidate` | POST, secret header, path list |

All under `/en/...` and `/de/...` as well. The project detail page and list show Bulgarian text with "Translation to follow" when a translation is missing.

## 8b. EU funding visibility

Regulation (EU) 2021/1060 Art. 47 and 50 require a beneficiary with a website to show, for each funded operation: the EU emblem with the statement "Co-funded by the European Union" / „Съфинансирано от Европейския съюз“, a short description of the operation with its aims and results, and the EU support. The `/eu-programmes` page renders this for every row of `eu_programmes`, with the emblem from `packages/ui` (official artwork, not redrawn) and the programme logo. The footer EU line links to that page.

## 8c. Operations

- **Keep-awake:** the Supabase free tier pauses a project after 7 days without activity. `daily-pulse.yml` (copied from vamyart) queries the database every day at 08:00 UTC, which keeps it active, and mails a digest of projects, enquiries and publications.
- **Backups:** the free tier has no point-in-time recovery. `backup.yml` runs weekly: `pg_dump` of the database and a listing of `site-media`, encrypted with `age` and kept as a 90-day GitHub Actions artifact. Original photos stay in Supabase Storage.
- **Limits:** free tier 500 MB database, 1 GB storage, 5 GB egress; Netlify Image CDN caches transformed images, so egress from Supabase stays low.
- **Accessibility:** WCAG 2.1 AA; `@axe-core/playwright` runs on every public page in e2e.
- **Uptime:** add tekomltd.com to Tekom's Uptime Kuma after cutover.

## 9. SEO

- `<title>` and description per page and locale; canonical; `hreflang` for bg/en/de + `x-default` (bg).
- JSON-LD: `HomeAndConstructionBusiness` on every page (name, address, geo, phone, sameAs = socials); `CreativeWork` with `locationCreated` on each project page; `BreadcrumbList` on detail pages.
- `sitemap.xml` with alternates; `robots.txt`.
- Open Graph image = project cover (1200×630 crop through Netlify Image CDN).
- 301 redirects from every old URL: `/project-view/<wp_slug>/*` and `/project-view/<wp_id>/*` → `/projects/<slug>`, `/projects/` → `/projects`, `/about/` → `/`, `/contact/` → `/contact`, `/publications/` → `/publications`, `/services/*` → `/`, `/home/privacy-policy/` → `/privacy`, `/portfolio_category/*` → `/projects`, every imported `/wp-content/uploads/…` file → its new public URL, `project_slug_history` → current slug.
- 410 only for `/wp-admin*`, `/wp-login.php`, `/xmlrpc.php`. Other `/wp-content/*` URLs return 404, not 410.

## 10. GDPR

- No cookies except the theme preference in `localStorage` (functional, not personal). No banner.
- No runtime third-party requests: fonts self-hosted, map drawn locally, images through the site's own domain (Netlify Image CDN).
- Contact form: purpose statement + required consent checkbox; stored in `enquiries` (EU region); notification e-mail to Tekom through Resend (EU region); retention 12 months.
- Footer names the data controller and privacy e-mail. Privacy page lists processors (Netlify, Supabase, Resend), purposes, retention, rights and the Bulgarian supervisory authority (КЗЛД).

## 11. Content import

`scripts/import-wordpress.ts` reads `https://www.tekomltd.com/wp-json/wp/v2/avada_portfolio?per_page=100&_embed=1`, creates the 17 projects (titles from `design/mockup/data/projects.json`, Bulgarian summaries cut at sentence ends, addresses from the "ДАТА / АДРЕС / ЗАСТРОЕНА ПЛОЩ" block), uploads the cover **and every gallery image** (largest size only: drop the `-NNNxNNN` WordPress thumbnails, dedupe by base name) to `site-media/projects/<slug>/`, writes `project_images` with width and height, uses the project title as the Bulgarian alt text, and writes coordinates from `design/mockup/data/geo.json`.

`scripts/import-wordpress.ts --publications` reads the WordPress pages `/publications/` and the two EU programme pages (`BG05SFPR002-1.004-1772-C01`, `BG16RFPR001-1.004`), downloads every linked PDF/DOC to `site-media/publications/`, creates `publications` rows with `wp_url`, and links them to their programme.

Legal pages: the importer ports the current WordPress privacy policy into `legal_pages.privacy.body_bg`. The builder drafts the cookies, data-rights and terms pages in Bulgarian from spec §10 and translates all four to English and German. Every legal page is seeded with `reviewed = false`. The rest of the seed (panels, promises, stats, crews, partner services, brands, programmes, settings) comes from `packages/db/seed/content.ts`, transcribed from the mockup.

## 12. Placeholders Tekom must confirm before launch

Founding year (mockup: 25 years), "two generations", crew roles and years, office roles, all crew jokes in Bulgarian, EIK/VAT, phone, e-mail, the address that receives enquiries, social URLs, the four promises, the partner-service list, group photos, and legal review of the four legal pages.

E-mail: until a sender domain is verified in Resend (needs records for `send.tekomltd.com` in the SuperHosting DNS panel; Google Workspace MX stays as it is), the demo stores enquiries and shows them in the control app only; the notification e-mail switches on when `RESEND_API_KEY` and `MAIL_FROM` are set. Supabase free tier pauses after a week without traffic: the demo is fine on it, launch needs the Pro plan or a keep-alive.

## 13. Left to the builder

Component file layout inside each app, Tailwind config details, skeleton designs that follow `DESIGN.md` §10, the control app's table and form layout (follow vamy's admin), test fixture contents.

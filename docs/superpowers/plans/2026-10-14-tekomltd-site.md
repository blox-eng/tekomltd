# tekomltd.com Website and Control App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Language:** The text of this plan follows ASD-STE100 Simplified Technical English. Procedural sentences are 20 words or fewer. Each sentence gives one instruction. Code, test names and copy strings are not STE text.

**Goal:** Build the public site tekomltd.com and the control app control.tekomltd.com from the locked mockup.

**Architecture:** One pnpm + Turborepo monorepo with two Next.js apps and three shared packages. One Supabase project (EU region) keeps the content and the files. Each app is a separate Netlify site. Both apps use `supabase-js`, never a privileged Postgres connection. The website reads with the anon key. The control app writes with the session of the signed-in user, so RLS applies. Drizzle owns the schema, the migrations and the row types only.

**Tech Stack:** pnpm 10, Turborepo 2, Next.js 15.5 (App Router), React 19, TypeScript 5.9 strict, Tailwind 3.4, Drizzle ORM 0.45, Supabase (Postgres, Auth, Storage), next-intl 4, Resend, Vitest 3, PGlite, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-tekomltd-site-design.md`. Also read `DESIGN.md` and `docs/control-pane-mapping.md`. The visual reference is `design/mockup/index.html`. The template source is `design/mockup/mockup.tpl.html`.

## Global Constraints

- Repo: `blox-eng/tekomltd`. Package scope: `@tekom/*`. Node ≥ 20. pnpm 10.
- Apps: `apps/website` (`@tekom/website`), `apps/control` (`@tekom/control`). Packages: `packages/db`, `packages/ui`, `packages/i18n`.
- Locales: `bg` (default, no URL prefix), `en`, `de`. Bulgarian text is required. English and German are optional.
- Missing translation: show the Bulgarian text and the note "Translation to follow" (en) / "Übersetzung folgt" (de).
- Colour, type, radius and motion values come only from `DESIGN.md` §1–§6. Do not use raw hex values in components.
- Fonts: Cormorant Garamond, Sofia Sans, IBM Plex Mono through `next/font/google` (self-hosted at build). Subsets `latin` and `cyrillic`.
- No runtime request to a third-party host from the public site. No cookies. No cookie banner.
- Supabase region: `eu-central-1`. Storage bucket: `site-media` (public read).
- Netlify sites: `tekomltd-website`, `tekomltd-control`. Each app has its own `netlify.toml` with `@netlify/plugin-nextjs`.
- Enquiry retention: 12 months.
- Access: one shared Tekom account in Supabase Auth (e-mail + password, TOTP MFA). Sign-ups are disabled. RLS writes are for `authenticated`. There are no roles.
- Do not use the service-role key in a request path of either app. Use it only in `scripts/`, `backup.yml` and `daily-pulse.yml`.
- Supabase organisation: `cfpyqpxyrupjnfactjko`. Use the Supabase MCP (`.mcp.json`) to create the project, apply migrations, create the bucket and generate types.
- Netlify: two sites in Tekom's Netlify team, built from git like vamyart. Use the Netlify MCP to create the sites and set the environment variables.
- Control app UI language: Bulgarian by default, English catalogue available (next-intl).
- This plan ends at the demo on Tekom-owned Netlify and Supabase accounts.
- Glyph keys (crew): `plumb trowel boards roller tiles spatula hat brick truss key ledger square laptop`.
- Glyph keys (services): `blueprint square beam permit survey bolt drop air window kitchen leaf solar tree`.
- Scopes: `full restore facade interior stone`.
- Commit messages: Conventional Commits, scope = app or package (`feat(website): …`).

## Review Focus

1. **A project has no English or German text.** The visitor sees the Bulgarian text with the note. The visitor never sees an empty heading. Test: Task 3 `pick` tests and Task 10 detail-page test.
2. **A project has no year, no built area or no coordinates.** The page hides each missing fact row. The page never shows "null m²". The map does not show the project. Test: Task 5 `toProjectCard` test and Task 9 `mapPins` test.
3. **An old WordPress URL has a percent-encoded Cyrillic slug.** The site sends a 301 to the new project page. Test: Task 11 `buildRedirects` test.
4. **A visitor sends the contact form without consent, with a bad e-mail, or twice.** The form shows the error next to the field. The database keeps one row per real submission. Test: Task 10 `parseEnquiry` test and the honeypot test.
5. **Tekom saves a turning headline where the start text differs between phrases.** The control app rejects the save and names the bad phrase. Test: Task 2 `splitTurn` test and Task 15 settings validation test.

## Reuse from vamyart

The source is `blox-eng/vamyart` at `main` (commit `c61c8b6` or later). Clone it next to this repo: `gh repo clone blox-eng/vamyart ../vamyart`. Copy each file in this table. Then make only the change in the third column. Rename every `@vamy/` package scope to `@tekom/`. Remove all Stripe, auction, product, certificate, shipping, Algolia, Stackbit and newsletter code that comes with a copied file.

| vamyart source | tekomltd target | Change | Task |
|---|---|---|---|
| `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `.prettierrc`, `.gitignore`, `.vscode/` | same paths | name `tekomltd`; remove the `slop` scripts; keep the Prettier settings without change | 1 |
| `tests/` (`package.json`, `playwright.config.ts`, `vitest.config.ts`, `e2e/smoke.test.ts`, `api/helpers.ts`) | `tests/` | filter `@tekom/website`; replace the vamy specs with Tekom specs | 1 |
| `.github/workflows/release.yml` | same path | none (semantic-release on `main`, Node 22) | 1 |
| `.github/workflows/daily-pulse.yml` | same path | count `projects`, `enquiries`, `publications`; subject "tekomltd.com daily pulse"; recipient from secret `PULSE_TO` | 16 |
| (vamyart has no test workflow) | `.github/workflows/ci.yml` | new: lint, typecheck, unit tests, RLS tests | 1, 4 |
| `.env-example` | `.env-example` | rewrite with the variables of Task 16 only | 1 |
| `packages/ui/package.json`, `tailwind-preset.js`, `src/index.ts`, `src/lib/utils.ts`, `src/styles/tokens.css` | `packages/ui/` | replace the token values with `DESIGN.md` §1 and §5; keep the file shape and the exports `./tokens.css` and `./tailwind-preset` | 2 |
| `DESIGN.md` | `DESIGN.md` | done (already adapted in this repo) | — |
| `packages/db/package.json` scripts, `drizzle.config.ts`, `src/client.ts` | `packages/db/` | keep `migrate`, `generate`, `studio`; `DATABASE_URL` is for migrations only; the request-path clients use `supabase-js` (spec §6) | 4 |
| `packages/db/migrations/*_rls.sql` (for example `0014_collections_rls.sql`) | pattern for `0001_rls.sql` | same policy style; anon read on `published = true` | 4 |
| `packages/db/scripts/backfill-image-dimensions.ts` | `scripts/lib/image-dimensions.ts` | reuse to read width and height during the WordPress import | 6 |
| `packages/i18n/` | `packages/i18n/` | keep the package shape; replace the messages with the mockup `T` strings | 3 |
| `apps/website/netlify.toml` | `apps/website/netlify.toml` | filter `@tekom/website`; `remote_images` = the Tekom Supabase URL | 7 |
| `apps/website/src/components/gallery/LandingSlider.tsx` + `.test.tsx`, `src/utils/slider-loop.ts` | `apps/website/src/components/rail/Rail.tsx` | start from it; remove the clone loop (the rail has a counter and an end); accept mixed slide kinds | 8 |
| `apps/website/src/utils/revalidate-path.ts` + test | `apps/website/src/lib/revalidate-path.ts` | none | 10 |
| `apps/admin/` shell: `middleware.ts`, `lib/supabase/{client,server}.ts`, `app/layout.tsx`, `app/providers.tsx`, `app/login/`, `app/(dashboard)/layout.tsx`, `components/ui/{skeleton,toast}.tsx`, `netlify.toml`, `vitest.config.ts`, `tailwind.config.ts`, `next.config.ts` | `apps/control/` | rename the app; replace the dashboard navigation with the screens of `docs/control-pane-mapping.md`; remove tRPC | 12 |
| `apps/admin/lib/image/resize.ts` + test | `apps/control/lib/image/resize.ts` | none | 13 |
| `apps/admin/lib/revalidate.ts`, `lib/revalidate-paths.ts` + test, `app/api/revalidate/` | `apps/control/lib/`, `apps/control/app/api/revalidate/` | path helpers for projects, crews, publications, legal pages | 13 |
| `DEPLOYMENT.md` | `DEPLOYMENT.md` | keep sections 1 (Supabase) and 3 (Resend); remove Stripe; add the two Netlify sites and the DNS move | 16 |

**CI/CD after the copy:**
- Netlify builds each app from its own `netlify.toml`. Each pull request gets a deploy preview for each app. A merge to `main` deploys both apps to production.
- `ci.yml` runs on each pull request: lint, typecheck, unit tests, and the RLS tests against local Supabase.
- `release.yml` creates a GitHub release with semantic-release after each merge to `main`. Conventional Commits drive the version.
- `daily-pulse.yml` sends one digest e-mail per day at 08:00 UTC.
- Migrations do not run in CI/CD. Run `pnpm --filter @tekom/db migrate` with `DATABASE_URL` before you merge a schema change (`DEPLOYMENT.md` §1).

---

### Task 1: Monorepo scaffold and CI

**Files:**
- Copy from vamyart (see "Reuse from vamyart"): `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `.prettierrc`, `.gitignore`, `.vscode/`, `tests/`, `.github/workflows/release.yml`
- Create: `tsconfig.base.json`, `.env-example`, `.github/workflows/ci.yml`
- Create: `apps/website/package.json`, `apps/control/package.json`, `packages/{db,ui,i18n}/package.json` (empty `src/index.ts` each)
- Test: `packages/i18n/src/smoke.test.ts`

**Interfaces:**
- Produces: root scripts `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`; `pnpm --filter @tekom/tests test:e2e`. Workspace names `@tekom/website`, `@tekom/control`, `@tekom/db`, `@tekom/ui`, `@tekom/i18n`, `@tekom/tests`.

- [ ] **Step 1: Copy the scaffold files.** Use the rows of Task 1 in "Reuse from vamyart". Do not change the Prettier settings.
- [ ] **Step 2: Write the smoke test.**

```ts
import { describe, it, expect } from "vitest";
describe("workspace", () => { it("runs vitest", () => { expect(1 + 1).toBe(2); }); });
```

- [ ] **Step 3: Run the tests.** Run: `pnpm install && pnpm test`. Expected: 1 test passes.
- [ ] **Step 4: Write `ci.yml`.** Trigger on `pull_request` and on `push` to `main`. Use `ubuntu-latest`, `pnpm/action-setup@v4`, `actions/setup-node@v4` with Node 22 and the pnpm cache. Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- [ ] **Step 5: Keep `release.yml` as copied.** Make sure that the first commit message after the copy is a Conventional Commit.
- [ ] **Step 6: Commit.** `git commit -m "chore: scaffold from vamyart, CI and release workflows"`

---

### Task 2: Design tokens and UI primitives (`packages/ui`)

**Files:**
- Create: `packages/ui/src/styles/tokens.css`, `packages/ui/src/fonts.ts`, `packages/ui/tailwind-preset.ts`
- Create: `packages/ui/src/glyphs.ts`, `packages/ui/src/Glyph.tsx`, `packages/ui/src/Button.tsx`, `packages/ui/src/Stamp.tsx`, `packages/ui/src/turn.ts`, `packages/ui/src/TurningWord.tsx`
- Test: `packages/ui/src/tokens.test.ts`, `packages/ui/src/turn.test.ts`, `packages/ui/src/glyphs.test.ts`

**Interfaces:**
- Produces:
  - `tokens.css` with the tokens of `DESIGN.md` §1 and §5, light on `:root`, dark under `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`.
  - `fonts.ts`: `export const display, body, mono` (next/font objects with CSS variables `--f-display`, `--f-body`, `--f-mono`).
  - `glyphs.ts`: `export const GLYPHS: Record<GlyphKey, string>` (inner SVG markup, 48×48) and `export type GlyphKey`.
  - `Glyph({ name, className }): JSX.Element`.
  - `Button({ variant: "primary" | "ghost", href?, arrow?: boolean, ...props })`.
  - `Stamp({ label, date }): JSX.Element`.
  - `splitTurn(phrases: string[]): { start: string; turns: string[] }` (throws `TurnError` when the phrases do not share the start).
  - `TurningWord({ start, turns, intervalMs = 3400 })`.

- [ ] **Step 1: Write the token test.** Parse `tokens.css`. Assert the contrast ratios.

```ts
it("accent passes AA on bg in both themes", () => {
  expect(contrast(light["--accent"], light["--bg"])).toBeGreaterThanOrEqual(4.5);
  expect(contrast(dark["--accent"], dark["--bg"])).toBeGreaterThanOrEqual(4.5);
});
it("muted passes AA on bg in both themes", () => {
  expect(contrast(light["--muted"], light["--bg"])).toBeGreaterThanOrEqual(4.5);
  expect(contrast(dark["--muted"], dark["--bg"])).toBeGreaterThanOrEqual(4.5);
});
```

- [ ] **Step 2: Write the turn tests.**

```ts
it("splits the shared start", () => {
  expect(splitTurn(["Хората зад мазилката", "Хората зад Вашата мечта", "Хората зад Вашето доверие"]))
    .toEqual({ start: "Хората зад", turns: ["мазилката", "Вашата мечта", "Вашето доверие"] });
});
it("rejects phrases with a different start", () => {
  expect(() => splitTurn(["Хората зад мазилката", "Екипът зад мечтата"])).toThrow(TurnError);
});
it("needs at least two phrases", () => {
  expect(() => splitTurn(["Хората зад мазилката"])).toThrow(TurnError);
});
```

- [ ] **Step 3: Write the glyph test.** Assert that `GLYPHS` has every key of both glyph lists in Global Constraints (25 unique keys; `square` is in both lists). Assert that no value contains `fill=` or `<script`.
- [ ] **Step 4: Run the tests.** Run: `pnpm --filter @tekom/ui test`. Expected: FAIL (modules are missing).
- [ ] **Step 5: Copy `packages/ui` from vamyart.** Then replace the values in `tokens.css` with `DESIGN.md` §1 and §5. Copy the `.turn`, `.stamp`, `.btn`, `.ghost`, `.ar` rules from `design/mockup/mockup.tpl.html`.
- [ ] **Step 6: Write `glyphs.ts`.** Copy the `ICON` strings from `design/mockup/mockup.tpl.html` without change.
- [ ] **Step 7: Write `splitTurn`.** Compare words from the left. The start is the longest word prefix that all phrases share. Each turn must have one to three words.
- [ ] **Step 8: Write `TurningWord`.** Port `turnWord` and `armTurn` from the mockup. Use `IntersectionObserver` and pause on hover. Do not start the timer when `prefers-reduced-motion: reduce` is true. Tap and Enter turn the phrase.
- [ ] **Step 9: Write `Button`, `Stamp`, `Glyph`, `fonts.ts` and `tailwind-preset.ts`.** The Tailwind preset maps colours to the CSS variables only.
- [ ] **Step 10: Run the tests.** Run: `pnpm --filter @tekom/ui test`. Expected: PASS.
- [ ] **Step 11: Commit.** `git commit -m "feat(ui): Tekom tokens, glyphs, buttons, stamp, turning word"`

---

### Task 3: Locales and fallback (`packages/i18n`)

**Files:**
- Create: `packages/i18n/src/locales.ts`, `packages/i18n/src/pick.ts`, `packages/i18n/messages/{bg,en,de}.json`
- Test: `packages/i18n/src/pick.test.ts`, `packages/i18n/src/messages.test.ts`

**Interfaces:**
- Produces:
  - `export const LOCALES = ["bg", "en", "de"] as const; export type Locale; export const DEFAULT_LOCALE = "bg"`.
  - `pick(row: Record<string, unknown>, field: string, locale: Locale): { text: string; fallback: boolean }`.
  - Message catalogues with the UI strings of the mockup `T` object (nav, footer, section headings, form labels, "Translation to follow").

- [ ] **Step 1: Write the pick tests.**

```ts
const row = { title_bg: "Очен медицински център", title_en: "Eye clinic", title_de: null };
it("returns the locale text", () => expect(pick(row, "title", "en")).toEqual({ text: "Eye clinic", fallback: false }));
it("falls back to Bulgarian", () => expect(pick(row, "title", "de")).toEqual({ text: "Очен медицински център", fallback: true }));
it("treats blank text as missing", () => expect(pick({ ...row, title_en: "  " }, "title", "en").fallback).toBe(true));
```

- [ ] **Step 2: Write the catalogue test.** Assert that `bg.json`, `en.json` and `de.json` have the same key set. Assert that no value is empty.
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Write `locales.ts`, `pick.ts` and the three catalogues.** Copy the strings from the mockup `T` object. Keep the Bulgarian text exactly as in the mockup.
- [ ] **Step 5: Run the tests.** Expected: PASS.
- [ ] **Step 6: Commit.** `git commit -m "feat(i18n): locales, catalogues and Bulgarian fallback"`

---

### Task 4: Database schema, migrations and RLS (`packages/db`)

**Files:**
- Create: `packages/db/src/schema.ts`, `packages/db/drizzle.config.ts`, `packages/db/migrations/0000_init.sql`, `packages/db/migrations/0001_rls.sql`, `packages/db/migrations/0002_retention.sql`
- Create: `packages/db/src/client.ts` (`anonClient()`, `sessionClient(cookies)`, `serviceClient()` for scripts), `packages/db/src/types.ts` (row types from Drizzle), `packages/db/src/testing.ts` (PGlite helper for schema tests)
- Test: `packages/db/src/schema.test.ts`, `packages/db/test/rls.test.ts`

**Interfaces:**
- Produces: Drizzle tables with the names and columns of spec §7. Enums `scope`, `panel_kind`, `crew_key`, `scene`, `publication_kind`. `createTestDb(): Promise<{ db; close }>` (PGlite with all migrations).
- SQL function `public.purge_old_enquiries()` (deletes rows older than 12 months). Schedule it daily with `pg_cron`.

- [ ] **Step 1: Write the schema tests.** Use `createTestDb()`.

```ts
it("needs Bulgarian title", async () => {
  await expect(db.insert(projects).values({ slug: "x", titleBg: null as never })).rejects.toThrow();
});
it("keeps slugs unique", async () => { /* insert twice, expect the second to throw */ });
it("allows only known scopes", async () => {
  await expect(db.insert(projects).values({ ...minimal, scopes: ["roofing" as never] })).rejects.toThrow();
});
it("allows one site_settings row", async () => { /* second insert throws */ });
```

- [ ] **Step 2: Write the RLS tests.** These tests need a local Supabase. Run them with `pnpm --filter @tekom/db test:rls`. Assert:
  - The anon role reads published `projects` and does not read draft rows.
  - The anon role cannot insert into any table except `enquiries`.
  - The anon role cannot read `enquiries`.
  - An `authenticated` user can insert, update and delete every content table.
  - Nobody can sign up (`auth.signup` disabled in `supabase/config.toml`; the test calls `signUp` and expects an error).
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 3b: Copy `drizzle.config.ts` and the `migrate`, `generate` and `studio` scripts from vamyart.** Run `supabase init` to add `supabase/config.toml` for the local stack.
- [ ] **Step 4: Write `schema.ts` and generate `0000_init.sql`.** Run `pnpm --filter @tekom/db drizzle-kit generate`. Add `check (char_length(summary_bg) <= 420)`.
- [ ] **Step 5: Write `0001_rls.sql`.** Enable RLS on every table. Add `select` for `anon` on rows with `published = true`. Add `insert` for `anon` on `enquiries` only. Add `all` for `authenticated` on every content table and on `enquiries`. Follow the policy style of vamyart `0014_collections_rls.sql`.
- [ ] **Step 6: Write `0002_retention.sql`.** Create `purge_old_enquiries()` and the `pg_cron` schedule `0 3 * * *`.
- [ ] **Step 7: Add the CI job for RLS.** Use `supabase/setup-cli`, then `supabase start`, then `pnpm --filter @tekom/db test:rls`.
- [ ] **Step 8: Run all tests.** Expected: PASS.
- [ ] **Step 9: Commit.** `git commit -m "feat(db): schema, RLS and enquiry retention"`

---

### Task 5: Read queries for the website (`packages/db`)

**Files:**
- Create: `packages/db/src/read/home.ts`, `packages/db/src/read/projects.ts`, `packages/db/src/read/public-info.ts`, `packages/db/src/read/settings.ts`, `packages/db/src/read/cards.ts`
- Test: `packages/db/src/read/*.test.ts`

**Interfaces:**
- Consumes: Task 3 `pick`, `Locale`. Task 4 `anonClient`, row types.
- Produces:
  - `type ProjectCard = { slug; title; titleFallback: boolean; place; year: number | null; areaM2: number | null; scopes: Scope[]; cover: Img; wide: boolean; pin: { lat: number; lng: number } | null }`
  - `toProjectCard(row, cover, locale): ProjectCard`
  - `getHome(locale): Promise<HomeData>` where `HomeData = { rail: ProjectCard[]; panels: Panel[]; promises; stats; crews: Crew[]; partnerServices; brands; partners; settings }`
  - `listProjects(locale): Promise<ProjectCard[]>`
  - `getProject(slug, locale): Promise<ProjectDetail | null>` with `next: { slug; title }`
  - `listProgrammes(locale)`, `listPublications(locale, kind?)`, `getLegalPage(slug, locale)`, `getSettings(locale)`
  - `allProjectSlugs(): Promise<{ slug: string; wpSlug: string | null }[]>`

- [ ] **Step 1: Write the card tests.**

```ts
it("hides missing facts as null", () => {
  const c = toProjectCard({ ...row, year: null, builtAreaM2: null, lat: null, lng: null }, cover, "en");
  expect(c.year).toBeNull(); expect(c.areaM2).toBeNull(); expect(c.pin).toBeNull();
});
it("marks Bulgarian fallback", () => {
  expect(toProjectCard({ ...row, titleEn: null }, cover, "en").titleFallback).toBe(true);
});
```

- [ ] **Step 2: Write the query tests against local Supabase (`test:integration`, seeded fixtures).** Each query takes a `SupabaseClient` as its first argument. Assert: `getHome` returns rail projects in `sort` order with `on_rail = true` only. Draft rows never appear. `partners` is `[]` when none is published. `getProject` returns `next` and wraps from the last project to the first.
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Write the queries with `supabase-js`.** Use one request per section. Do not query inside a loop.
- [ ] **Step 5: Run the tests.** Expected: PASS.
- [ ] **Step 6: Commit.** `git commit -m "feat(db): read model for the website"`

---

### Task 6: Seed and WordPress import

**Files:**
- Create: `packages/db/seed/content.ts`, `packages/db/seed/run.ts`
- Create: `scripts/import-wordpress.ts`, `scripts/wp-parse.ts`
- Test: `scripts/wp-parse.test.ts` (fixture: `design/mockup/data/portfolio.json`)

**Interfaces:**
- Consumes: Task 4 tables and service client.
- Produces: `parseDetails(html: string): { date: string | null; address: string | null; areaM2: number | null }`, `excerpt(html: string): string` (≤ 420 chars, cut at a sentence end, not after `ул.`, `инж.`, `арх.`, `гр.`, `с.`, `кв.`, `г.`), `galleryUrls(html: string): string[]` (full-size only, no `-NNNxNNN` thumbnails, deduped), `pnpm seed`, `pnpm import:wp`, `pnpm import:wp --publications`.

- [ ] **Step 1: Write the parser tests.**

```ts
const p = byId(fixture, 1952);
it("reads the details block", () => expect(parseDetails(p.content.rendered))
  .toEqual({ date: "30-ти Април , 2025 г.", address: "ул. “Х. Д. Асенов” № 93, Ст. Загора", areaM2: 872 }));
it("cuts the excerpt at a real sentence end", () => {
  const e = excerpt(byId(fixture, 1866).content.rendered);
  expect(e.length).toBeLessThanOrEqual(420); expect(e.endsWith("инж.")).toBe(false); expect(e.endsWith(".")).toBe(true);
});
it("parses every project in the fixture", () => expect(fixture.map((x) => excerpt(x.content.rendered)).every(Boolean)).toBe(true));
it("keeps full-size gallery images only", () => {
  const urls = galleryUrls(byId(fixture, 1849).content.rendered);
  expect(urls.some((u) => /-\d+x\d+\.(jpe?g|png|webp)$/.test(u))).toBe(false);
  expect(new Set(urls).size).toBe(urls.length);
});
```

- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Write `wp-parse.ts`.** Port the excerpt rule from `design/mockup/build.py`.
- [ ] **Step 4: Write `import-wordpress.ts`.** Read the WordPress REST URL of spec §11. Take titles, scopes, `wide` and the order from `design/mockup/data/projects.json`. Take coordinates from `design/mockup/data/geo.json`. Upload each cover and each gallery image to `site-media/projects/<slug>/`. Write `project_images` with width, height and the Bulgarian title as `alt_bg`. Set `wp_id` and `wp_slug`. Make the script idempotent (upsert on `slug` and on `storage_path`).
- [ ] **Step 4b: Write the `--publications` mode.** Read `/publications/` and the two EU programme pages. Download each linked PDF or DOC to `site-media/publications/`. Write `publications` rows with `wp_url` and the programme link.
- [ ] **Step 4c: Seed `legal_pages`.** Port the WordPress privacy policy into `privacy.body_bg`. Draft the other three pages in Bulgarian from spec §10. Translate all four to English and German. Set `reviewed = false` on all four.
- [ ] **Step 5: Write `seed/content.ts`.** Transcribe from the mockup: `SVC` → `rail_panels`, `CREW` → `rail_panels` (`crew_stat`), the four promises, the stats, `CREWS` → `crews` + `crew_roles`, `PSVC` → `partner_services`, the eight brands (logos from `design/mockup/logos/`), the two EU programmes, `site_settings`. Leave `partners` empty.
- [ ] **Step 6: Run the tests.** Expected: PASS.
- [ ] **Step 7: Run the import against local Supabase.** Run: `pnpm seed && pnpm import:wp`. Expected: 17 projects, every gallery image, 9 + 4 crew roles, the old publications with their files.
- [ ] **Step 8: Commit.** `git commit -m "feat(db): seed content and WordPress import"`

---

### Task 7: Website shell (locale routing, header, footer, theme)

**Files:**
- Create: `apps/website/next.config.ts`, `apps/website/middleware.ts` (next-intl), `apps/website/src/i18n/routing.ts`
- Create: `apps/website/src/app/[locale]/layout.tsx`, `apps/website/src/components/Header.tsx`, `Footer.tsx`, `ThemeToggle.tsx`, `ThemeScript.tsx`, `LangSwitch.tsx`
- Create: `apps/website/src/app/[locale]/[legal]/page.tsx` (privacy, cookies, data-rights, terms)
- Create: `apps/website/netlify.toml`
- Test: `tests/e2e/website/shell.spec.ts`

**Interfaces:**
- Consumes: Task 2 tokens, fonts, `Button`. Task 3 catalogues. Task 5 `getSettings`, `getLegalPage`.
- Produces: `Header`, `Footer`, the `[locale]` layout with `<html lang>`, and `localePath(path, locale)`.

- [ ] **Step 1: Write the e2e tests.**

```ts
test("bg is the default and has no prefix", async ({ page }) => {
  await page.goto("/"); await expect(page.locator("html")).toHaveAttribute("lang", "bg");
});
test("language switch keeps the page", async ({ page }) => {
  await page.goto("/contact"); await page.getByRole("button", { name: "EN" }).click();
  await expect(page).toHaveURL(/\/en\/contact$/);
});
test("theme choice survives a reload without a flash", async ({ page }) => {
  await page.goto("/"); await page.getByLabel(/theme/i).click(); await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("no request leaves the site", async ({ page }) => {
  const hosts = new Set<string>(); page.on("request", (r) => hosts.add(new URL(r.url()).host));
  await page.goto("/"); expect([...hosts].every((h) => h === new URL(page.url()).host)).toBe(true);
});
```

- [ ] **Step 2: Run the tests.** Run: `pnpm --filter @tekom/tests test:e2e`. Expected: FAIL.
- [ ] **Step 3: Write the routing.** Use next-intl `localePrefix: "as-needed"` with `defaultLocale: "bg"`.
- [ ] **Step 4: Write `ThemeScript`.** Put an inline script in `<head>`. It reads `localStorage["tekom-theme"]` in `try/catch` and sets `data-theme` before paint.
- [ ] **Step 5: Write `Header` and `Footer`.** Follow `DESIGN.md` §7 and the mockup markup. Hide each social icon when its URL is empty.
- [ ] **Step 6: Write the legal page route.** Render Markdown with `react-markdown`. Show "last updated".
- [ ] **Step 7: Write `netlify.toml`.** Copy `apps/website/netlify.toml` from vamyart. Set the filter to `@tekom/website`. Set `remote_images` to the Supabase project URL.
- [ ] **Step 8: Run the tests.** Expected: PASS.
- [ ] **Step 9: Commit.** `git commit -m "feat(website): locale routing, header, footer, theme"`

---

### Task 8: Landing page rail

**Files:**
- Create: `apps/website/src/app/[locale]/page.tsx`, `apps/website/src/components/rail/Rail.tsx`, `ProjectSlide.tsx`, `PanelSlide.tsx`, `CrewStatSlide.tsx`, `rail.ts`
- Test: `apps/website/src/components/rail/rail.test.ts`, `tests/e2e/website/rail.spec.ts`

**Interfaces:**
- Consumes: Task 5 `getHome`. Task 2 `Glyph`, `Stamp`.
- Produces: `buildRail(projects: ProjectCard[], panels: Panel[]): RailItem[]` where `RailItem = { kind: "project"; project } | { kind: "panel"; panel } | { kind: "crew"; panel }`.

- [ ] **Step 1: Write the interleave tests.**

```ts
it("puts each panel after its project index", () => {
  const items = buildRail([p0, p1, p2], [{ ...cap, afterProjectIndex: 0 }, { ...crew, afterProjectIndex: 1 }]);
  expect(items.map((i) => i.kind)).toEqual(["project", "panel", "project", "crew", "project"]);
});
it("appends panels whose index is past the end", () => {
  expect(buildRail([p0], [{ ...cap, afterProjectIndex: 9 }]).at(-1)?.kind).toBe("panel");
});
it("keeps order for two panels at the same index by sort", () => { /* … */ });
```

- [ ] **Step 2: Write the e2e tests.** At 390×844 each slide is the full viewport width. The counter shows `01 / NN` and changes after a swipe. On desktop the arrow buttons scroll the rail. A click on a project slide opens `/projects/<slug>`.
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Start from vamyart `LandingSlider.tsx`.** Remove the clone loop. Then write `buildRail` and the slide components. Copy the CSS of `.rail`, `.track`, `.slide`, `.cap`, `.panel`, `.crew`, `.collage` from the mockup into CSS modules.
- [ ] **Step 5: Use `next/image` for covers.** Set `sizes="(max-width: 640px) 100vw, 60vh"`. Set `priority` on the first slide only.
- [ ] **Step 6: Run the tests.** Expected: PASS.
- [ ] **Step 7: Commit.** `git commit -m "feat(website): project rail with panels and crew slides"`

---

### Task 9: Landing sections and the map

**Files:**
- Create: `apps/website/src/components/home/{Promise,Stats,Crews,CrewScene,PartnerServices,Materials,Partners}.tsx`
- Create: `apps/website/src/components/map/{geo.ts,BulgariaMap.tsx,CityMap.tsx,bulgaria-outline.ts}`
- Test: `apps/website/src/components/map/geo.test.ts`, `tests/e2e/website/home.spec.ts`

**Interfaces:**
- Consumes: Task 5 `HomeData`. Task 2 `TurningWord`, `splitTurn`, `Glyph`, `Stamp`.
- Produces:
  - `projectCountry(lng, lat): [x, y]` (viewBox 640×400, bounds lon 22.2–28.8, lat 41.1–44.35).
  - `CITY_BOX = { lon: [25.612, 25.638], lat: [42.4135, 42.4335] }`; `inCity(pin): boolean`; `projectCity(lng, lat): [x, y]` (viewBox 420×440).
  - `mapPins(cards: ProjectCard[]): { country: Pin[]; city: Pin[]; cityCount: number }` (cards without `pin` are left out).
  - `scaleBarPx(metres = 500): number`.

- [ ] **Step 1: Write the geo tests.**

```ts
it("puts Stara Zagora centre inside the city box", () => expect(inCity({ lat: 42.4256, lng: 25.6241 })).toBe(true));
it("puts Chernomorets outside the city box", () => expect(inCity({ lat: 42.4464, lng: 27.633 })).toBe(false));
it("leaves out projects without coordinates", () => expect(mapPins([{ ...card, pin: null }]).country).toHaveLength(0));
it("draws a 500 m scale bar to scale", () => expect(scaleBarPx(500)).toBeCloseTo(98.3, 0));
```

- [ ] **Step 2: Write the e2e tests.** The crews heading shows a dotted turning phrase that changes within 4 s. With `reducedMotion: "reduce"` it does not change. A hover on a crew role turns the matching scene glyph to the accent colour. The partners section is absent when no partner is published. A click on a map pin opens the project page.
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Write `geo.ts` and the two map components.** Port `bgMap` and `szMap` from the mockup. Each pin is an `<a>` with `aria-label` = project title.
- [ ] **Step 5: Write `CrewScene`.** Port `sceneSite`, `sceneOffice` and `AT` from the mockup. Show the group photo instead when `group_photo_path` is set. Hide quips and stamp when the photo is set.
- [ ] **Step 6: Write the other sections.** Return `null` when the list is empty. Copy the CSS from the mockup.
- [ ] **Step 7: Run the tests.** Expected: PASS.
- [ ] **Step 8: Commit.** `git commit -m "feat(website): promise, stats, crews, partner services, map, materials"`

---

### Task 10: Project pages, public information and contact

**Files:**
- Create: `apps/website/src/app/[locale]/projects/page.tsx`, `projects/[slug]/page.tsx`
- Create: `apps/website/src/app/[locale]/eu-programmes/page.tsx`, `publications/page.tsx`, `contact/page.tsx`
- Create: `apps/website/src/app/[locale]/contact/actions.ts`, `apps/website/src/lib/enquiry.ts`, `apps/website/src/lib/mail.ts`
- Create: `apps/website/src/app/api/revalidate/route.ts`
- Test: `apps/website/src/lib/enquiry.test.ts`, `apps/website/src/app/api/revalidate/route.test.ts`, `tests/e2e/website/pages.spec.ts`

**Interfaces:**
- Consumes: Task 5 queries. Task 3 `pick`.
- Produces:
  - `parseEnquiry(form: FormData): { ok: true; value: Enquiry } | { ok: false; errors: Partial<Record<keyof Enquiry | "consent", string>> }`
  - `submitEnquiry(prev, form)` server action: honeypot field `company_site`; insert with the anon client; send the mail with Resend to `site_settings.email`.
  - `POST /api/revalidate` body `{ paths: string[] }`, header `x-revalidate-secret`. Port `normalizeRevalidatePath` from vamyart.

- [ ] **Step 1: Write the enquiry tests.**

```ts
it("needs consent", () => expect(parseEnquiry(fd({ ...valid, consent: "" })).ok).toBe(false));
it("rejects a bad e-mail", () => expect(parseEnquiry(fd({ ...valid, email: "x@" })).errors?.email).toBeDefined());
it("trims and limits the message to 4000 chars", () => { /* … */ });
it("drops honeypot submissions", async () => { /* submitEnquiry with company_site set returns ok and inserts nothing */ });
```

- [ ] **Step 2: Write the revalidate tests.** Without the secret the route returns 401. With the secret it calls `revalidatePath` for each normalised path in all three locales.
- [ ] **Step 3: Write the e2e tests.** The detail page of a project without `title_en` shows the Bulgarian title and "Translation to follow" under `/en`. A project without `year` shows no "Completed" row. The contact form shows the consent error next to the checkbox. The submit button is disabled while the action runs.
- [ ] **Step 4: Run the tests.** Expected: FAIL.
- [ ] **Step 5: Write the pages and the action.** Follow the mockup views `projects`, `detail`, `eu`, `contact`. The EU page shows, for each programme: the EU emblem with "Co-funded by the European Union" (localised), the summary, objectives, results, total budget, EU contribution and period (spec §8b). Put the official emblem SVG in `packages/ui/src/assets/eu-emblem.svg`.
- [ ] **Step 6: Run the tests.** Expected: PASS.
- [ ] **Step 7: Commit.** `git commit -m "feat(website): project pages, EU programmes, publications, contact"`

---

### Task 11: SEO and WordPress redirects

**Files:**
- Create: `apps/website/src/lib/seo.ts`, `apps/website/src/lib/jsonld.ts`, `apps/website/src/app/sitemap.ts`, `apps/website/src/app/robots.ts`
- Create: `apps/website/src/lib/redirects.ts`; modify `apps/website/next.config.ts`
- Test: `apps/website/src/lib/redirects.test.ts`, `apps/website/src/lib/seo.test.ts`

**Interfaces:**
- Consumes: Task 5 `allProjectSlugs`, `getSettings`.
- Produces: `buildRedirects(slugs, history, files): Redirect[]` (Next.js redirect objects, `permanent: true`; `history` = `project_slug_history`, `files` = `publications.wp_url` and imported image URLs), `alternates(path): Metadata["alternates"]`, `businessJsonLd(settings)`, `projectJsonLd(detail, locale)`.

- [ ] **Step 1: Write the redirect tests.**

```ts
const r = buildRedirects([{ slug: "asenov-129", wpSlug: "жилищна-сграда-с-магазини-и-гаражи" }]);
it("redirects the encoded WordPress project URL", () => expect(r).toContainEqual(expect.objectContaining({
  source: "/project-view/%D0%B6%D0%B8%D0%BB%D0%B8%D1%89%D0%BD%D0%B0-%D1%81%D0%B3%D1%80%D0%B0%D0%B4%D0%B0-%D1%81-%D0%BC%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD%D0%B8-%D0%B8-%D0%B3%D0%B0%D1%80%D0%B0%D0%B6%D0%B8/:rest*",
  destination: "/projects/asenov-129", permanent: true })));
it("redirects the numeric WordPress URL", () => { /* /project-view/1952/:rest* → /projects/green-bath-eye-clinic */ });
it("covers the static list of spec §9", () => { /* /about/, /contact/, /publications/, /services/:p*, /home/privacy-policy/, /portfolio_category/:p* */ });
it("redirects an imported upload to its new URL", () => { /* /wp-content/uploads/2026/04/x.pdf → public storage URL */ });
it("redirects an old slug from history", () => { /* old-slug → /projects/new-slug */ });
```

- [ ] **Step 2: Write the SEO tests.** `alternates("/projects/x")` returns `bg`, `en`, `de` and `x-default` URLs. `projectJsonLd` has `locationCreated.geo` only when the pin exists.
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Write the code.** Read the slugs at build time in `next.config.ts` `redirects()`. Return HTTP 410 for `/wp-admin*`, `/wp-login.php` and `/xmlrpc.php` in `middleware.ts`. Do not return 410 for other `/wp-content/*` URLs.
- [ ] **Step 5: Run the tests.** Expected: PASS.
- [ ] **Step 6: Commit.** `git commit -m "feat(website): metadata, JSON-LD, sitemap and WordPress redirects"`

---

### Task 12: Control app shell and sign-in

**Files:**
- Create: `apps/control/` (Next.js App Router), `apps/control/middleware.ts`, `apps/control/lib/supabase/{client,server}.ts`, `apps/control/lib/auth.ts`, `apps/control/messages/{bg,en}.json` (next-intl, Bulgarian default)
- Create: `apps/control/app/login/page.tsx`, `apps/control/app/(dashboard)/layout.tsx`, `apps/control/app/(dashboard)/account/page.tsx` (change password, set up TOTP)
- Create: `apps/control/netlify.toml`
- Test: `apps/control/lib/auth.test.ts`, `tests/e2e/control/auth.spec.ts`

**Interfaces:**
- Consumes: Task 4 RLS (`authenticated` writes).
- Produces: `requireUser(): Promise<{ userId: string }>` (redirects to `/login` when there is no session; asks for the TOTP code when the session is AAL1 and a factor exists).

- [ ] **Step 1: Write the auth tests.** `requireUser` redirects to `/login` without a session. It redirects to `/login/mfa` when the session is AAL1 and a verified factor exists.
- [ ] **Step 2: Write the e2e tests.** A signed-out visit to `/` goes to `/login`. A signed-in visit shows every screen of `docs/control-pane-mapping.md` in the navigation.
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Copy the `apps/admin` shell from vamyart (see the Task 12 row in "Reuse from vamyart").** Rename it to `apps/control`. Remove tRPC. Keep `middleware.ts` and `lib/supabase/*` without change except the redirect target.
- [ ] **Step 5: Write `requireUser`, the login page, the TOTP step and the account screen.** Use `supabase.auth.mfa` for TOTP.
- [ ] **Step 6: Run the tests.** Expected: PASS.
- [ ] **Step 7: Commit.** `git commit -m "feat(control): shared sign-in with TOTP"`

---

### Task 13: Control projects editor

**Files:**
- Create: `apps/control/app/(dashboard)/projects/{page.tsx,[id]/page.tsx,actions.ts}`
- Create: `apps/control/lib/image/resize.ts` (copy from vamyart), `apps/control/lib/geocode.ts`, `apps/control/lib/slug.ts`, `apps/control/lib/revalidate.ts`
- Create: `apps/control/components/{LangFields,ImageUploader,PinPreview,SortableList}.tsx`
- Test: `apps/control/lib/{slug,geocode}.test.ts`, `apps/control/app/(dashboard)/projects/actions.test.ts`, `tests/e2e/control/projects.spec.ts`

**Interfaces:**
- Consumes: Task 12 `requireUser`. Task 9 `projectCountry`, `projectCity` (import from `@tekom/ui` after you move `geo.ts` there in this task).
- Produces:
  - `slugify(bg: string): string` (Bulgarian transliteration by the official 2009 law system, lower case, hyphens).
  - `geocode(address: string): Promise<{ lat: number; lng: number } | null>` (server-only, Nominatim, `User-Agent: tekomltd-control`, 1 request per second).
  - Server actions `saveProject`, `publishProject`, `deleteProject`, `reorderProjects`, `uploadProjectImage`, `setCover`.
  - `revalidateWebsite(paths: string[]): Promise<{ ok: boolean }>`.
  - `<LangFields name="title" required="bg" />` (three inputs with a "translation missing" chip).

- [ ] **Step 1: Write the slug tests.**

```ts
it("transliterates Bulgarian", () => expect(slugify("Жилищна сграда с гаражи")).toBe("zhilishtna-sgrada-s-garazhi"));
it("handles щ and ъ", () => expect(slugify("Щастие ъгъл")).toBe("shtastie-agal"));
```

- [ ] **Step 2: Write the action tests.** `publishProject` refuses a project without `title_bg` or without a cover. A slug change writes the old slug to `project_slug_history`, so the old URL keeps a 301. A save calls `revalidateWebsite` with `/`, `/projects` and `/projects/<slug>`. When revalidation fails, the save still succeeds and returns `{ revalidated: false }`.
- [ ] **Step 3: Write the e2e test.** Tekom creates a project, uploads two images, sets the cover, presses "Find on map", publishes, and sees the toast "Project published".
- [ ] **Step 4: Run the tests.** Expected: FAIL.
- [ ] **Step 5: Write the code.** Downscale images in the browser to 2400 px with `resize.ts`. Upload to `site-media/projects/<slug>/`. Show per-file progress.
- [ ] **Step 6: Run the tests.** Expected: PASS.
- [ ] **Step 7: Commit.** `git commit -m "feat(control): projects editor with images, location and publish"`

---

### Task 14: Control content screens

**Files:**
- Create: `apps/control/components/ListEditor.tsx`, `apps/control/lib/screens.ts`
- Create: `apps/control/app/(dashboard)/{rail-panels,promises,stats,crews,partner-services,materials,partners,eu-programmes,publications,legal}/page.tsx` and `actions.ts` for each
- Test: `apps/control/lib/screens.test.ts`, `tests/e2e/control/content.spec.ts`

**Interfaces:**
- Consumes: Task 12 `requireUser`, Task 13 `LangFields`, `SortableList`, `revalidateWebsite`. Task 2 `GLYPHS`.
- Produces: `SCREENS: Record<ScreenKey, { table; fields: FieldSpec[]; revalidate: string[] }>` that drives `ListEditor`. `FieldSpec` kinds: `lang`, `text`, `number`, `switch`, `glyph`, `image`, `file`, `markdown`, `select`.

- [ ] **Step 1: Write the screen tests.** Every row of `docs/control-pane-mapping.md` (rows 3–13, 16, 17, 19) has a `SCREENS` entry. `rail-panels` allows one `accent` panel only. `crews.roles.tool` accepts only the 13 crew glyph keys. `partner-services.icon` accepts only the 13 service glyph keys.
- [ ] **Step 2: Write the e2e test.** Tekom adds a partner. The public partners section appears after revalidation. Tekom removes it. The section disappears.
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Write `ListEditor` and the screens.** Use optimistic reorder and Undo on delete (`DESIGN.md` §10).
- [ ] **Step 5: Run the tests.** Expected: PASS.
- [ ] **Step 6: Commit.** `git commit -m "feat(control): content screens for every landing section"`

---

### Task 15: Control settings, headline and enquiries

**Files:**
- Create: `apps/control/app/(dashboard)/settings/{page.tsx,actions.ts}`, `apps/control/app/(dashboard)/enquiries/{page.tsx,actions.ts}`
- Test: `apps/control/app/(dashboard)/settings/actions.test.ts`, `apps/control/app/(dashboard)/enquiries/actions.test.ts`

**Interfaces:**
- Consumes: Task 2 `splitTurn`. Task 12 `requireUser`.
- Produces: `saveSettings(form)`, `saveHeadline(locale, phrases: string[])`, `markHandled(id)`, `deleteEnquiry(id)`.

- [ ] **Step 1: Write the headline test.** `saveHeadline("bg", ["Хората зад мазилката", "Екипът зад мечтата"])` returns an error that names "Екипът зад мечтата".
- [ ] **Step 2: Write the enquiry tests.** A signed-out call to `deleteEnquiry` fails. Each listed row shows its auto-delete date (`created_at` + 12 months).
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Write the screens.** The headline field shows a live `TurningWord` preview.
- [ ] **Step 5: Run the tests.** Expected: PASS.
- [ ] **Step 6: Commit.** `git commit -m "feat(control): settings, crew headline and enquiries"`

---

### Task 16: Deploy the demo

**Files:**
- Copy from vamyart: `DEPLOYMENT.md`, `.github/workflows/daily-pulse.yml`
- Create: `tests/e2e/website/smoke.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: all tasks.
- Produces: two live Netlify sites and a filled Supabase project.

- [ ] **Step 1: Create the Supabase project with the Supabase MCP.** Organisation `cfpyqpxyrupjnfactjko`, name `tekomltd`, region `eu-central-1`, plan free. Apply the migrations with `apply_migration`. Create the bucket `site-media` with public read (SQL on `storage.buckets`). Run `generate_typescript_types` and commit the result. Copy the service-role key and the database password from the dashboard into `.env.local` (the MCP does not return them). Run `pnpm seed && pnpm import:wp`. Run `get_advisors` and fix every security finding.
- [ ] **Step 2: Create the Netlify sites with the Netlify MCP.** Use Tekom's team. Create `tekomltd-website` (package directory `apps/website`) and `tekomltd-control` (package directory `apps/control`), both from `blox-eng/tekomltd`, branch `main`. Approve the Netlify GitHub app on the `blox-eng` org for this repo when Netlify asks.
- [ ] **Step 3: Set the environment variables.** Website: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `REVALIDATE_SECRET`, `SITE_URL`. Set `RESEND_API_KEY` and `MAIL_FROM` only after the sender domain is verified. Without them, the site stores enquiries and sends no mail. Control: the two Supabase public values, `SUPABASE_SERVICE_ROLE_KEY`, `REVALIDATE_SECRET`, `WEBSITE_URL`.
- [ ] **Step 4: Create the shared Tekom account.** In the Supabase dashboard: Authentication → Sign In / Providers → turn off "Allow new users to sign up". Then Users → Add user with Tekom's e-mail and a generated password. Keep the password in Tekom's password manager. Sign in once and set up TOTP on the Account screen.
- [ ] **Step 5: Write the smoke test.** It opens `/`, `/en/projects`, one project page, `/eu-programmes`, `/contact` and `/privacy` on the deployed URL and expects HTTP 200, no console error and no `@axe-core/playwright` violation of level `serious` or `critical`.
- [ ] **Step 6: Run the smoke test.** Run: `SITE_URL=https://tekomltd-website.netlify.app pnpm --filter @tekom/tests test:e2e website/smoke`. Expected: PASS.
- [ ] **Step 6b: Copy and adapt `daily-pulse.yml`.** Set the secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` and `PULSE_TO` in the GitHub repo.
- [ ] **Step 6b2: Write `backup.yml`.** Run weekly (Sunday 02:00 UTC) and on `workflow_dispatch`. Run `pg_dump` with secret `DATABASE_URL`, list `site-media` objects, encrypt both with `age` to the public key in secret `BACKUP_AGE_RECIPIENT`, and upload them as an artifact with `retention-days: 90`. Set the GitHub secrets with `gh secret set` from `.env.local`.
- [ ] **Step 6c: Turn on deploy previews.** In each Netlify site, set "Deploy previews" to "Any pull request" and the production branch to `main`.
- [ ] **Step 7: Copy `DEPLOYMENT.md` from vamyart and adapt it.** Describe the DNS move from SuperHosting: apex and `www` to Netlify, `control` CNAME to the control site, and keep the MX records unchanged.
- [ ] **Step 8: Commit.** `git commit -m "docs: deployment guide and smoke test"`

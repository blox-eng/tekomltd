# tekomltd.com Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Language:** The text of this plan follows ASD-STE100 Simplified Technical English. Procedural sentences are 20 words or fewer. Each sentence gives one instruction. Code, test names and copy strings are not STE text.

> **Amended 2026-10-14 (Martin):** the control app, Supabase and the contact form are out of scope. All content lives in this repo as files. Tekom (or anyone) changes content with a pull request. The site is fully static. Tasks 1–3 are done. Tasks 4–12 replace the old Tasks 4–16. The spec stays the design authority; where it describes the control app, Supabase, enquiries, Resend, revalidation, backups or the daily pulse, this amendment overrides it.

**Goal:** Build the public site tekomltd.com from the locked mockup, with every piece of content in versioned files that a pull request can change.

**Architecture:** One pnpm + Turborepo monorepo with one Next.js app (`apps/website`) and two shared packages (`packages/ui`, `packages/i18n`). Content is YAML and Markdown under `content/`, with images and PDFs next to it. A typed loader (`apps/website/src/content/`) reads and validates the content at build time with zod. A bad content file fails CI and the build. The site is statically generated and deployed to one Netlify site. There is no database, no runtime API and no secret.

**Tech Stack:** pnpm 10, Turborepo 2, Next.js 15.5 (App Router, static generation), React 19, TypeScript 5.9 strict, Tailwind 3.4, next-intl 4, zod, yaml, Vitest 3, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-tekomltd-site-design.md` (design, pages, SEO, EU visibility, GDPR). Also read `DESIGN.md`. `docs/control-pane-mapping.md` now only lists which content each public feature needs (the "Table(s)" column becomes a content file). The visual reference is `design/mockup/index.html`. The template source is `design/mockup/mockup.tpl.html`.

## Global Constraints

- Repo: `blox-eng/tekomltd`. Package scope: `@tekom/*`. Node ≥ 20. pnpm 10.
- App: `apps/website` (`@tekom/website`). Packages: `packages/ui`, `packages/i18n`. There is no `packages/db` and no `apps/control`.
- Content: `content/` at the repo root. Every text field has `bg` (required), `en` and `de` (optional). Field shape: `title: { bg: "…", en: "…", de: "…" }`.
- Locales: `bg` (default, no URL prefix), `en`, `de`. Bulgarian text is required. English and German are optional.
- Missing translation: show the Bulgarian text and the note "Translation to follow" (en) / "Übersetzung folgt" (de).
- Bulgarian copy from the mockup is copied exactly. Do not rephrase it.
- Colour, type, radius and motion values come only from `DESIGN.md` §1–§6. Do not use raw hex values in components.
- Fonts: Cormorant Garamond, Sofia Sans, IBM Plex Mono through `next/font/google` (self-hosted at build). Subsets `latin` and `cyrillic`.
- No runtime request to a third-party host. No cookies. No cookie banner. No form. No personal data is collected.
- Images: local files under `content/`, served through `next/image` and the Netlify Image CDN.
- Netlify site: `tekomltd-website` only, with `@netlify/plugin-nextjs`. No DNS change in this plan.
- Glyph keys (crew): `plumb trowel boards roller tiles spatula hat brick truss key ledger square laptop`.
- Glyph keys (services): `blueprint square beam permit survey bolt drop air window kitchen leaf solar tree`.
- Scopes: `full restore facade interior stone`.
- Commit messages: Conventional Commits, scope = app or package (`feat(website): …`).

## Review Focus

1. **A project has no English or German text.** The visitor sees the Bulgarian text with the note. The visitor never sees an empty heading. Test: Task 3 `pick` tests and Task 10 detail-page test.
2. **A project has no year, no built area or no coordinates.** The page hides each missing fact row. The page never shows "null m²". The map does not show the project. Test: Task 5 `toProjectCard` test and Task 9 `mapPins` test.
3. **An old WordPress URL has a percent-encoded Cyrillic slug.** The site sends a 301 to the new project page. Test: Task 11 `buildRedirects` test.
4. **A contributor adds a project file with a missing Bulgarian title, an unknown scope or a missing image.** `pnpm content:check` fails with the file name and the field. Test: Task 5 schema tests.
5. **The crew headline phrases do not share a start.** The content check fails and names the bad phrase. Test: Task 2 `splitTurn` test and Task 4 `checkContent` test.

## Reuse from vamyart

The source is `blox-eng/vamyart` at `main` (commit `c61c8b6` or later), cloned at `../vamyart`. Copy each file in this table. Then make only the change in the third column. Rename every `@vamy/` package scope to `@tekom/`. Remove all Stripe, auction, product, certificate, shipping, Algolia, Stackbit, newsletter, Supabase and tRPC code that comes with a copied file.

| vamyart source | tekomltd target | Change | Task |
|---|---|---|---|
| `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `.prettierrc`, `.gitignore`, `.vscode/` | same paths | done | 1 |
| `tests/` config | `tests/` | done | 1 |
| `.github/workflows/release.yml` | same path | done | 1 |
| `packages/ui/*` | `packages/ui/` | done | 2 |
| `packages/i18n/` | `packages/i18n/` | done | 3 |
| `apps/website/netlify.toml` | `apps/website/netlify.toml` | filter `@tekom/website`; no `remote_images` (images are local) | 7 |
| `apps/website/src/components/gallery/LandingSlider.tsx` + `.test.tsx`, `src/utils/slider-loop.ts` | `apps/website/src/components/rail/Rail.tsx` | start from it; remove the clone loop (the rail has a counter and an end); accept mixed slide kinds | 8 |
| `packages/db/scripts/backfill-image-dimensions.ts` | `scripts/lib/image-dimensions.ts` | reuse to read width and height during the WordPress import | 6 |
| `DEPLOYMENT.md` | `DEPLOYMENT.md` | keep the Netlify parts; remove Supabase, Stripe and Resend; add the DNS move | 12 |

**CI/CD:**
- Netlify builds `apps/website` from its `netlify.toml`. Each pull request gets a deploy preview. A merge to `main` deploys to production.
- `ci.yml` runs on each pull request: lint, typecheck, unit tests, `pnpm content:check`, and `pnpm build`.
- `release.yml` creates a GitHub release with semantic-release after each merge to `main`.

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

### Task 4: Drop the database layer, add the content schema

**Files:**
- Delete: `packages/db/`, `supabase/`, the `rls` job in `.github/workflows/ci.yml`, the root `supabase` devDependency, the Supabase and Resend variables in `.env-example`
- Create: `apps/website/src/content/schema.ts`, `apps/website/src/content/check.ts`, `apps/website/src/content/paths.ts`
- Modify: `apps/website/package.json` (script `content:check`), root `package.json` (script `content:check` through turbo), `.github/workflows/ci.yml` (run `pnpm content:check`)
- Test: `apps/website/src/content/schema.test.ts`

**Interfaces:**
- Consumes: Task 2 `GLYPHS` keys and `splitTurn`. Task 3 `LOCALES`.
- Produces:
  - `const L = z.object({ bg: z.string().trim().min(1), en: z.string().optional(), de: z.string().optional() })` (localised text).
  - zod schemas and inferred types: `Project`, `ProjectImage`, `RailPanel`, `Promise`, `Stat`, `Crew`, `CrewRole`, `PartnerService`, `Partner`, `MaterialBrand`, `EuProgramme`, `Publication`, `LegalPage`, `Settings`. Fields follow spec §7, with these changes: no `published`, `created_at`, `updated_at`, `enquiries`, `og_image_path` or `*_path` storage columns. A file path is relative to its content file. A project keeps `old_slugs: string[]` instead of `project_slug_history`. A project has `draft: boolean` (default false): a draft is not built.
  - Content layout (`paths.ts`):
    - `content/settings.yaml` (company, contacts, socials, crew headline phrases per locale, SEO defaults)
    - `content/home.yaml` (rail panels, promises, stats, crews with roles, partner services, materials, partners)
    - `content/projects/<slug>/project.yaml` + the images of that project in the same folder
    - `content/eu-programmes.yaml`, `content/publications.yaml` + `content/publications/<file>.pdf`
    - `content/legal/<slug>.<locale>.md` with front matter `title`, `updated`, `reviewed`
    - `content/brands/<file>.png|svg`, `content/partners/<file>.png|svg`
  - `checkContent(root): { ok: true } | { ok: false; errors: { file: string; path: string; message: string }[] }`. It validates every file, checks that every referenced image or PDF exists, that project slugs are unique and match their folder name, that `old_slugs` do not collide with a slug, and that the crew headline phrases pass `splitTurn`.
  - `pnpm content:check` prints each error as `<file>: <field> <message>` and exits 1 on any error.

- [ ] **Step 1: Delete the database layer.** Remove the files listed above. Run `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`. Expected: PASS.
- [ ] **Step 2: Write the schema tests.** Use small fixture trees under `apps/website/src/content/__fixtures__/`.

```ts
it("needs a Bulgarian title", () => expect(Project.safeParse({ ...minimal, title: { en: "x" } }).success).toBe(false));
it("allows only known scopes", () => expect(Project.safeParse({ ...minimal, scopes: ["roofing"] }).success).toBe(false));
it("allows only known glyph keys", () => expect(CrewRole.safeParse({ ...role, tool: "hammer" }).success).toBe(false));
it("reports a missing image with its file", () => {
  const r = checkContent(fixture("missing-image"));
  expect(r.ok).toBe(false); expect(r.errors[0].file).toMatch(/project\.yaml$/);
});
it("rejects headline phrases with a different start", () => {
  expect(checkContent(fixture("bad-headline")).errors[0].message).toMatch(/Екипът зад мечтата/);
});
it("rejects a slug that does not match its folder", () => { /* … */ });
```

- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Write `schema.ts`, `paths.ts` and `check.ts`.** Use `yaml` to parse YAML and `gray-matter` for Markdown front matter. Keep summaries to 420 characters or fewer.
- [ ] **Step 5: Add `content:check` to CI.** It runs before the build.
- [ ] **Step 6: Run the tests.** Expected: PASS.
- [ ] **Step 7: Commit.** `git commit -m "feat(website): content schema and check; drop the database layer"`

---

### Task 5: Content loader (read model)

**Files:**
- Create: `apps/website/src/content/load.ts`, `apps/website/src/content/cards.ts`, `apps/website/src/content/home.ts`, `apps/website/src/content/projects.ts`, `apps/website/src/content/public-info.ts`, `apps/website/src/content/settings.ts`
- Test: `apps/website/src/content/*.test.ts`

**Interfaces:**
- Consumes: Task 3 `pick`, `Locale`. Task 4 schemas and paths.
- Produces (all synchronous or async file reads at build time; `root` defaults to the repo `content/` folder, tests pass a fixture root):
  - `type Img = { src: StaticImport-compatible public path; width: number; height: number; alt: string }`
  - `type ProjectCard = { slug; title; titleFallback: boolean; place; year: number | null; areaM2: number | null; scopes: Scope[]; cover: Img; wide: boolean; pin: { lat: number; lng: number } | null }`
  - `toProjectCard(project, cover, locale): ProjectCard`
  - `getHome(locale, root?): HomeData` where `HomeData = { rail: ProjectCard[]; panels: Panel[]; promises; stats; crews: Crew[]; partnerServices; brands; partners; settings }`
  - `listProjects(locale, root?): ProjectCard[]`
  - `getProject(slug, locale, root?): ProjectDetail | null` with `next: { slug; title }`
  - `listProgrammes(locale, root?)`, `listPublications(locale, kind?, root?)`, `getLegalPage(slug, locale, root?)`, `getSettings(locale, root?)`
  - `allProjectSlugs(root?): { slug: string; wpSlug: string | null; wpId: number | null; oldSlugs: string[] }[]`
  - Media: a prebuild step `scripts/sync-media.ts` copies every image and PDF from `content/` to `apps/website/public/media/` (gitignored), keeping the relative path. `Img.src` is `/media/<path>`. Width and height are read from the file at load time with `image-size`.

- [ ] **Step 1: Write the card tests.**

```ts
it("hides missing facts as null", () => {
  const c = toProjectCard({ ...project, year: undefined, built_area_m2: undefined, lat: undefined, lng: undefined }, cover, "en");
  expect(c.year).toBeNull(); expect(c.areaM2).toBeNull(); expect(c.pin).toBeNull();
});
it("marks Bulgarian fallback", () => {
  expect(toProjectCard({ ...project, title: { bg: "Очен център" } }, cover, "en").titleFallback).toBe(true);
});
```

- [ ] **Step 2: Write the loader tests against a fixture root.** Assert: `getHome` returns rail projects in `sort` order with `on_rail = true` only. Drafts never appear. `partners` is `[]` when the list is empty. `getProject` returns `next` and wraps from the last project to the first. `sync-media` copies a nested image to the same relative path.
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Write the loader.** Read each file once per build (memoise per root). Do not read files inside a render loop.
- [ ] **Step 5: Run the tests.** Expected: PASS.
- [ ] **Step 6: Commit.** `git commit -m "feat(website): typed content loader"`

---

### Task 6: Content from the mockup and the WordPress import

**Files:**
- Create: `scripts/import-wordpress.ts`, `scripts/wp-parse.ts`, `scripts/lib/image-dimensions.ts` (from vamyart, if still useful), `scripts/seed-from-mockup.ts`
- Create: the `content/` tree (generated, then committed)
- Test: `scripts/wp-parse.test.ts` (fixture: `design/mockup/data/portfolio.json`)

**Interfaces:**
- Consumes: Task 4 schemas and `checkContent`.
- Produces: `parseDetails(html: string): { date: string | null; address: string | null; areaM2: number | null }`, `excerpt(html: string): string` (≤ 420 chars, cut at a sentence end, not after `ул.`, `инж.`, `арх.`, `гр.`, `с.`, `кв.`, `г.`), `galleryUrls(html: string): string[]` (full-size only, no `-NNNxNNN` thumbnails, deduped), `pnpm import:wp`, `pnpm import:wp --publications`. A filled `content/` tree that passes `pnpm content:check`.

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
- [ ] **Step 4: Write `import-wordpress.ts`.** Read the WordPress REST URL of spec §11. Take titles, scopes, `wide` and the order from `design/mockup/data/projects.json`. Take coordinates from `design/mockup/data/geo.json`. Download each cover and each gallery image into `content/projects/<slug>/`. Downscale each image to 2400 px on the long side and re-encode as JPEG quality 82 with `sharp`, so the repo stays small. Write `project.yaml` with the Bulgarian title as `alt.bg` of each image. Set `wp_id` and `wp_slug`. Make the script idempotent: it overwrites generated fields and keeps the files.
- [ ] **Step 4b: Write the `--publications` mode.** Read `/publications/` and the two EU programme pages. Download each linked PDF or DOC to `content/publications/`. Write `content/publications.yaml` with `wp_url` and the programme code.
- [ ] **Step 4a: Snapshot the whole WordPress site.** Martin asked for all content of the current tekomltd.com to be kept. Fetch every page (`/wp-json/wp/v2/pages?per_page=100`, 11 pages), every portfolio item, every category and the full media library (`/wp-json/wp/v2/media`, 326 items, paginate). Save the raw JSON to `design/wordpress-snapshot/` (committed, for reference). Download every non-image media file (PDF, DOC, DOCX, XLS) into `content/publications/` and every image that a page or project uses into its content folder. Write `design/wordpress-snapshot/INVENTORY.md`: one row per page, media file and portfolio item, with its new home in `content/` or "not used" and the reason.
- [ ] **Step 4b2: Keep every WordPress page.** Pages with a slot in the mockup feed that slot (home, projects, contact, privacy, publications). Pages without a slot (`/about/`, `/services/`, `/services/private-services/`, `/services/business-services/`, `/free-positions/`, `/publications/invitations/`) become Markdown pages under `content/pages/<slug>.bg.md` with front matter `title`, `updated`. Convert the WordPress HTML to clean Markdown (drop Avada shortcodes and inline styles; keep text, lists, links, images and PDF links). Keep the Bulgarian text as it is on the live site. Task 10 renders them with the legal-page layout. Task 11 redirects each old URL to its new page instead of `/`.
- [ ] **Step 4b3: Use the real founding year.** Tekom was founded in 1991 (Martin, 2026-10-14). Store `founded: 1991` in `content/settings.yaml`. Every "25 years" figure in the mockup copy becomes the years since 1991 (35 in 2026), and that figure is confirmed, not a placeholder. Compute it from `founded` at build time where the copy has a number slot; where the number sits inside a fixed Bulgarian sentence, write 35.
- [ ] **Step 4c: Write the legal pages.** Port the WordPress privacy policy into `content/legal/privacy.bg.md`. Rewrite it for a static site with no form and no data collection: Netlify is the only processor. Draft the cookies, data-rights and terms pages in Bulgarian from spec §10 with the same facts. Translate all four to English and German. Set `reviewed: false` on all twelve files.
- [ ] **Step 5: Write `seed-from-mockup.ts` and run it once.** Transcribe from the mockup into `content/home.yaml` and `content/settings.yaml`: `SVC` → rail panels, `CREW` → crew stat panels, the four promises, the stats, `CREWS` → crews and roles, `PSVC` → partner services, the eight brands (copy the logos from `design/mockup/logos/` to `content/brands/`), the two EU programmes, the settings. Leave `partners` empty. Copy all copy strings exactly.
- [ ] **Step 6: Run the tests and the check.** Run: `pnpm test && pnpm content:check`. Expected: PASS. Expected content: 17 projects, every gallery image, 9 + 4 crew roles, every WordPress page, every publication file, and an inventory with no unexplained row.
- [ ] **Step 7: Commit.** Commit the scripts first, then the generated `content/` in a second commit. `git commit -m "feat(content): WordPress import and mockup seed"`, `git commit -m "chore(content): import 17 projects, publications and legal pages"`

---

### Task 7: Website shell (locale routing, header, footer, theme)

**Files:**
- Create: `apps/website/next.config.ts`, `apps/website/middleware.ts` (next-intl), `apps/website/src/i18n/routing.ts`
- Create: `apps/website/src/app/[locale]/layout.tsx`, `apps/website/src/components/Header.tsx`, `Footer.tsx`, `ThemeToggle.tsx`, `ThemeScript.tsx`, `LangSwitch.tsx`
- Create: `apps/website/src/app/[locale]/[legal]/page.tsx` (privacy, cookies, data-rights, terms)
- Create: `apps/website/netlify.toml`, `apps/website/tailwind.config.ts`
- Test: `tests/e2e/website/shell.spec.ts`

**Interfaces:**
- Consumes: Task 2 tokens, fonts, Tailwind preset, `Button`. Task 3 catalogues. Task 5 `getSettings`, `getLegalPage`.
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
test("no cookie is set", async ({ page, context }) => {
  await page.goto("/"); expect(await context.cookies()).toHaveLength(0);
});
```

- [ ] **Step 2: Run the tests.** Run: `pnpm --filter @tekom/tests test:e2e`. Expected: FAIL.
- [ ] **Step 3: Write the routing.** Use next-intl `localePrefix: "as-needed"` with `defaultLocale: "bg"`. Generate every locale and page statically (`generateStaticParams`). Make sure next-intl sets no locale cookie (`localeCookie: false`).
- [ ] **Step 4: Write `ThemeScript`.** Put an inline script in `<head>`. It reads `localStorage["tekom-theme"]` in `try/catch` and sets `data-theme` before paint.
- [ ] **Step 5: Write `Header` and `Footer`.** Follow `DESIGN.md` §7 and the mockup markup. The header keeps the "Request a quote" button; it links to `/contact`. Hide each social icon when its URL is empty.
- [ ] **Step 6: Write the legal page route.** Render Markdown with `react-markdown`. Show "last updated" from the front matter.
- [ ] **Step 7: Write `netlify.toml` and `tailwind.config.ts`.** Copy `apps/website/netlify.toml` from vamyart. Set the filter to `@tekom/website`. Run `sync-media` before `next build`. The Tailwind config uses the `@tekom/ui` preset.
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

- [ ] **Step 2: Write the e2e tests.** The crews heading shows a dotted turning phrase that changes within 4 s. With `reducedMotion: "reduce"` it does not change. A hover on a crew role turns the matching scene glyph to the accent colour. The partners section is absent when no partner exists. A click on a map pin opens the project page.
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Write `geo.ts` and the two map components.** Port `bgMap` and `szMap` from the mockup. Each pin is an `<a>` with `aria-label` = project title.
- [ ] **Step 5: Write `CrewScene`.** Port `sceneSite`, `sceneOffice` and `AT` from the mockup. Show the group photo instead when the crew has a `group_photo`. Hide quips and stamp when the photo is set.
- [ ] **Step 6: Write the other sections.** Return `null` when the list is empty. Copy the CSS from the mockup. Render `TurningWord` with `key={locale}`.
- [ ] **Step 7: Run the tests.** Expected: PASS.
- [ ] **Step 8: Commit.** `git commit -m "feat(website): promise, stats, crews, partner services, map, materials"`

---

### Task 10: Project pages, public information and contact

**Files:**
- Create: `apps/website/src/app/[locale]/projects/page.tsx`, `projects/[slug]/page.tsx`
- Create: `apps/website/src/app/[locale]/eu-programmes/page.tsx`, `publications/page.tsx`, `contact/page.tsx`
- Create: `packages/ui/src/assets/eu-emblem.svg`
- Test: `tests/e2e/website/pages.spec.ts`

**Interfaces:**
- Consumes: Task 5 loaders. Task 3 `pick`.
- Produces: the five routes, statically generated for every locale and project.

- [ ] **Step 1: Write the e2e tests.** The detail page of a project without an English title shows the Bulgarian title and "Translation to follow" under `/en`. A project without `year` shows no "Completed" row. The contact page shows the phone, the e-mail as a `mailto:` link and the office address, and has no `<form>`. Under `/` (bg) the page never shows "Translation to follow" or „Превод предстои“.
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Write the pages.** Follow the mockup views `projects`, `detail`, `eu`, `contact`. The contact view keeps the mockup's heading, copy and contact block, and drops the form. The EU page shows, for each programme: the EU emblem with "Co-funded by the European Union" (localised), the summary, objectives, results, total budget, EU contribution and period (spec §8b). Use the official emblem SVG.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(website): project pages, EU programmes, publications, contact"`

---

### Task 11: SEO and WordPress redirects

**Files:**
- Create: `apps/website/src/lib/seo.ts`, `apps/website/src/lib/jsonld.ts`, `apps/website/src/app/sitemap.ts`, `apps/website/src/app/robots.ts`
- Create: `apps/website/src/lib/redirects.ts`; modify `apps/website/next.config.ts` and `apps/website/middleware.ts`
- Test: `apps/website/src/lib/redirects.test.ts`, `apps/website/src/lib/seo.test.ts`

**Interfaces:**
- Consumes: Task 5 `allProjectSlugs`, `getSettings`, `listPublications`.
- Produces: `buildRedirects(slugs, files): Redirect[]` (Next.js redirect objects, `permanent: true`; `slugs` include `oldSlugs`; `files` = `publications.wp_url` and imported image URLs mapped to `/media/...`), `alternates(path): Metadata["alternates"]`, `businessJsonLd(settings)`, `projectJsonLd(detail, locale)`.

- [ ] **Step 1: Write the redirect tests.**

```ts
const r = buildRedirects([{ slug: "asenov-129", wpSlug: "жилищна-сграда-с-магазини-и-гаражи", wpId: 1310, oldSlugs: [] }], []);
it("redirects the encoded WordPress project URL", () => expect(r).toContainEqual(expect.objectContaining({
  source: "/project-view/%D0%B6%D0%B8%D0%BB%D0%B8%D1%89%D0%BD%D0%B0-%D1%81%D0%B3%D1%80%D0%B0%D0%B4%D0%B0-%D1%81-%D0%BC%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD%D0%B8-%D0%B8-%D0%B3%D0%B0%D1%80%D0%B0%D0%B6%D0%B8/:rest*",
  destination: "/projects/asenov-129", permanent: true })));
it("redirects the numeric WordPress URL", () => { /* /project-view/1310/:rest* → /projects/asenov-129 */ });
it("covers the static list of spec §9", () => { /* /about/, /contact/, /publications/, /services/:p*, /home/privacy-policy/, /portfolio_category/:p* */ });
it("redirects an imported upload to its new URL", () => { /* /wp-content/uploads/2026/04/x.pdf → /media/publications/x.pdf */ });
it("redirects an old slug", () => { /* /projects/old-slug → /projects/new-slug */ });
```

- [ ] **Step 2: Write the SEO tests.** `alternates("/projects/x")` returns `bg`, `en`, `de` and `x-default` URLs. `projectJsonLd` has `locationCreated.geo` only when the pin exists.
- [ ] **Step 3: Run the tests.** Expected: FAIL.
- [ ] **Step 4: Write the code.** Build the redirects at build time in `next.config.ts` `redirects()`. Return HTTP 410 for `/wp-admin*`, `/wp-login.php` and `/xmlrpc.php` in `middleware.ts`. Do not return 410 for other `/wp-content/*` URLs.
- [ ] **Step 5: Run the tests.** Expected: PASS.
- [ ] **Step 6: Commit.** `git commit -m "feat(website): metadata, JSON-LD, sitemap and WordPress redirects"`

---

### Task 12: Contributor guide and the demo deploy

**Files:**
- Create: `CONTENT.md`, `.github/pull_request_template.md`, `tests/e2e/website/smoke.spec.ts`
- Copy from vamyart and adapt: `DEPLOYMENT.md`
- Modify: `README.md`, `tests/api/helpers.ts` (remove the unused tRPC helpers)

**Interfaces:**
- Consumes: all tasks.
- Produces: a live Netlify site and a guide that lets a non-developer change content with a pull request.

- [ ] **Step 1: Write `CONTENT.md`.** In Bulgarian first, then English. Explain, with one example each: add a project (copy a folder, edit `project.yaml`, drop photos in), change a text, add a translation, hide a project (`draft: true`), add a publication PDF, add a partner. Explain how to do it in the GitHub web editor ("Add file → Upload files", "Edit", "Propose changes"), and that the deploy preview link in the pull request shows the result before the merge.
- [ ] **Step 2: Write the pull request template.** It asks for the preview link check and runs through `content:check` in CI.
- [ ] **Step 3: Write the smoke test.** It opens `/`, `/en/projects`, one project page, `/eu-programmes`, `/contact` and `/privacy` on `SITE_URL` and expects HTTP 200, no console error, no request to another host, and no `@axe-core/playwright` violation of level `serious` or `critical`.
- [ ] **Step 4: Link the Netlify site.** Site `tekomltd-website` in Tekom's team: base directory `apps/website`, repo `blox-eng/tekomltd`, production branch `main`, deploy previews for any pull request. Turn off the visitor access control ("Team login") on this site so the demo is public. The Netlify GitHub app on `blox-eng` must allow the repo.
- [ ] **Step 5: Deploy and run the smoke test.** Run: `SITE_URL=https://tekomltd-website.netlify.app pnpm --filter @tekom/tests test:e2e website/smoke`. Expected: PASS.
- [ ] **Step 6: Copy `DEPLOYMENT.md` from vamyart and adapt it.** Keep only Netlify. Describe the DNS move from SuperHosting: apex and `www` to Netlify; keep the MX records unchanged. Do not change DNS.
- [ ] **Step 7: Commit.** `git commit -m "docs: content guide, deployment guide and smoke test"`

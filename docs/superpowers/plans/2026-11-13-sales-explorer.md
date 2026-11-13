# Sales Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A project with units gets a sales layout (totals, elevation, floor plans, unit list), one page per unit with a `mailto:` enquiry, a DXF → SVG script, and updates that can show on the home page.

**Architecture:** Units and a `sales` block live as content next to `project.yaml`; a loader turns them into a `SalesView` with totals counted from the units. A repo script converts a prepared DXF into a cleaned SVG in a format the site owns, and the page inlines it with one link per unit. Everything renders at build time; the only client code is the floor switch/scroll index and the list filter.

**Tech Stack:** Next.js 15 app router, next-intl, zod 4, vitest, Playwright, tsx scripts. No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-11-13-sales-explorer-design.md`

## Global Constraints

- No price field anywhere; unit schema is `z.strictObject`, so `price:` fails `content:check`.
- No `.dxf`/`.dwg` under `content/`.
- A project without `sales` renders exactly as on `main` (pixel compare, 0 px).
- Status = glyph + word, never hue alone. Red only for the active floor/unit and the one CTA per view. Text never in `--faint`.
- Statuses: `free | reserved | sold | upcoming`; words bg: свободен, резервиран, продаден, предстои.
- Types: `flat | garage | parking | storage | shop`; labels bg: Ап., Гараж, Паркомясто, Склад, Магазин. Only `flat` has `rooms`.
- Areas: `total` (обща), `built` (застроена, measured), `net` (чиста); rule `net ≤ built ≤ total`; totals range quotes `total`.
- CTA per status: free "Попитай за <label>", reserved "Попитай дали се освобождава", upcoming "Запиши интерес", sold none + link to free units.
- Mail subject: `Запитване: <project title> · <unit label>, ет. <floor label>`; body: page URL, newline, "Здравейте, интересувам се от <unit label>." in the page locale.
- `sales.view`: `switch` (default) or `scroll`; hash `#etazh-<floor key>`.
- Floor keys ASCII slugs `^-?[a-z0-9]+$`; unit codes `^[A-Za-z0-9-]+$`, URL lowercase, unique once lowercased.
- 390 px: plan fits width without pinch-zoom; no horizontal page scroll.
- Copy rules: bg first, en/de may fall back with the existing fallback note. Errors in bg with the fix.
- Signed Conventional Commits, `(#46)` in the subject.

## Review Focus

1. A maisonette (two `floors`) counts once in the totals but appears on both floor plans and in both floor counts.
2. A unit code in upper case (`A3`) resolves at `/projects/<slug>/a3`; `/projects/<slug>/A3` is a 404, not a duplicate page.
3. The "само свободни" filter on a floor with none free says so ("Няма свободни …") instead of showing an empty list.
4. A project title with `&`, quotes or Cyrillic produces a valid `mailto:` (every part `encodeURIComponent`-ed).
5. A DXF with an outline but no code text, or two codes in one outline, is refused with the outline's position, and writes nothing.

---

## File map

- `apps/website/src/content/schema.ts` — `UNIT_STATUSES`, `UNIT_TYPES`, `ORIENTATIONS`, `Unit`, `Sales`; `Project.sales` optional.
- `apps/website/src/content/paths.ts` — `PLANS_DIR = 'plans'`, `UNITS_DIR = 'units'`, `planFile`, `unitFile`.
- `apps/website/src/content/plan.ts` — `readPlan(svg)`, `writePlan(plan)`: the SVG format the site owns.
- `apps/website/src/content/sales.ts` — `loadSales(...)`: `SalesView`, totals.
- `apps/website/src/content/enquiry.ts` — `unitLabel`, `enquiryHref`.
- `apps/website/src/content/check.ts` — `checkSales`, update `home`/`cta` rules, DXF ban.
- `apps/website/src/content/progress.ts` — `UpdateFront.home`, `UpdateFront.cta`; `UpdateView.home/cta`.
- `apps/website/src/content/home.ts` (or new `announcement.ts`) — `latestAnnouncement(locale, root)`.
- `apps/website/scripts/blueprint.ts` (+ `scripts/lib/dxf.ts`) — DXF reader and the command.
- `apps/website/src/components/sales/` — `Totals.tsx`, `Elevation.tsx`, `FloorPlan.tsx`, `Floors.tsx` (client: switch/scroll), `UnitList.tsx` (client filter over a server table), `UnitStatus.tsx`, `sales.module.css`.
- `apps/website/src/app/[locale]/projects/[slug]/[unit]/page.tsx` — the unit page.
- `apps/website/src/components/home/Announcement.tsx` — the home band.
- `packages/i18n/messages/{bg,en,de}.json` — `sales` namespace, `home.announcement`.
- `tests/fixtures/content/projects/sale-block/` — the example building.
- `tests/e2e/website/sales.spec.ts`, `tests/e2e/website/announcement.spec.ts`.
- `CONTENT.md` — section 9.

---

### Task 1: Units, sales block and the loader

**Files:** Modify `schema.ts`, `paths.ts`, `projects.ts`; Create `content/plan.ts`, `content/sales.ts`, `content/sales.test.ts`, `content/plan.test.ts`, loader fixture `src/content/__fixtures__/loader/projects/sale-block/` (project.yaml with `sales`, `plans/0.svg`, `plans/1.svg`, `units/*.yaml`).

**Interfaces — Produces:**
```ts
// schema.ts
export const UNIT_STATUSES = ['free','reserved','upcoming','sold'] as const;
export const UNIT_TYPES = ['flat','garage','parking','storage','shop'] as const;
export const ORIENTATIONS = ['N','NE','E','SE','S','SW','W','NW'] as const;
export const Unit: z.ZodType // strictObject { code, type, floors: string[1..2], rooms?: int≥1, area: {total, built, net} (m², >0), terrace?: number>0, orientation: ORIENTATIONS[] default [], status, note?: L }
export const Sales  // strictObject { email?: email, view: 'switch'|'scroll' default 'switch', floors: [{ key, label?: L }] min 1 (bottom → top), updated: isoDate }
// plan.ts
export type Plan = { viewBox: [number, number, number, number]; walls: string; units: { code: string; d: string; x: number; y: number }[] };
export function readPlan(svg: string): Plan;          // throws Error('…') on any other shape
export function writePlan(plan: Plan): string;        // <svg viewBox> <path class="walls" d/> <path data-unit data-x data-y d/>…
// sales.ts
export type UnitView = { code: string; slug: string; type: UnitType; floors: { key: string; label: string | null }[]; rooms: number|null; area: {total:number; built:number; net:number}; terrace: number|null; orientation: Orientation[]; status: UnitStatus; note: string|null; noteFallback: boolean };
export type FloorView = { key: string; label: string | null; plan: Plan; units: UnitView[]; free: number };
export type Totals = { units: number; byStatus: Record<UnitStatus, number>; freeArea: { min: number; max: number } | null };
export type SalesView = { email: string; view: 'switch'|'scroll'; updated: string; floors: FloorView[] /* top → bottom */; units: UnitView[] /* by floor then code */; totals: Totals };
export function loadSales(project: Project, projectFile: string, root: string, locale: Locale, fallbackEmail: string): SalesView | null;
```
`ProjectDetail.sales: SalesView | null` in `projects.ts`. `label: null` means the component renders the i18n default "Етаж N".

- [ ] **Step 1: Failing tests** in `plan.test.ts`: `writePlan` then `readPlan` round-trips; `readPlan('<svg/>')` throws "плана няма viewBox". In `sales.test.ts` against the loader fixture:
  - `loadSales` on a project without `sales` returns `null`.
  - totals on the fixture: `{ units: 8, byStatus: { free: 3, reserved: 1, upcoming: 1, sold: 3 }, freeArea: { min: 48, max: 112 } }`.
  - the maisonette `7` appears in floor `1` and floor `2` units, counts once in `totals.units` (Review Focus 1).
  - `floors[0].key` is the top floor.
  - unit `A3` has `slug: 'a3'`.
  - `email` falls back to the argument when `sales.email` is unset.
  - en locale with only a bg note → `noteFallback: true`.
- [ ] **Step 2:** `pnpm --filter website test sales plan` → FAIL (modules missing).
- [ ] **Step 3:** Implement. Units are read from `units/*.yaml`; a file name must equal `<code>.yaml`.
- [ ] **Step 4:** tests PASS; `pnpm --filter website typecheck` clean.
- [ ] **Step 5:** commit `feat(content): units and a sales block next to the project (#46)`.

### Task 2: content:check for sales

**Files:** Modify `check.ts`, `check.test.ts`; fixtures under `src/content/__fixtures__/` (`sales-valid`, `sales-bad`).

**Consumes:** `Unit`, `Sales`, `readPlan`, `planFile`, `unitFile`.

- [ ] **Step 1: Failing tests**, one per rule, each asserting the bg message contains the named fix:
  - `price: 120000` in a unit → error from the strict schema, message names the key `price`.
  - any `.dxf` or `.dwg` under `content/` → "махни DXF/DWG файла от content/; качи само плана, направен с pnpm blueprint".
  - unit floor not in `sales.floors` → error; a floor in `sales.floors` without `plans/<key>.svg` → error.
  - plan `data-unit` without a unit file and unit without an outline on its floors → two errors, each names the code.
  - `area.net > area.built` or `area.built > area.total` → error.
  - `rooms` on a non-flat → error; a flat without `rooms` → error.
  - `A3` and `a3` → error "кодовете се повтарят".
  - `sales` with no units → error.
  - `sales.updated` 46 days before `today` → warning (any progress status); 45 days → none.
  - `sales-valid` → `ok: true`, no warnings.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** Implement `checkSales(file, folder, project)` called next to `checkProgress`; the DXF scan walks the whole content root once.
- [ ] **Step 4:** tests PASS; `CONTENT_ROOT=../../content pnpm --filter website content:check` still passes on real content.
- [ ] **Step 5:** commit `feat(check): refuse prices, DXF files and broken plans in sales content (#46)`.

### Task 3: `pnpm blueprint`

**Files:** Create `scripts/lib/dxf.ts`, `scripts/lib/dxf.test.ts`, `scripts/blueprint.ts`, `scripts/blueprint.test.ts`, `scripts/__fixtures__/floor-mm.dxf`, `floor-nocode.dxf`, `floor-cp1251.dxf` (hand-written minimal ASCII DXF R2000, generated by a helper in the test file is also fine). Add `"blueprint": "tsx scripts/blueprint.ts"` to app and root `package.json`.

**Interfaces — Produces:**
```ts
// dxf.ts — reads only what the script needs; own parser, no dependency
export type Entity = { type: 'LINE'|'LWPOLYLINE'|'ARC'|'CIRCLE'|'TEXT'|'MTEXT'; layer: string; points?: [number,number][]; closed?: boolean; center?: [number,number]; radius?: number; start?: number; end?: number; text?: string; at?: [number,number] };
export function readDxf(bytes: Buffer): { insunits: number | null; entities: Entity[] };   // decodes $DWGCODEPAGE ANSI_1251 as windows-1251, else utf-8; strips MTEXT codes (\A1; {\f…;} \W… \P → space)
// blueprint.ts
export type BlueprintResult = { plan: Plan; units: { code: string; built: number }[]; unit: 'mm'|'cm'|'m'; guessed: boolean; wallLines: number };
export function blueprint(bytes: Buffer, opts: { walls?: string; units?: 'mm'|'cm'|'m' }): BlueprintResult;   // throws BlueprintError(messages: string[])
export function run(argv: string[], root: string, log: (s: string) => void): number;   // exit code
```
Rules: unit outlines = closed `LWPOLYLINE` on `TEKOM_UNIT`; exactly one TEXT/MTEXT inside each (point-in-polygon on `at`); walls = LINE/LWPOLYLINE/ARC/CIRCLE on `--walls` layer, or on every layer except `TEKOM_UNIT` and layers whose name matches `/dim|annot|text|размер|текст/i`. Unit detection: `$INSUNITS` 4=mm, 5=cm, 6=m; else by the drawing's width (>8000 → mm, >800 → cm, else m). Output in metres, y flipped, rounded to 0.01. `built` = shoelace area, m², 1 decimal. ARC/CIRCLE become SVG `A` commands.

- [ ] **Step 1: Failing tests:**
  - `readDxf` on the cp1251 fixture returns text `"12"` and layer `"Стени"`.
  - `blueprint(floor-mm)`: `unit: 'mm'`, `guessed: true`, unit codes `['12','13']`, `built` of `12` = `86.0`, `plan.viewBox[2]` ≈ width in metres, every number in `plan` has ≤ 2 decimals.
  - `--units cm` on the same file divides by 10 relative to mm.
  - `floor-nocode` → `BlueprintError` whose message includes "Контур без код" and the position in metres (Review Focus 5); two texts in one outline → "два кода в един контур".
  - `run(['sale-block','1','x.dxf'])` in a temp content root writes `plans/1.svg` and stubs `units/12.yaml` with `floors: ['1']`, `area.built`, `status: upcoming`, `type: flat`; an existing unit file is left unchanged and the log prints both areas when they differ by > 2%.
  - `run` with an unknown project slug → exit 1, "Няма проект <slug>".
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** Implement. Summary line: `Етаж 1: 2 обекта (12, 13), стени: N линии, мерна единица: mm (предположение — ако е грешно, добави --units cm)`.
- [ ] **Step 4:** PASS; then run the script on the fixture DXF into `tests/fixtures/content/projects/sale-block` to produce the e2e plans (Task 5 uses them).
- [ ] **Step 5:** commit `feat(scripts): pnpm blueprint turns a prepared DXF into a floor plan (#46)`.

### Task 4: Labels and the enquiry link

**Files:** Create `content/enquiry.ts`, `content/enquiry.test.ts`.

**Interfaces — Produces:**
```ts
export function unitLabel(unit: Pick<UnitView,'type'|'code'>, words: Record<UnitType,string>): string;   // "Ап. 12"
export function enquiryHref(input: { email: string; project: string; unit: string; floor: string; url: string; greeting: string; subjectPrefix: string }): string;
```
- [ ] **Step 1: Failing tests:** `unitLabel({type:'garage',code:'3'}, bgWords) === 'Гараж 3'`; `enquiryHref` for project `Блок „Кула“ & Co`, unit `Ап. 12`, floor `ет. 4` decodes (`decodeURIComponent` of subject/body) to exactly `Запитване: Блок „Кула“ & Co · Ап. 12, ет. 4` and `"<url>\nЗдравейте, интересувам се от Ап. 12.\n\n"`; the raw href contains no literal `&` inside the subject (Review Focus 4).
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** commit `feat(content): the enquiry is a mailto link with the unit in the subject (#46)`.

### Task 5: The sales layout on the project page

**Files:** Create `components/sales/*`; Modify `app/[locale]/projects/[slug]/page.tsx`, i18n `bg/en/de.json` (`sales` namespace: status words, type words, totals phrases, `asOf`, `floor`, `freeOnFloor`, `onlyFree`, `noneFree`, `filters`, `rooms`, `area.*`, `cta.*`, `allFree`); Create fixture `tests/fixtures/content/projects/sale-block/` (published, in progress, `view: switch`, 3 floors `0,1,2`, 8 units incl. garage `G1` on `0` and maisonette `7` on `1,2`; plans from Task 3) and `tower-rising` gets nothing new; `tests/e2e/website/sales.spec.ts`. Update count assertions in `pages.spec.ts` for one more project.

**Consumes:** `SalesView`, `unitLabel`, `Plan`.

Section order on a sales page: hero → Progress (#45) → `Totals` + "наличност към DD.MM.YYYY" → `Floors` (Elevation + FloorPlan, id `apartamenti`) → `UnitList` → update log stays inside Progress. `FloorPlan` inlines the plan: walls path stroke `--ink`, each unit an `<a href="/projects/<slug>/<slug>">` wrapping its path, fill by status token (free: `--wall`, reserved/upcoming: hatched pattern, sold: `--line` muted), code text at `x,y`, `aria-label` "Ап. 12, етаж 1, 3 стаи, 86 m² обща, свободен". Elevation: one row per floor, top first, each a link `#etazh-<key>` with "Етаж 1 · 2 свободни". `Floors` client: `switch` shows the hash floor (default the lowest floor with a free unit, else the lowest), `scroll` renders all with the YearIndex pattern (sticky column, IntersectionObserver, `aria-current`, `scroll-snap-type: y proximity`). Without JS every plan renders (switch hides others only after hydration). `UnitList`: server-rendered `<table>`; the client adds floor/rooms/type selects and "само свободни"; zero matches shows `noneFree` (Review Focus 3).

- [ ] **Step 1: Failing e2e** in `sales.spec.ts`:
  - `/projects/sale-block` shows totals text `8 обекта · 3 свободни · 1 предстои · 1 резервиран · 3 продадени` and `свободни от 48 до 112 m² обща площ`, and `наличност към`.
  - clicking elevation `Етаж 2` sets URL hash `#etazh-2` and shows a plan containing the link `Ап. 7`.
  - clicking unit `Ап. 12` on the plan navigates to `/projects/sale-block/12`.
  - keyboard: Tab from the elevation reaches each floor link then the unit links; Enter on a unit opens its page.
  - "само свободни" + floor `2` with none free shows `Няма свободни` text.
  - at 390×844 the plan's bounding box width ≤ 390 and `document.documentElement.scrollWidth ≤ 390`.
  - JS disabled: every floor plan and the table are visible.
  - axe: no violations on `/projects/sale-block` (reuse the helper from `smoke.spec.ts`).
  - a second fixture copy with `view: scroll` (`sale-tower`, 2 floors, 2 units) shows a `nav` with `aria-label` from `sales.floorsNav`, and scrolling to floor 2 sets `aria-current` on it.
  - `/projects/river-house` (finished) has no `#apartamenti`.
- [ ] **Step 2:** `pnpm test:e2e sales` → FAIL.
- [ ] **Step 3:** Implement components and page wiring (render the sales block only when `project.sales`).
- [ ] **Step 4:** e2e PASS; `pnpm --filter website test`, `typecheck`, `lint` clean; pixel compare of the 14 finished pages vs `main` (same ImageMagick `compare -metric AE` routine as #45) → 0 px.
- [ ] **Step 5:** commit `feat(projects): the sales layout with floors, plans and a list of units (#46)`.

### Task 6: The unit page

**Files:** Create `app/[locale]/projects/[slug]/[unit]/page.tsx`, `components/sales/UnitPage.tsx` (or inline); Modify `app/sitemap.ts`, `lib/jsonld.ts` (breadcrumb only), i18n; e2e in `sales.spec.ts`.

**Consumes:** `getProject().sales`, `enquiryHref`, `unitLabel`, `urlFor`.

`generateStaticParams`: every locale × project with sales × unit `slug`. `dynamicParams = true`; unknown or upper-case code → `notFound()`. Page: breadcrumb (project → unit), h1 unit label + project, the unit drawn alone (its path scaled to fill, walls clipped to its bounding box + 1 m), the floor plan small with the unit in red, facts (type, floor(s), rooms, обща and чиста side by side, застроена small, terrace, orientation words, status glyph+word, note), the one CTA per the status table, prev/next unit on the same floor, back link `/projects/<slug>#etazh-<key>`. Metadata title `<label> · <project>`; description `<label>, <rooms> стаи, <total> m² обща площ, <status> — <project>, <place>.` Sitemap lists every unit URL.

- [ ] **Step 1: Failing e2e:**
  - `/projects/sale-block/12`: h1 contains `Ап. 12`; facts show `86 m²` next to `обща` and the net value next to `чиста`; button `Попитай за Ап. 12` has `href` starting `mailto:` whose decoded subject is `Запитване: <title> · Ап. 12, ет. 1`.
  - reserved unit → button `Попитай дали се освобождава`; upcoming → `Запиши интерес`; sold → no `mailto:` link and a link to `/projects/sale-block#apartamenti`.
  - `/projects/sale-block/a3` is 200, `/projects/sale-block/A3` is 404 (Review Focus 2).
  - `/en/projects/sale-block/12` button text in English, subject prefix `Enquiry:`.
  - maisonette `/projects/sale-block/7` lists both floors.
  - sitemap.xml contains `/projects/sale-block/12`.
  - axe clean.
- [ ] **Step 2–4:** FAIL → implement → PASS (+ unit/typecheck/lint).
- [ ] **Step 5:** commit `feat(projects): one page per unit with an e-mail enquiry (#46)`.

### Task 7: Announcements on the home page

**Files:** Modify `progress.ts` (`UpdateFront`), `check.ts`, `check.test.ts`, `app/[locale]/page.tsx`; Create `content/announcement.ts` (+ test), `components/home/Announcement.tsx`; fixture update in `tests/fixtures/content/projects/sale-block/updates/2026-11-01.bg.md` with `home: true` and a CTA; `tests/e2e/website/announcement.spec.ts`.

**Interfaces — Produces:**
```ts
// UpdateFront += home: boolean default false, cta?: { label: L, href: string }
export type Announcement = { project: { slug: string; title: string }; date: string; lead: string; cta: { label: string; href: string } | null };
export function latestAnnouncement(locale: Locale, root?: string): Announcement | null;   // newest home:true update of a published project
```
`lead` = first paragraph of the update body as plain text, cut at 160 chars on a word. The band sits above the rail: micro-label date · project link, the lead, the CTA as the view's one red button only if the rail has none (otherwise a ghost link). `href` starting `/` goes through the i18n `Link`; `mailto:` is a plain `<a>`.

- [ ] **Step 1: Failing tests:**
  - unit: `latestAnnouncement` picks the newest of two `home: true` updates; ignores a draft project's; returns `null` with none.
  - check: `cta.href: https://example.com` → error "бутонът води само към страница от сайта (/…) или mailto:"; `home: true` on a draft project's update → error; `home`/`cta` in an `.en.md` → error "home и cta се пишат само в .bg файла".
  - e2e (fixtures): the home page shows the band with the lead and a button linking to `/projects/sale-block#apartamenti`.
  - smoke (real content, no `home: true` anywhere): the home page has no `[data-announcement]`.
- [ ] **Step 2–4:** FAIL → implement → PASS; pixel compare home on real content vs `main` → 0 px.
- [ ] **Step 5:** commit `feat(home): an update can show on the home page with a button (#46)`.

### Task 8: The guide, translations and the final pass

**Files:** `CONTENT.md` (section "9. Сграда в продажба" bg full + en short; error lists extended), `packages/i18n/messages/en.json`, `de.json` completeness, Netlify-free screenshots for the PR.

- [ ] **Step 1:** Write the guide: prepare the `TEKOM_UNIT` layer (closed polyline per unit, one text code inside), the command and its output, filling a unit file (every field, example), changing status and `sales.updated`, `view: switch|scroll`, the home switch with a CTA, what never goes in (prices, DXF). Include the fixture plan as an image (`docs/` asset rendered from `sale-block/plans/1.svg`).
- [ ] **Step 2:** `pnpm i18n:check` (or the existing key-parity test) passes for bg/en/de.
- [ ] **Step 3:** Full suite: `pnpm -r test`, `pnpm -r typecheck`, `pnpm lint`, `pnpm content:check`, `pnpm test:e2e`, build; private-name grep on the diff.
- [ ] **Step 4:** commit `docs(content): how to add a building for sale (#46)`.

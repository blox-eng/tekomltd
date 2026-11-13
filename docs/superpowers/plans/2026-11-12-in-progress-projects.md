# Projects in progress — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A project can carry an optional `progress` block and dated update files, so the site shows the stages, the expected completion and the update log of work in progress, and the owner writes all of it in `content/`.

**Architecture:** The zod `Project` schema gains an optional `progress` block. A new `src/content/progress.ts` owns the stage model and reads `updates/*.md` from the project folder. `ProjectCard` gains `inProgress`; `ProjectDetail` gains `progress`. `content:check` validates the block and the updates and gains warnings. A new `Progress` component renders the ladder and the log on the project page.

**Tech Stack:** Next.js 15 (app router, static + daily ISR), next-intl, zod 4, yaml 2, gray-matter (`parseFrontMatter`), vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-12-in-progress-projects-design.md`

## Global Constraints

- A project with no `progress` block renders and sorts exactly as on `main`. No new check touches it.
- No price, cost, contract value, client company name, EIK or personal name in any committed file. Grep the staged diff before each commit.
- DESIGN.md is locked: one red accent, cardless, status = glyph + word (never colour alone), figures in IBM Plex Mono.
- Bulgarian is required in every text; English and German are optional with the existing fallback note.
- Expected completion shows as `Q1 2028`, never a day.
- Stale log threshold: 45 days. It is a warning; the build passes.
- Commits: signed Conventional Commits, `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, never `--no-verify`.
- Work in `~/dev/tekomltd-45`, branch `feat/45-in-progress`. Run commands from `apps/website` unless stated.

## Review Focus

1. A stage `done` date that is today must pass (not "in the future"); tomorrow must fail. Tests pin `today` through `CheckOptions.today`.
2. An update file whose date is invalid (`2026-02-30.bg.md`) or misnamed (`2026-11-20.md`, `20-11-2026.bg.md`) fails with a message that shows the right name.
3. An `en`/`de` update with no `bg` file of the same date fails; photos listed in an `en`/`de` file fail with "photos go in the .bg.md file".
4. A project with `status: in_progress` and a `year` fails ("remove year until status: done"), so it can never reach the timeline or show an age.
5. A `progress` block on a `draft: true` project is still checked (drafts are where the owner starts), but the stale warning skips drafts.

---

### Task 1: Stage model and schema

**Files:**
- Modify: `apps/website/src/content/schema.ts`
- Create: `apps/website/src/content/progress.ts`
- Test: `apps/website/src/content/progress.test.ts`, `apps/website/src/content/schema.test.ts`

**Interfaces:**
- Produces (in `schema.ts`):
  - `PROGRESS_KINDS = ['building', 'house', 'facade'] as const`
  - `STAGE_KEYS = ['design', 'permit', 'excavation', 'zero', 'act14', 'act15', 'act16', 'rough', 'roof', 'finishing', 'use_permit', 'scaffold', 'insulation', 'render', 'scaffold_down', 'handover'] as const`
  - `Stage = z.strictObject({ key: z.enum(STAGE_KEYS).optional(), label: L.optional(), started: isoDate.optional(), done: isoDate.optional() })`, refined: exactly one of `key` / `label` ("give a stage either key or label").
  - `Progress = z.strictObject({ status: z.enum(['in_progress', 'done']), kind: z.enum(PROGRESS_KINDS), expected: z.string().regex(/^\d{4}-Q[1-4]$/).optional(), permit: z.string().trim().min(1).optional(), note: L.optional(), stages: z.array(Stage).min(1).optional() })`
  - `Project` gains `progress: Progress.optional()`.
  - `isoDate`: a string `YYYY-MM-DD` that is a real calendar date (`2026-02-30` fails with "not a real date"). YAML 2 parses these as strings.
- Produces (in `progress.ts`):
  - `DEFAULT_STAGES: Record<Kind, StageKey[]>` — building `design, permit, excavation, zero, act14, act15, act16`; house `design, permit, zero, rough, roof, finishing, use_permit`; facade `scaffold, insulation, render, scaffold_down, handover`.
  - `stagesOf(progress: Progress): Stage[]` — `progress.stages` or the default list as undated stages.
  - `stageState(stage: Stage): 'done' | 'active' | 'next'` — `done` if `done` is set, `active` if only `started`, else `next`.
  - `parseQuarter(expected: string): { year: number; quarter: 1 | 2 | 3 | 4 }`

- [ ] **Step 1: Write failing tests** — `progress.test.ts`: `stageState({ key: 'act14', started: '2026-01-02', done: '2026-03-01' }) === 'done'`; `stageState({ key: 'act14', started: '2026-01-02' }) === 'active'`; `stageState({ key: 'act14' }) === 'next'`; `stagesOf({ status: 'in_progress', kind: 'facade' }).map(s => s.key)` equals the facade list; `parseQuarter('2028-Q1')` equals `{ year: 2028, quarter: 1 }`. `schema.test.ts`: a stage with both `key` and `label` fails; `expected: 2028-Q5` fails; `started: 2026-02-30` fails; a project without `progress` parses unchanged.
- [ ] **Step 2: Run** `pnpm vitest run src/content/progress.test.ts src/content/schema.test.ts` — expect FAIL (missing exports).
- [ ] **Step 3: Implement** the schema additions and `progress.ts`.
- [ ] **Step 4: Run** the same command — expect PASS.
- [ ] **Step 5: Commit** `feat(content): stage model and progress block for projects in progress (#45)`.

### Task 2: Load progress and updates

**Files:**
- Modify: `apps/website/src/content/progress.ts`, `apps/website/src/content/cards.ts`, `apps/website/src/content/projects.ts`, `apps/website/src/content/paths.ts`
- Create: fixture projects under `apps/website/src/content/__fixtures__/loader/projects/` (copy an existing fixture image)
- Test: `apps/website/src/content/load.test.ts`

**Interfaces:**
- Consumes: Task 1 exports.
- Produces:
  - `paths.ts`: `UPDATES_DIR = 'updates'`; `parseUpdateFile(name: string): { date: string; locale: Locale } | null` for `YYYY-MM-DD.<bg|en|de>.md`.
  - `progress.ts`:
    - `type StageView = { key: StageKey | null; label: string | null; labelFallback: boolean; started: string | null; done: string | null; state: 'done' | 'active' | 'next' }` (the component turns `key` into words).
    - `type UpdateView = { date: string; body: string; fallback: boolean; photos: Img[] }`, where `body` is Markdown and `photos` come from the bg file's front matter `photos: [{ file, alt? }]`, relative to the update file.
    - `type ProgressView = { status: 'in_progress' | 'done'; kind: Kind; expected: { year: number; quarter: 1|2|3|4 } | null; permit: string | null; note: string | null; noteFallback: boolean; stages: StageView[]; updates: UpdateView[]; lastUpdate: string | null }`, with updates newest first.
    - `loadProgress(project: Project, projectFile: string, root: string, locale: Locale): ProgressView | null`
  - `cards.ts`: `ProjectCard.inProgress: boolean` (true only for `progress.status === 'in_progress'`).
  - `projects.ts`: `ProjectDetail.progress: ProgressView | null`. `listProjects` returns in-progress cards first, keeping each group's existing order. `listRailProjects`, `listProjectsMatching`, `getProject` positions and `next` stay in today's order.

- [ ] **Step 1: Write failing tests** in `load.test.ts` against the loader fixture, after adding:
  - `rising-block`: building, in progress, `expected: 2028-Q1`, a custom-label stage, one `active` stage, and two updates (`2026-10-01.bg.md` with one photo, `2026-11-01.bg.md` plus `2026-11-01.en.md`).
  - `hill-house`: house, in progress, no `stages`, no updates.
  Assertions:
  - `listProjects('bg', root)` puts the slugs of `rising-block` and `hill-house` first and then the existing slugs in their current order.
  - `listRailProjects` order is unchanged apart from the new slugs at their `sort` place.
  - `getProject('rising-block','en',root)!.progress!.updates.map(u => u.date)` equals `['2026-11-01','2026-10-01']`, and the first update has `fallback === false`.
  - The second update has `fallback === true` and one photo.
  - `lastUpdate === '2026-11-01'`.
  - `hill-house` has seven `next` stages.
  - Every existing project has `progress === null` and `inProgress === false`.
- [ ] **Step 2: Run** `pnpm vitest run src/content/load.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** as in Interfaces. An update in a locale without its own file uses the bg body with `fallback: true`.
- [ ] **Step 4: Run** the same command, then `pnpm vitest run`. Expect PASS everywhere.
- [ ] **Step 5: Commit** `feat(content): load progress and dated updates of a project (#45)`.

### Task 3: Check the block and the updates, with warnings

**Files:**
- Modify: `apps/website/src/content/check.ts`
- Test: `apps/website/src/content/check.test.ts`

**Interfaces:**
- Produces:
  - `CheckOptions.today?: string` (default: today, local date).
  - `CheckResult = { ok: true; warnings: ContentError[] } | { ok: false; errors: ContentError[]; warnings: ContentError[] }`.
  - `main` prints each warning as `warning: <file>: <path> <message>` and still returns 0 when only warnings exist.
- Rules, with the exact message text (`<P>` = `projects/<slug>/project.yaml`, `<U>` = `projects/<slug>/updates/<name>`):

| Condition | Where | Message |
|---|---|---|
| stage date after today | `<P>` `progress.stages.N.started\|done` | `date <d> is in the future; write the day it happened` |
| `done` before `started` | `<P>` `progress.stages.N.done` | `done <d> is before started <s>` |
| `status: in_progress` with `year` | `<P>` `year` | `remove year until progress.status is done` |
| `status: done` without `year` | `<P>` `year` | `a finished project needs year` |
| `status: done`, a stage without `done` | `<P>` `progress.stages.N.done` | `a finished project needs a done date on every stage` |
| update name not `YYYY-MM-DD.<bg\|en\|de>.md` | `<U>` | `name must be YYYY-MM-DD.bg.md, for example 2026-11-20.bg.md` |
| update date not real or in the future | `<U>` | `<date> is not a real past or present date` |
| en/de update without bg of the same date | `<U>` | `add <date>.bg.md first; the Bulgarian text is required` |
| `photos` in an en/de update | `<U>` `photos` | `photos go in the .bg.md file` |
| update photo missing | `<U>` `photos.N.file` | `file not found: <ref>` (existing `requireFile`) |
| `updates/` exists without `progress` | `<U>` | `updates need a progress block in project.yaml` |
| WARNING: in progress, not draft, newest update older than 45 days | `<P>` `progress` | `newest update is <n> days old; add one in updates/` |

- [ ] **Step 1: Write failing tests**: one `it` per row, built with the existing `tree(edit)` helper and `today: '2026-11-12'`. Add two boundary cases. A `done` of `2026-11-12` passes and `2026-11-13` fails. A newest update of `2026-09-28` (45 days) gives no warning, and `2026-09-27` (46 days) warns. Also check that the valid fixture still returns `{ ok: true, warnings: [] }`.
- [ ] **Step 2: Run** `pnpm vitest run src/content/check.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** inside `checkProjects()`. Drafts are checked too, but the warning skips drafts.
- [ ] **Step 4: Run** `pnpm vitest run`, then `pnpm content:check` (real content, unchanged so far). Expect PASS and "all content files are valid".
- [ ] **Step 5: Commit** `feat(content): check progress blocks and update files (#45)`.

### Task 4: Show it on the site

**Files:**
- Create: `apps/website/src/components/projects/Progress.tsx`
- Modify: `apps/website/src/app/[locale]/projects/[slug]/page.tsx`, the map component in `apps/website/src/components/map/` that labels pins, `apps/website/src/components/projects/ProjectTile.tsx`, `apps/website/src/components/rail/ProjectSlide.tsx`, `apps/website/src/components/services/ServicePage.tsx`, `apps/website/src/components/projects/projects.module.css`, `packages/i18n/messages/{bg,en,de}.json`
- Test: `tests/e2e/website/progress.spec.ts`, and add the fixtures named below to `tests/fixtures/content/projects/`

**Interfaces:**
- Consumes: `ProjectCard.inProgress`, `ProjectDetail.progress` (Task 2).
- Produces: `Progress({ progress, labels })`, a server component for the project page. It renders:
  - a section with `data-progress`;
  - the "в строеж" label (glyph and word) or nothing when the status is `done`;
  - the stage ladder as an `<ol>`, where each item has its words and its date (`mono`), marks `active` stages "в ход" and marks done stages with a glyph;
  - `Очаквано завършване · Q1 2028`;
  - the permit line;
  - the note;
  - "последна актуализация: 01.11.2026", or "първата актуализация предстои";
  - the updates newest first, each with a `<time>`, its Markdown (render it the way `content/pages` bodies are rendered today) and its photos.
- i18n under `project` (bg text fixed; en/de by the builder): `inProgress` "в строеж", `stagesTitle` "Етапи", `stageActive` "в ход", `expected` "Очаквано завършване", `permit` "Разрешение за строеж", `lastUpdate` "последна актуализация: {date}", `noUpdates` "първата актуализация предстои", `updatesTitle` "Дневник на строежа", `ctaBuilding` "Интересувате се от апартамент? Пишете ни", plus `stage.<key>` for all 16 keys. The bg values come from the spec's default lists ("кота ±0.00", "Акт 14 (груб строеж)", "удостоверение за въвеждане в експлоатация", "демонтаж на скелето", …).
- Map: a pin of an in-progress project shows "в строеж" next to its name in the pin's label or list entry (`src/components/map/`).
- Tile, slide and service table: when `inProgress`, the place line reads `<place> · в строеж` with the glyph, and the service year cell reads `в строеж`. The project page CTA uses `ctaBuilding` when `progress.kind === 'building' && status === 'in_progress'`.

- [ ] **Step 1: Add e2e fixtures and write failing tests**. Fixtures: `tower-rising` (building, in progress, expected `2028-Q1`, permit, one custom stage, one active stage, two updates, one with a photo) and `old-mill-facade` (facade, `status: done`, `year: 2025`, all stages done, one update). `progress.spec.ts`:
  - `/projects` shows `tower-rising` first, with "в строеж" in its tile.
  - `/projects/tower-rising` shows the stage list in order, one "в ход", "Q1 2028", the permit, "последна актуализация: …", two updates newest first, and no age line.
  - `/projects/old-mill-facade` shows the age, no "в строеж", and its update.
  - `/projects/river-house` has no `[data-progress]`.
  - At 390 px, `/projects/tower-rising` has no horizontal scroll.
  - Tab reaches each update photo link.
  Also update the counts in `pages.spec.ts`: the timeline gains `old-mill-facade`, and the tile counts gain both fixtures.
- [ ] **Step 2: Run** `pnpm --filter @tekom/tests test:e2e -- progress.spec.ts --project=chromium`. Expect FAIL.
- [ ] **Step 3: Implement** the component, the page wiring, the labels, the CSS (hairlines, mono dates, red only on the active marker per DESIGN.md rule 2) and the i18n keys.
- [ ] **Step 4: Run** the full e2e suite with `--project=chromium`. Expect PASS. Check `/projects/tower-rising` by eye at 390 px and 1280 px.
- [ ] **Step 5: Commit** `feat(projects): stage ladder, update log and in-progress label (#45)`.

### Task 5: The writing framework

**Files:**
- Create: `apps/website/scripts/new-update.ts`
- Modify: `apps/website/package.json` (script `new-update`), the root `package.json` if root scripts proxy to the app, `CONTENT.md`
- Test: `apps/website/scripts/new-update.test.ts`

**Interfaces:**
- `newUpdate(root: string, slug: string, today: string): string` returns the created path. It throws `no project <slug> in content/projects` or `<path> already exists`. It writes `projects/<slug>/updates/<today>.bg.md` with:

```markdown
---
# Снимки: качете ги в тази папка и ги запишете тук, например:
# photos:
#   - file: 2026-11-20-1.jpg
photos: []
---
**Направено:** 

**Следва:** 
```

- [ ] **Step 1: Write failing tests**. The function creates the file with the template. It refuses a missing project and an existing file. The created tree passes `checkContent`.
- [ ] **Step 2: Run** `pnpm vitest run scripts/new-update.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** the script, with a CLI wrapper `pnpm new-update <slug>`.
- [ ] **Step 4: Write CONTENT.md**. Add a section "Проект в строеж" to the Bulgarian part and a short matching section to the English part. It covers:
  - start a project, with one copy block per kind holding the full default stage list;
  - add an update, both in the web editor and with `pnpm new-update`;
  - mark a stage under way and done;
  - set `expected`, `permit` and `note`;
  - finish a project: `status: done` and `year`;
  - what to keep out (prices, client names, the exact plot of a private house).
  Add every Task 3 message to the list of common errors.
- [ ] **Step 5: Run** `pnpm vitest run && pnpm lint`. Expect PASS.
- [ ] **Step 6: Commit** `feat(content): new-update command and CONTENT.md guide for projects in progress (#45)`.

### Task 6: The four real projects as draft skeletons

**Files:**
- Create: `content/projects/stoletov-46/project.yaml`, `content/projects/starozagorski-bani-house/project.yaml`, `content/projects/facade-stara-zagora/project.yaml`, `content/projects/zheleznik-facade/project.yaml`

Each file has `draft: true`, `title` and `place` in bg, `scopes`, `residential` where it fits, and a `progress` block with the right `kind` and `status: in_progress`. None of them has an address, coordinates, dates, updates, `year` or images.
- Столетов 46: `building`. Its stages are the default list with a custom stage "Археологически проучвания" after `permit`. Scope `full`, `residential: true`.
- The house: `house`, scope `full`, `residential: true`, place "Старозагорски бани".
- The two facade jobs: `facade`, scope `facade`. The titles say "Фасада на жилищна сграда". The places are "Стара Загора" and "Железник, Стара Загора". No developer and no architect.

- [ ] **Step 1: Write the four files.**
- [ ] **Step 2: Run** `pnpm content:check`. Expect "all content files are valid" and no warning, because these are drafts with no updates.
- [ ] **Step 3: Run** `git diff --cached | rg -i "€|лв|bgn|eur|цена|ЕИК|EIK|ООД|ЕООД|\+359|арх\."`. Expect no output.
- [ ] **Step 4: Commit** `feat(content): draft skeletons of the four projects in progress (#45)`.

### Task 7: Verify the whole branch

- [ ] **Step 1: Run** from the repo root `pnpm -r typecheck && pnpm -r test && pnpm -r lint`. Expect all to pass.
- [ ] **Step 2: Run** `pnpm --filter @tekom/tests test:e2e --project=chromium`. Expect all to pass. The rail swipe tests fail locally on `main` too; if they fail, note it, because they pass in CI.
- [ ] **Step 3: Compare the finished pages with `main`.** Build `main` and the branch against `tests/fixtures/content`. Take Playwright full-page screenshots of `/projects/river-house`, `/projects/stone-chapel`, `/projects/town-flat` and `/en/projects/river-house` at 1280 and 390 px. Compare them with `compare -metric AE`. Expect 0 differing pixels on the project pages. On `/projects`, only the new tiles and the timeline tick may differ. This is a one-off script in the scratchpad; do not commit it.
- [ ] **Step 4: Open the PR** with `Closes #45`, the screenshots of `tower-rising` at 390 and 1280 px, and the results of the comparison.

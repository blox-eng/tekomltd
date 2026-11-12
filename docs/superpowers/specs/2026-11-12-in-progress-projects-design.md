# Projects in progress — design

Issue: #45. Follow-ups that build on this: #46 (floor and flat explorer), #47 (enquiry per flat), #48 (featured projects).

## Intent

Today the site shows only finished work. Tekom builds four things now, and a visitor cannot see any of them. A buyer of an off-plan flat pays before the building exists, so the buyer must see that the building is real and that it moves. A visitor who wants a builder must see that Tekom works now, not only in the past.

The site shows each project in progress with its stages, its expected completion and a log of dated updates. The owner writes the updates in this repository. When the work finishes, the owner sets the project to done, and the page becomes a finished project that keeps its log as the story of how it was built.

## The four real projects (the test cases)

| Project | Kind | Our role | Stage today | What the public sees |
|---|---|---|---|---|
| ЖС Столетов 46, Стара Загора | `building` | Builder and sole investor. Flats for sale (later: #46, #47). | Design and documents. Old houses demolished. Archaeology on the plot (the city stands on Augusta Traiana). No building drawings yet. Planned completion Q1 2028. | Stages, updates, plot and dig photos. The archaeology is the story. |
| Къща, Старозагорски бани | `house` | Builder. Shown as a client project. | Design, permits, site preparation. Category 5: ends with an удостоверение за въвеждане в експлоатация, not Акт 16. | Stages and updates. No floor plans. |
| Facade job A, Стара Загора | `facade` | ETICS on another company's building. | Scaffold up, insulation in progress. Handover planned December 2026. | Our stages only: scaffold → insulation → finish → handover. |
| Facade job B, Железник, Стара Загора | `facade` | ETICS on another company's building, facade by facade. | North, east and south facades in progress. Handover planned December 2026. | Same as above. |

The owner writes this content. The source data in the company's project system has costs, a client company name and EIK, and personal names. None of it is copied. Nothing is synced from base.

## Goals

- A visitor sees which projects are in progress, on /projects, on the home rail and on the map, with a label "в строеж" (glyph and word, DESIGN.md rule 4).
- The project page shows the stages of that project, each with a date when done, and the current stage marked.
- The page shows the expected completion as a quarter ("Q1 2028"). It never shows a day.
- The page shows the updates, newest first, with "последна актуализация: <date>" at the top. An update has a date, a short Markdown text and zero or more photos. The owner writes weekly or monthly, as fits the work.
- One field sets the current stage. Every place on the site reads it from there.
- A finished project with no in-progress block looks and behaves as on `main` before the change.
- When the owner sets the project to done and adds `year`, the page shows the age (#41), the stages all done and the update log as history.

## Non-goals

- No flats, floors, plans or enquiry per flat (#46, #47).
- No featured flag and no reordering of the home page beyond the label (#48).
- No sync, import or link to Blox base.
- No CMS, no admin screen. Changes go through a pull request, as today (CONTENT.md).
- No combined "what we build now" feed across projects (option C, a later step).
- No prices, payment plans, contract values or client names.

## Anti-goals

- A finished project page changes in look, order, address or SEO output.
- The site shows a stage as done before it is done, or two places disagree on the stage.
- A price, a cost, a client company name, an EIK or a person's name reaches the repository.
- A private home's floor plan, or an architect's drawing without the architect's written consent, reaches the repository.
- A building in progress shows "N years standing" or appears on the /projects timeline as built.
- The update log looks dead: a visitor sees a last update months old and no explanation.

## Constraints

- Content lives in `content/projects/<slug>/` and is checked by `content:check` (zod schema in `apps/website/src/content/schema.ts`). Bulgarian is required; English and German are optional with the existing fallback note.
- DESIGN.md is locked: plaster and ink, one red accent, cardless, status never by colour alone, mono for figures.
- A project needs at least one image today. A building in progress may only have site photos. That is fine.
- The repository is public. `git` keeps history, so a leak cannot be undone by a later commit.
- Pages are static with a daily rebuild (`revalidate = 86400`).

## Approaches

- **A. An optional in-progress block on the existing project, updates as files in the project folder.** Chosen by the owner, 2026-11-12. One form per project: tiles, map, timeline, service pages and SEO already work. A finished project simply has no block.
- B. A separate content type `content/developments/`. Rejected: it repeats place, photos and map, and a finished building would have to move folders and get a redirect.
- C. A plus one combined update feed for all projects. Deferred: cheap once A exists.

## Decided

- 2026-11-12, owner: content is managed from code; what is on the site is what is in the repo.
- 2026-11-12, owner: no prices or private data, because the repository is public.
- 2026-11-12, owner: start with #45; approach A.
- 2026-11-12, owner: the owner writes the updates by hand in the repo, weekly or monthly. No generator.
- 2026-11-12, owner: the public location is what the owner sets, never taken from the real plot by default. A region only is fine. The existing `place`, `address`, `lat`/`lng` and `show_on_map` fields do this: `address` and coordinates are optional, and the owner may set an approximate point or none.
- 2026-11-12, owner: dig photos from Столетов may be published.
- 2026-11-12, owner: the owner writes every update and all real content. The feature must give the owner a good framework to write in.
- 2026-11-12, owner: the two facade jobs (A and B) are facade work only; the house is treated as a client project; Столетов is Tekom's own investment.

## The writing framework

The owner writes the content, so writing it is a first-class part of the feature, not an afterthought.

- `CONTENT.md` gets a section "Проект в строеж" (Bulgarian first, as the file is today): how to start one, a copy-paste block per kind, how to add an update, how to mark a stage done, how to finish the project. Each step is one action.
- One command makes a new update file with today's date and an empty template: `pnpm new-update <slug>`. The owner can also copy the template by hand in the GitHub web editor.
- Every `content:check` message for this feature names the file, the field and the fix, in the same form as the existing messages (`projects/x/project.yaml: in_progress.stages.3.done ...`). Each new message goes into the CONTENT.md list of common errors.
- The deploy preview shows the result before the merge, as for every content change today.

## Calls I made (proposed, not confirmed)

- **Stages per kind.** `kind` is `building`, `house` or `facade`. Each kind has a default stage list the project can use as is. A project can also list its own stages, so a special step (for example "археологически разкопки" on Столетов) fits. Default lists:
  - `building`: проект → разрешение за строеж → изкоп → кота ±0.00 → Акт 14 (груб строеж) → Акт 15 → Акт 16 (въвеждане в експлоатация)
  - `house`: проект → разрешение за строеж → кота ±0.00 → груб строеж → покрив → довършителни работи → удостоверение за въвеждане в експлоатация
  - `facade`: скеле → топлоизолация → финишно покритие → демонтаж на скелето → предаване
- **A stage has two optional dates: `started` and `done`.** A stage with `done` is done. A stage with `started` and no `done` is "в ход" (under way). Several stages can be under way at once: on Столетов design runs beside the archaeology, and on the house design, permits and site preparation run together. No separate "current" field, so nothing can disagree. Facade job B keeps one ladder; the updates say which facade is where.
- **Done is explicit.** The block has `status: in_progress` or `status: done`. A project with no block is a finished project exactly as today, and no new check touches it (the fixture `town-flat` has no year and stays valid). `status: done` needs `year`, and every stage needs a `done` date.
- **Updates live in the project folder, apart from the block.** They stay when the project is done.
- **No "years standing" before done.** An in-progress project has no `year`. The tile and the page show the label and the completion quarter instead of the age. The timeline already skips projects with no year.
- **Order.** In-progress projects come first on /projects, before `sort`. The home rail keeps its order and its panels; it only gains the label. #48 decides what the home page puts first.
- **Service pages.** An in-progress project appears there with "в строеж" in the year column, never a blank.
- **Note for the visitor.** An optional short `note` in the block, which the owner writes when work pauses or a date moves ("сроковете се преразглеждат"). The page shows it next to the last-update date.
- **Expected completion is optional.** The page leaves the line out when it is missing.
- **Starting content.** The plan adds the four real projects as `draft: true` skeletons: kind, stages from the default lists, no dates I cannot prove, no updates and no address. The owner fills them in and removes `draft`.
- **Facade jobs name the building by type and place only**: "Фасада на жилищна сграда, м-ст Железник". No developer name and no architect name unless the owner adds them with consent.
- **Stale log.** If the newest update is older than 45 days, `content:check` prints a warning that names the project. The build does not fail. The page always shows the date of the last update, so the visitor sees the truth.
- **Permit number.** Optional field, shown when present. It is public in the municipal register.
- **No update yet.** A project in progress with no updates shows its stages and "първата актуализация предстои". This is the state of Столетов today.
- **CTA.** Building: "Интересувате се от апартамент? Пишете ни" to /contact (the per-flat CTA is #47). House and facade: the existing project CTA.

## Left to the builder

- The exact schema field names and shapes, and the update file format (Markdown with front matter matches `content/pages`).
- How updates and their photos are stored inside the project folder.
- The look of the stage ladder and the update log inside DESIGN.md, at 390 px and at desktop width.
- Translation keys and English and German text.
- JSON-LD for in-progress projects, if any.
- Test fixtures: add in-progress fixtures to `tests/fixtures/content/` (one per kind) and keep the finished fixtures unchanged.

## Done when

- The fixture for each kind renders: label on the tile, stage ladder with done dates and the current stage, completion quarter, updates newest first with the last-update date.
- Every finished project page and tile is the same as on `main` (screenshot comparison of the existing fixtures).
- An in-progress project shows no age and is not on the timeline. After the owner sets it to done with a year, it shows the age and is on the timeline, and its updates stay.
- `content:check` fails on a stage date in the future, on `done` before `started`, and on `status: done` without a year or with a stage that has no `done` date. It warns on a log older than 45 days.
- The page works with the keyboard and a screen reader at 390 px.
- Following only CONTENT.md, the owner starts a project in progress, adds an update with two photos and marks a stage done, in the GitHub web editor, and the deploy preview shows it.
- Each new `content:check` error names the file, the field and the fix.
- The four draft skeletons are in `content/projects/` with no price, cost, client name, EIK or personal name. A grep of the diff for these finds nothing.

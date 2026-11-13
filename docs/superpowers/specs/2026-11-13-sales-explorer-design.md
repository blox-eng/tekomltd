# A buyer picks a flat from the floor plan and asks about it by e-mail

Issue #46. Absorbs #47 (the enquiry becomes a `mailto:` link). Touches #48 only through the home-page switch on updates.

## Intent

Tekom will sell flats in its own buildings. The site must support a building for sale before one exists. This work builds the toolkit, not a page for a real building: no real project gets units in this change. Столетов 46 stays as it is today.

The toolkit has three parts:

1. **Blueprints.** The owner converts the architect's DXF with one command. The site shows the floors and the flats as drawings that work on a 390 px phone and on desktop.
2. **Sales layout.** A project with units gets a deeper page: totals, a building elevation with clickable floors, a floor plan with clickable flats, a list of flats, and one page per flat. The CTA on a flat page is a `mailto:` link with a ready subject and body.
3. **Announcements.** An update can show on the home page, with an optional button. One front-matter switch shows or hides it.

The owner shows the result on a made-up example building in the test fixtures and in the guide. The real site shows no example.

## The buyer's path

- `/projects/<slug>`: a project with units shows the sales layout. A project without units looks the same as on `main`, pixel for pixel.
- Sales layout, top to bottom: hero (cover or PendingVisual), progress block (#45), **totals** ("24 апартамента · 6 свободни · 4 резервирани · 14 продадени · свободни от 48 до 112 m²", counted from the units), "наличност към DD.MM.YYYY", the **elevation** (stacked floors; each floor shows "Етаж 4 · 2 свободни"), the **floor plan** of the chosen floor, the **list of flats** (filter by floor, rooms, "само свободни"), then the update log.
- **Two floor views, chosen per project** in `sales.view` (owner, 2026-11-13):
  - `switch` (default, a small building): a tap on a floor shows its plan in place. The URL gets `#etazh-4`, so a link opens that floor.
  - `scroll` (a big building): every floor plan is a section, one under another, with scroll snap. A sticky floor column on the left, the same pattern as the year column on /projects (#51), marks the floor in view and jumps to a floor on tap. On a phone it is a sideways row. `#etazh-4` scrolls to that floor.
- A tap on a flat opens `/projects/<slug>/<code>`.
- **Flat page** `/projects/<slug>/<code>`: the flat's plan drawn alone and large, with its floor plan small beside it to show where it sits. Facts: code, floor, rooms, net and gross area, terrace, orientation, status. One primary button: "Попитай за ап. 12" → `mailto:`. Links to the previous and next flat on the same floor, and back to the floor.
- Status words and glyphs: свободен, резервиран, продаден, предстои. Glyph + word, never hue alone (DESIGN.md §0.4). Red is only the active floor/flat and the one CTA. Sold flats stay on the plan in a muted fill.
- Without JavaScript: the elevation is a list of floor links, every floor plan renders one under another, and the list of flats is a plain table. Every flat still has its own page.
- Keyboard and screen reader: each floor and each flat is a link with a text label ("Ап. 12, етаж 4, 3 стаи, 86 m², свободен").

## The enquiry

`mailto:<email>?subject=…&body=…`, built per locale. Email: `sales.email` on the project, else `email` from `content/settings.yaml`.

- Subject: `Запитване: <project title> · <unit label>, ет. <floor>` (e.g. `Ап. 12, ет. 4`, `Гараж 3, ет. -1`)
- Body: two lines: the page URL, then "Здравейте, интересувам се от този апартамент." in the page locale. Then a blank line for the buyer.

A sold flat shows no button; it says "Продаден" and links to the free flats of the building.

## Blueprints: how the owner adds them

`pnpm blueprint <slug> <floor> <file.dxf> [--walls "<layer>"]`

- **The rule for the drawing.** Before the run, someone opens the DXF and adds one layer, `TEKOM_UNIT`. On it, each flat is one closed polyline, with one text inside it that holds the flat code (`12`, `A3`). Everything else on that layer is an error.
- Walls come from the layer named by `--walls` (default: every layer except `TEKOM_UNIT`, dimension and text layers). The script keeps only lines, polylines and arcs from it. Text, dimensions, hatches, blocks with attributes and every other layer are dropped.
- The script reads cp1251 and UTF-8 DXF files and strips MTEXT format codes.
- **Length unit.** The script reads `$INSUNITS`. When it is unset, it guesses mm, cm or m from the size of the drawing (a floor is 8–120 m across) and prints the guess: "Мерна единица: mm (предположение). Ако е грешно, добави --units cm". `--units mm|cm|m` overrides both.
- Output, committed: `content/projects/<slug>/plans/<floor>.svg` (walls as one path, each flat as a `<path data-unit="12">`, normalised to a viewBox, y flipped, coordinates rounded to 1 cm), and one `units/<code>.yaml` per new flat with `floors` and `area.built` **measured from the outline** filled in, the rest empty for the owner. Existing unit files are never overwritten; the script prints the `built` area it measured next to the one in the file when they differ by more than 2%.
- The DXF itself is never committed. `content:check` fails on any `.dxf`, `.dwg` under `content/`.
- The script prints what it found: "Етаж 4: 6 апартамента (12, 13, 14, 15, 16, 17), стени: 1 842 линии" and every error with its fix ("Апартамент без код на (12.4, 3.1) m: добави текст в контура на слой TEKOM_UNIT").

## Content model

```
content/projects/<slug>/
  project.yaml        # + sales: { email?, floors: [{ key: "4", label?: L }], updated: YYYY-MM-DD }
  plans/<floor>.svg   # generated
  units/<code>.yaml   # code, type, floors[], rooms?, area: { total, built, net }, terrace?, orientation[], status, note?: L
```

- `type`: `flat | garage | parking | storage | shop` (owner, 2026-11-13). Only `flat` has `rooms`. The label follows the type: "Ап. 12", "Гараж 3", "Паркомясто 7", "Склад 2", "Магазин 1". `floors` holds one floor, or two for a maisonette; a maisonette is drawn on both plans and has one page.
- **Areas** (owner, 2026-11-13: "both"): every unit has `total` (обща, with the share of common parts) and `net` (чиста), typed by the owner, and `built` (застроена), measured by the script from the outline. The flat page shows обща and чиста side by side, with застроена smaller under them. The totals range quotes обща ("свободни от 62 до 131 m² обща площ"). `content:check` fails when `net > built` or `built > total`.
- `status`: `free | reserved | sold | upcoming`.
- Floor keys are ASCII slugs (`-1`, `0`, `4`, `penthouse`); the display name is `label`.
- **What each status shows.** free: the button "Попитай за ап. 12". reserved: the button "Попитай дали се освобождава". upcoming: the button "Запиши интерес"; the flat is on the plan and has a page; it counts in "N апартамента" and in its own count. sold: no button; "Продаден" and a link to the free flats.
- `orientation`: subset of `N NE E SE S SW W NW`, shown as words ("юг, запад").
- **No price field exists.** The schema is strict, so `price:` in a unit file fails `content:check`.
- `content:check` also fails when: a unit's floor has no plan; a plan holds a `data-unit` with no unit file or the reverse; `net > gross`; `sales` is set and there are no units; `sales.updated` is older than 45 days on any project with `sales` (warning, like the stale log); two unit codes are equal once lowercased.

## Announcements

Update front matter (`.bg.md`, as today) gets:

```yaml
home: true            # show on the home page
cta:                  # optional
  label: { bg: Свободни апартаменти, en: Available flats, de: Freie Wohnungen }
  href: /projects/<slug>#apartamenti   # internal path or mailto:
```

The home page shows the newest `home: true` update of a published project, at most one, as a slim band above the rail: date, project title, the update's first line, the button. With no `home: true` update, the home page matches `main`. `content:check` fails when `cta.href` is not an internal path or `mailto:`, and when `home: true` is on an update of a draft project.

## Guide

CONTENT.md gets "9. Сграда в продажба" (bg, full; en short): how to prepare the DXF layer, the command, filling units, changing status, the home switch. With the example building drawn as a picture.

## Non-goals

- No prices anywhere, no price filter, no "цена при запитване".
- No WebGL/3D model. The elevation is drawn from the floor list.
- No form, no backend, no booking.
- No per-project colours or fonts. The sales layout uses DESIGN.md tokens.
- No units on any real project in this change.

## Anti-goals

- The site shows a sold flat as free.
- Full architect drawings (dimensions, structure, installations, names) reach the repo.
- A plan is unreadable or needs a pinch-zoom at 390 px.
- A finished project page changes.

## Approaches (decided 2026-11-13 by the owner)

- DXF → SVG on the owner's machine by a repo script, only the cleaned SVG committed. Rejected: committing DXF and converting at build (drawings public for good); hand-traced outlines (slow, error-prone).
- Announcements reuse update files with a `home` switch. Rejected: a separate announcements folder (two forms of one thing).
- Enquiry is `mailto:` (owner, 2026-11-13). No form.

## Calls (mine, proposed)

- The totals line names every status that has at least one flat: "24 апартамента · 6 свободни · 2 предстоят · 4 резервирани · 12 продадени".
- Floors switch in place with a `#etazh-N` hash, not a route per floor: one less level of pages, and a link still opens the right floor.
- Flat URL is `/projects/<slug>/<code>`; codes are lowercase ASCII in the URL (`a3`).
- At most one announcement on the home page: more turns the band into a feed.
- The example building lives in `tests/fixtures/content` only.
- DXF parsing: a small dev-only parser or `dxf-parser` as a devDependency; nothing new ships to the browser.

## Left to the builder

The SVG styling, the elevation drawing, the list's filter UI, component split, the DXF library choice, the exact `content:check` wording (bg, with the fix).

## Done when

- The example building (3 floors, 8 flats) on the fixtures: the elevation shows free counts per floor; a tap on a floor shows its plan; a tap on a flat opens its page; at 390 px and 1280 px.
- Changing one unit's status in YAML changes the totals, the floor count and the flat page.
- The flat page's button opens a mail with the subject `Запитване: … · Ап. 12, ет. 4`.
- Keyboard only: Tab reaches each floor and flat; Enter opens it. axe passes.
- `pnpm blueprint` on a test DXF writes the SVG and unit stubs, and refuses a flat with no code.
- `price:` in a unit file fails `content:check`; so does a `.dxf` in `content/`.
- An update with `home: true` shows on the home page with its button; without one, the home page and every finished project page match `main`.

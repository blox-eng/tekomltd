# Tekom Design System

**Read this before any visual or UI decision, in either app.** Every colour, type, space, radius and motion value lives here and as a token in `packages/ui/src/styles/tokens.css`. Do not deviate without agreeing it first. In review, flag anything that breaks these rules.

**Positioning: a boutique, family-owned builder from Stara Zagora that does it right the first time.** The buildings are the colour. The interface is plaster and ink, with one red accent taken from the old Tekom wordmark. When a choice is ambiguous, pick the quieter option.

The rules are adapted from the vamy.art canon (`blox-eng/vamyart` → `DESIGN.md`), which adapts the Blox canon (`blox-eng/blox` → `blox-web/packages/ui/DESIGN.md`). From vamy we keep the six rules, the gallery rail and the cardless layout. From Blox we keep IBM Plex Mono for figures and the "word that turns". From Tekom we take the red.

The locked reference is the clickable mockup in `design/mockup/index.html` (open it in a browser). If this file and the mockup disagree, this file wins.

---

## 0. The six rules

1. **The work is the only colour.** Photos of Tekom's buildings carry the colour. The UI is near-monochrome plaster and ink.
2. **Tekom red is the only accent, and it is rare.** Use it for: the one primary action per view, the active state, focus, the first scope tag on a photo, the turning word, the "photo pending" stamp, map pins, and a hover tint on line icons. Nowhere else.
3. **Cardless, with two exceptions.** No boxed widgets, shadows or rounded groups. Structure comes from whitespace, hairlines, micro-labels and alignment. The exceptions are the panels in the project rail and the partner-service cards, which are flat fills with radius 0 and no shadow.
4. **Status is never hue alone.** Pair it with a glyph and a label. Because red is the brand, red never means "error" by itself: errors use `--neg` text plus a glyph and words.
5. **Warm, never pure.** No `#000`, no `#FFF` for surfaces (white is allowed only as text on red or on photos). Every neutral shares the ink undertone `#1F1A17`.
6. **One motion system.** One curve, calm, no bounce. Reduced motion gets instant changes.

---

## 1. Colour

| Token         | Light     | Dark      | Use                                                       |
| ------------- | --------- | --------- | --------------------------------------------------------- |
| `--bg`        | `#F3F1ED` | `#161210` | page (plaster)                                            |
| `--field`     | `#FBFAF7` | `#1F1A17` | inputs, map panels, raised areas                          |
| `--wall`      | `#E8E4DE` | `#1B1714` | photo placeholders, partner cards                         |
| `--text`      | `#1F1A17` | `#EEE8E2` | body and headings                                         |
| `--muted`     | `#5E5751` | `#ADA49D` | secondary text (6.3:1 / 7.6:1)                            |
| `--faint`     | `#8A827B` | `#7F7670` | icons and drawing lines only (fails AA for text)          |
| `--line`      | ink 12%   | paper 12% | hairlines                                                 |
| `--line-2`    | ink 6%    | paper 6%  | soft dividers                                             |
| `--accent`    | `#CE2F23` | `#E84046` | Tekom red (4.59:1 on `--bg` light, 4.66:1 on `--bg` dark) |
| `--on-accent` | `#FFFFFF` | `#161210` | text on red                                               |
| `--panel`     | `#1F1A17` | `#26201C` | dark rail panels, footer                                  |
| `--on-panel`  | `#EEE8E2` | `#EEE8E2` | text on panels                                            |
| `--neg`       | `#8A3B2B` | `#D07A63` | errors (always with glyph + words)                        |

- Both themes ship on the public site. The theme follows the device until the visitor uses the toggle; the choice is stored in `localStorage` (`tekom-theme`) and applied before first paint.
- The mark fills with `currentColor`, so it follows the theme with no filter (§12).
- Material brand logos are grayscale at 60% opacity; full colour on hover.

## 2. Typography

| Role            | Face               | Weights              | Notes                                                                                      |
| --------------- | ------------------ | -------------------- | ------------------------------------------------------------------------------------------ |
| Display         | Cormorant Garamond | 400, 400 italic, 500 | headings only, set 1.22× larger than the base scale (`--dk`)                               |
| Body / UI       | Sofia Sans         | 300–600              | Bulgarian-designed; turn on `locl` so Cyrillic uses Bulgarian letterforms when `lang="bg"` |
| Figures / micro | IBM Plex Mono      | 400, 500             | years, m², counters, micro-labels                                                          |

- Self-host all three with `next/font` (no requests to Google at runtime: GDPR). Load the `cyrillic` and `latin` subsets.
- Scale (before `--dk`): hero statement `clamp(30px, 4.4vw, 56px)`, section `clamp(24px, 2.8vw, 32px)`, page title `clamp(28px, 3.6vw, 44px)`, body 17px / 1.6, small 14px, micro 11px uppercase tracked `.08em` (the floor).
- No weight 700. No ALL CAPS except micro-labels. Headings use `text-wrap: balance`.
- The red phrase in a display heading is italic Cormorant (`<em>`).
- Upgrade path (paid): Suisse Int'l or PP Neue Montreal for body; both ship Cyrillic.

## 3. Spacing and layout

- 4px grid. Sections are 112px apart on desktop, 64px on mobile.
- Content max width 1280px. Side gutter `max(16px, env(safe-area-inset-*))`.
- Body text max ~65 characters.
- The project rail is the only full-bleed element. Project photos are square everywhere: in the rail, the projects grid and the galleries (crop centre set per photo with `focus`). Desktop rail height `clamp(420px, 100svh − 150px, 880px)`; on phones every slide is a square `100vw − 56px` wide, so the next one peeks in, snapping one per swipe.
- The red rail panel keeps its text at full opacity. The mockup dimmed its body text to 0.85 and its micro label to 0.7; both fail WCAG AA on the red.

## 4. Radius

0 everywhere: photos, buttons, inputs, panels, cards.

## 5. Motion

| Token            | Value                       | Use                                      |
| ---------------- | --------------------------- | ---------------------------------------- |
| `--ease`         | `cubic-bezier(.22,1,.36,1)` | every transition                         |
| `--dur-micro`    | 180ms                       | hover, colour, borders                   |
| `--dur-standard` | 240ms                       | state changes, stamp in, arrow nudge     |
| `--dur-reveal`   | 600ms                       | photo hover scale (1.025), image fade-in |

- **The word that turns** (from bloxng.com): one phrase at the end of a heading changes; the rest of the line never moves. Dotted 1px underline in `--faint`. The new phrase falls in from above (520ms, squash at the end), the old one falls out below (420ms). On tekomltd.com it also turns by itself every 3.4s while visible and not hovered; tap or Enter turns it at once. Reduced motion swaps it in place, with no timer.
- The "photo pending" stamp appears on hover/focus only: fade in and settle from scale 1.15 to 1, rotated −7°.
- `prefers-reduced-motion`: all durations drop to 0, the turning timer does not run, and the rail scrolls without smooth behaviour.

## 6. Controls

- **Primary button** (`.btn`): red fill, `--on-accent` text, 44px tall (38px in the header), padding 0 20px, radius 0, weight 500, sentence case. One per view. Hover darkens the red 12% toward ink.
- **Secondary** (`.ghost`): 1px `--line` outline, text colour; hover turns the outline to `--text`.
- **Text link** (`.link`): red, weight 500, no underline.
- Every button or link that goes somewhere ends with `→` in `<span class="ar">`, which slides 4px on hover.
- **Rail arrows:** 44×44 square, 1px `--line` outline.
- **Language switch:** `BG · EN · DE` in Plex Mono 12px; inactive `--muted` (`--faint` fails AA for text), active `--text` with a 1px red underline. No box.
- **Theme switch:** a bare 15px moon icon in `--muted`, 32px target.
- **Inputs:** `--field` fill, 1px `--line`, radius 0, 16px text (no iOS zoom), label above in `--muted` 14px.
- Touch targets ≥ 40px.

## 7. Header and footer

- **Header:** sticky, 92% `--bg` with blur, hairline below. Left: the mark and the wordmark (§12). Right: Projects, EU programmes, Contact, language switch, "Request a quote" (desktop only), theme switch. On phones the nav wraps to a second row.
- **Footer:** `--panel` band. Five columns: Company (legal name, EIK/VAT, address, phone), Work, Public information (EU programmes, Publications, Procurement notices), Privacy (policy, cookies statement, data rights, terms), Follow the work (LinkedIn, Instagram, Facebook as 36px outlined squares). Then the EU funding line with programme codes, then © and the data-controller line.

## 8. Line icons ("glyphs")

- 48×48 viewBox, `stroke: currentColor`, width 1.4 (1.5 in scenes, non-scaling), round caps and joins, no fill.
- Crew tools: plumb, trowel, boards, roller, tiles, spatula, hat, brick, truss, key, ledger, square, laptop.
- Partner services: blueprint, square, beam, permit, survey, bolt, drop, air, window, kitchen, leaf, solar, tree.
- Default colour `--muted`; hover or active `--accent`. Never filled, never emoji.
- **Crew scenes:** until a crew's group photo exists, its frame shows a line drawing (building site or office) in `--faint`, with each role's glyph where that trade works. Hovering a role in the list turns its glyph red.

## 9. Voice and copy

- Plain and confident. The promise is risk reduction: "Build it right. Take the risk out." / „Строим правилно. Без излишен риск.“
- Boutique, not corporate. Numbers are about craft and time (years, m² still standing), never revenue.
- One dry joke per crew role while the photo is pending (dbrand tone). The joke disappears when the photo is uploaded.
- Bulgarian is the source language. Match grammatical gender to the real person. English and German are translations; when one is missing, show the Bulgarian with "Translation to follow" / „Übersetzung folgt“.
- Sentence case everywhere: headings, buttons, labels.

## 10. States

The site is static, so it has no loading or error states. An empty public list hides its section completely (partners, materials, partner services, crews).

## 11. Anti-patterns (flag in review)

- Raw hex or Tailwind colour classes in components instead of tokens.
- Red used for anything outside §0 rule 2; more than one primary button per view.
- Emoji as icons; filled or multicolour icons.
- Shadows, rounded corners, boxed sections.
- A cookie banner (the site sets no tracking cookies, so it needs none) or any third-party request at runtime (fonts, maps, analytics).
- A heading or label that changes the length of the line around the turning word.
- Partner or supplier names that Tekom has not added to the content files through a pull request.

## 12. The mark

- **The solid T** (`TekomMark` in `@tekom/ui`, file `packages/ui/src/assets/tekom-mark.svg`, favicon `apps/website/src/app/icon.svg`). An isometric T, 2:1 projection, a crossbar of three modules over a stem of two, one module deep. One ink in three values: top 100%, front 52%, side 28%. Fills with `currentColor`; never filled red, never outlined, never redrawn.
- Т is the same letter in Cyrillic and Latin, so the mark reads in BG, EN and DE alike.
- **Wordmark:** the name in Sofia Sans 500, tracked `.22em`. `ТЕКОМ` on the Bulgarian site, `TEKOM` on EN and DE. No emblem around it.
- **Lockup:** mark left of the wordmark, gap 10px, mark 28px in the header.
- It replaces the runner-figure wordmark. The old PNG stays in `design/mockup/` as part of the locked mockup only.

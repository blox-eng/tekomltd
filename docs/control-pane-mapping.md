# Landing features → control app

Each row is a feature visible on tekomltd.com (see `design/mockup/index.html`), the table that feeds it (spec §7), and the screen and controls Tekom needs in `control.tekomltd.com`. "BG/EN/DE" means three text fields with the Bulgarian one required and a "translation missing" chip on the others. Every list screen has drag-to-reorder (`sort`), a Published switch, and Undo on delete. Every save revalidates the affected public paths.

Access: one shared Tekom login (spec §7). Anyone signed in can use every screen.

| # | Public feature | Table(s) | Control screen | Controls |
|---|---|---|---|---|
| 1 | Header: wordmark, nav, language, theme, "Request a quote" | `site_settings` | Settings → Header | Switch: show quote button |
| 2 | Project rail: project slides (photo, scope tags, title, place, year) | `projects`, `project_images` | Projects | List with cover thumbnails; switch "On the rail"; switch "Wide slide"; drag to set rail order |
| 3 | Rail: capability panels ("Our own crew: Facades", "Same crew, inside", "Built from scratch", "Our partners", "Restoration", "You see your site every day") | `rail_panels` (`kind=capability`) | Rail panels | Label, title, body (BG/EN/DE); switch "Red panel" (max one, enforced); number "Show after project #" |
| 4 | Rail: crew slides ("25 years on site", "1 crew, foundations to finish") | `rail_panels` (`kind=crew_stat`), `crew_roles` (glyph collage) | Rail panels | Big value, unit line, body (BG/EN/DE); "Show after project #" |
| 5 | Promise heading + 4 promises | `promises`, `site_settings` | Promises | Title + body per line (BG/EN/DE), reorder, max 4 shown |
| 6 | Numbers row | `stats` | Numbers | Value (text, so "24 000" or "25"), label (BG/EN/DE), placeholder switch that adds "*" until confirmed |
| 7 | Turning headline "Хората зад …" | `site_settings.headline_turn_*` | Settings → Crew headline | Fixed start + 2–4 turning phrases per language; preview that plays the turn; validation: the start is identical in every phrase |
| 8 | Crew split: site crew and office crew, group photo or line scene | `crews` | Crews | Title, body (BG/EN/DE); group photo upload (replaces the scene and the stamp); scene picker (`site` / `office`) |
| 9 | Crew roles list (tool glyph, role, years, joke) | `crew_roles` | Crews → roles | Tool glyph picker (13 tools, shown as icons); role, joke (BG/EN/DE); years; note: "The joke hides once the group photo is uploaded" |
| 10 | "For everything else, we rely on our partners" cards | `partner_services` | Partner services | Icon picker (13 service glyphs); title, body (BG/EN/DE); section hides when none published |
| 11 | Map: Bulgaria + Stara Zagora centre, pins open projects | `projects.lat/lng/address` | Projects → Location | Address field + "Find on map" (server-side geocode via OpenStreetMap Nominatim, 1 request/s); lat/lng fields; small preview of both map panels with the pin; switch "Show on map" |
| 12 | Materials row (Baumit, Sika, …) | `material_brands` | Materials | Name, logo upload (SVG/PNG, shown grayscale), link |
| 13 | Partners row (hidden when empty) | `partners` | Partners | Name, role (BG/EN/DE), logo, link |
| 14 | Project detail page | `projects`, `project_images` | Projects → edit | Slug (auto from BG title, editable, keeps a redirect when changed); title, summary, place (BG/EN/DE); address; year; built area m²; scope chips; gallery upload (drag-drop, client downscale to 2400px, per-file progress), set cover, alt text (BG/EN/DE); Draft / Published |
| 15 | Projects index | `projects` | — (uses #14 data and order) | — |
| 16 | EU programmes page (EU emblem, "Co-funded by the European Union", aims, results, budget) | `eu_programmes` | EU programmes | Code; title, summary, objectives, results (BG/EN/DE); total budget and EU contribution in EUR; period; programme logo |
| 17 | Publications (EU notices, procurement notices) | `publications` | Publications | Kind, programme, title (BG/EN/DE), PDF upload, publication date |
| 18 | Footer: company, contacts, socials, EU line, data controller | `site_settings` | Settings → Company | Legal name, EIK, VAT, address (BG/EN/DE), phone, e-mail, privacy e-mail, LinkedIn / Instagram / Facebook URLs |
| 19 | Legal pages (privacy, cookies, data rights, terms) | `legal_pages` | Legal pages | Markdown editor with preview (BG/EN/DE); "last updated" stamped on save |
| 20 | Contact form | `enquiries` | Enquiries | Inbox list (newest first), mark handled, delete now (erasure), auto-delete after 12 months shown per row |
| 21 | SEO: titles, descriptions, OG image | `projects`, `site_settings` | Projects → SEO tab; Settings → SEO | Optional meta title/description overrides (BG/EN/DE); OG image = cover unless replaced |
| 22 | Old WordPress redirects | `projects.wp_slug` + static list | Projects → edit (read-only "Old URL") | Shows the old URL that redirects here |
| 23 | Sign-in | Supabase Auth (one account) | Account | Change password; set up the authenticator app (TOTP) |

## Not controlled from the app (code changes)

Design tokens and fonts (`DESIGN.md`), the scene drawings, the glyph set, the section order on the landing page, the GDPR mechanics (no cookies, self-hosted fonts), and the static redirect list for non-project WordPress URLs.

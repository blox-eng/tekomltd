# tekomltd

The website of ТЕКОМ ООД (tekomltd.com). A static Next.js site on one Netlify site. All content lives in `content/` (YAML, Markdown, images, PDFs) and changes through pull requests. `pnpm content:check` validates it.

## Run it

Needs Node 22 and pnpm 10 (`corepack enable`).

```bash
pnpm i
pnpm dev              # http://localhost:3000
pnpm content:check    # validate everything in content/
pnpm lint && pnpm typecheck && pnpm test
pnpm build            # production build
pnpm --filter @tekom/tests test:e2e                                   # full browser suite (builds and serves the site)
SITE_URL=http://localhost:3000 pnpm --filter @tekom/tests test:smoke  # smoke test against a running site
```

## Guides

- [CONTENT.md](CONTENT.md): how Tekom staff change texts, projects, photos and PDFs with a pull request (Bulgarian, then English).
- [DEPLOYMENT.md](DEPLOYMENT.md): Netlify setup, the DNS move and the go-live checklist.

## Layout

| Path                                                        | What                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| `apps/website`                                              | The Next.js site (`@tekom/website`).                  |
| `packages/ui`, `packages/i18n`                              | Shared components and the bg/en/de catalogues.        |
| `content/`                                                  | All site content.                                     |
| `tests/`                                                    | Playwright end-to-end and smoke tests.                |
| `netlify.toml`                                              | The Netlify build config.                             |
| `DESIGN.md`                                                 | Design canon. Read before any visual decision.        |
| `design/mockup/`                                            | The locked clickable mockup (`build.py` rebuilds it). |
| `docs/superpowers/specs/2026-10-14-tekomltd-site-design.md` | The spec.                                             |

Project photos and texts come from the previous tekomltd.com and belong to ТЕКОМ ООД. Material brand logos belong to their owners and are used to name materials Tekom works with.

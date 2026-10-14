# Deployment Guide

How tekomltd.com is built and published. The site is fully static (Next.js) and lives on one Netlify site. No database, no server secrets, no environment variables are needed.

## 1. Netlify site

| Setting           | Value                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Site name         | `tekomltd-website` (Tekom's Netlify team)                                                                         |
| Repository        | `blox-eng/tekomltd` (the Netlify GitHub app on `blox-eng` must allow this repo)                                   |
| Production branch | `main`                                                                                                            |
| Deploy previews   | on, for every pull request                                                                                        |
| Build settings    | read from the root `netlify.toml`: base `apps/website`, publish `.next`, plugin `@netlify/plugin-nextjs`, Node 22 |

The root `netlify.toml` is the only build config. The build runs, in this order: `corepack enable` (pnpm 10 from `packageManager`), `pnpm install --frozen-lockfile`, `pnpm content:check`, `pnpm sync-media`, `next build`. A content error therefore fails the build before anything is published.

Every pull request gets a deploy preview. Its link is posted in the pull request. Reviewers open it before merging (see `CONTENT.md`). A merge to `main` is the production deploy.

## 2. Make the demo public

New Netlify sites in Tekom's team may have visitor access control ("Team login") on. While it is on, visitors must sign in to Netlify and cannot see the site.

Netlify → site `tekomltd-website` → Site configuration → Access & security → Visitor access → turn **Team login** off. Check by opening `https://tekomltd-website.netlify.app` in a private window.

## 3. Smoke test

Against any running copy of the site:

```bash
SITE_URL=https://tekomltd-website.netlify.app pnpm --filter @tekom/tests test:smoke
```

It opens `/`, `/en/projects`, one project, `/eu-programmes`, `/contact` and `/privacy` and expects HTTP 200, no console error, no request to another host and no serious or critical accessibility violation (axe). The full suite (`pnpm --filter @tekom/tests test:e2e`) starts its own production build.

## 4. DNS move from SuperHosting

**After Tekom approves the demo. Not done yet. Do not change DNS before that.**

tekomltd.com is now served by SuperHosting (WordPress). To move it:

1. Netlify → site → Domain management → Add a domain → `tekomltd.com`. Netlify also offers `www.tekomltd.com`; add it and set **`www` → apex** (the apex `tekomltd.com` is the primary domain, `www` redirects to it).
2. At the DNS provider of tekomltd.com, change only the web records:
   - apex `tekomltd.com`: `A` record to the Netlify load balancer address shown in Domain management (or an `ALIAS`/`ANAME` to `tekomltd-website.netlify.app` if the provider supports it);
   - `www`: `CNAME` to `tekomltd-website.netlify.app`.
     Remove the old SuperHosting `A`/`AAAA`/`CNAME` records for the apex and `www`.
3. **Keep every `MX` record (Google Workspace) and any `TXT` record (SPF, DKIM, DMARC, verification) unchanged.** Do not delete or edit them. Mail must keep working during and after the move.
4. Wait for DNS to propagate, then in Netlify → HTTPS → verify DNS and provision the certificate (Let's Encrypt, automatic). Turn on "Force HTTPS".
5. Check `https://tekomltd.com`, `https://www.tekomltd.com` (must redirect to the apex), an old WordPress address (must redirect, see `design/wordpress-snapshot/url-map.json`) and send a test e-mail to `info@tekomltd.com`.
6. Keep the SuperHosting account for at least a week as a fallback. Lower the TTL of the web records a day before the move so a rollback is quick.

## 5. Go-live checklist

- [ ] Tekom approved the demo.
- [ ] Legal pages (`content/legal/*`: privacy, cookies, data rights, terms; bg, en, de) reviewed by a lawyer or by Tekom; `reviewed: true` set in each file.
- [ ] EU emblem replaced with the official file supplied by the programme authority.
- [ ] Placeholders confirmed or removed (`unconfirmed: true` stats and panels in `content/home.yaml`, empty `partners`, sample texts).
- [ ] English and German copy checked (no German or English fallback notes on pages that matter).
- [ ] Founding year: `founded` in `content/settings.yaml` says 1991, `content/pages/about.bg.md` says 1993. Decide and make them agree.
- [ ] Contact details (`content/settings.yaml`): phones, e-mail, address, opening hours correct.
- [ ] Team login off on the Netlify site (section 2).
- [ ] Smoke test passes against the production URL.
- [ ] DNS moved (section 4); apex and `www` work with HTTPS; `www` redirects to the apex; mail still works.
- [ ] Uptime Kuma monitor added for `https://tekomltd.com` (HTTP 200, keyword check on the home page).

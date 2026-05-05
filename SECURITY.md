# Security notes for IP Linux (public repo + public web)

This is a 100% client-side React/Vite app. There is no backend in this repo,
so the surface for hard security issues is small. This document is for the
maintainer to keep that surface small as the project grows.

## What ships in the bundle

* The Vite production bundle is compiled JavaScript + CSS shipped to the
  browser. Anyone visiting the site can read it.
* Therefore: NEVER add a secret key (`OPENAI_API_KEY`, private Supabase
  service role key, etc.) to the source or to a `.env*` file that gets
  committed. Only `VITE_*` variables are exposed to the browser at build
  time, and they all become public.

## What state persists in the browser

State is stored on the visitor's own browser, never sent to a server:

| Key                                | Where         | Contents                       |
| ---------------------------------- | ------------- | ------------------------------ |
| `iplinux_filesystem`               | IndexedDB     | Virtual file system contents   |
| `iplinux_app_handoff_v1`           | localStorage  | Per-app UI state (scroll etc.) |
| `iplinux_disabled_apps_v1`         | localStorage  | App Store install/remove list  |
| `iplinux_desktop_icons_v6`         | localStorage  | Desktop icon positions         |

The clipboard tray (Round 7) is held only in memory; it is **not** saved to
storage and resets on reload. Never persist private clipboard content.

## Code-level safeguards already in place

* No `eval` and no `new Function` in `app/src/**`.
* All `dangerouslySetInnerHTML` calls go through `DOMPurify.sanitize` and
  whitelist a tight set of attributes.
* The shipped `index.html` declares a Content-Security-Policy meta tag with
  `default-src 'self'`. (Note: Vite still requires `'unsafe-inline'` and
  `'unsafe-eval'` for HMR in dev builds; these can be tightened in
  production via the deploy host's CSP header.)
* Browser frame embedding restricted to a small allow-list of trusted
  origins (`youtube`, `wikipedia`, `lite.duckduckgo.com`).
* Cloud Sync, AI Bridge, and the unused Supabase client dependency were
  removed. Reintroduce cloud services only with a backend/edge function that
  keeps service secrets out of the browser bundle.

## Things to keep tight when contributing

* Never commit `.env`, `.env.local`, `*.pem`, `*.key`, or any file under
  `secrets/`. Root and `app/` `.gitignore` cover this.
* Treat any `localStorage`/IndexedDB write as user-visible: do not store
  passwords, tokens, OAuth state, or third-party API tokens there.
* Any new `dangerouslySetInnerHTML` site MUST go through DOMPurify and be
  audited in PR review.
* Any new third-party origin used in iframes MUST be added to the CSP
  `frame-src` list in `app/index.html` and re-reviewed.

## Recommended hardening for the deploy host

When deploying the `dist/` bundle, the hosting provider should also send:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()
```

If you publish the live site behind a reverse proxy or static host
(Vercel, Netlify, Cloudflare Pages), configure these as response headers.

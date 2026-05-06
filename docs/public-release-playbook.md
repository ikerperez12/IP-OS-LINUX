# Public Release Playbook

This playbook captures the release standard for IP Linux and future public UI projects in this workspace. It exists so the repository presentation stays aligned with the deployed product instead of drifting into stale screenshots or generic template copy.

## Release Contract

Every public release should leave the repository in this state:

- GitHub repository is public.
- GitHub homepage points to the production Vercel URL.
- README has a live link, real preview media, feature highlights, stack, architecture, local setup, checks, accessibility notes and security notes.
- README feature claims are updated when shell workflows change, including desktop pinning, widgets, context menus and file actions.
- `.github/assets/` contains screenshots or GIFs captured from the real deployed or local app.
- `vercel.json` defines the static build and production headers.
- `app/public/` contains manifest, robots, sitemap and social preview image.
- `.env`, tokens, private keys, local `.vercel/`, build outputs and logs are ignored.
- CI runs lint, high-severity audit and production build.

## README Pattern

Use this structure for product-facing repos:

1. Product name.
2. Centered links: live URL, run locally, accessibility, architecture, security.
3. Compact badges for runtime, stack, deployment and safety posture.
4. One paragraph describing what the product is and why it exists.
5. Hero image from the real product.
6. Preview GIF plus bento overview.
7. Highlights.
8. Tech stack table.
9. Architecture diagram and folder map.
10. Quick start.
11. Quality gates.
12. Accessibility and security posture.
13. Production notes and repository status.

Avoid template filler, unverified claims, fake screenshots, secret-dependent setup, or marketing copy that contradicts the shipped app.

## Media Capture Workflow

Capture from the deployed site when possible:

```powershell
vercel inspect https://ip-os-linux.vercel.app --scope ikerperez12s-projects
```

Then capture the following screens:

- Splash / entry state.
- Clean desktop state.
- Workspace state with one or two windows and visible chrome.
- Mobile or tablet viewport.

Generate README assets under `.github/assets/`:

- `ip-linux-hero.png`
- `ip-linux-preview.gif`
- `ip-linux-bento.png`
- Supporting raw screenshots.

The social preview image used by OpenGraph/Twitter should be copied to `app/public/og-image.png`.

## Accessibility Gate

Follow the `accessibility-by-default` baseline:

- Preserve semantic controls wherever possible.
- Icon-only controls need accessible names.
- Keyboard shortcuts must not hijack text inputs, terminal prompts or contenteditable regions.
- Drag-and-drop workflows need a non-drag alternative, such as the launcher `+` control used to pin apps to the desktop.
- Focus indicators must be visible and not clipped by glass panels.
- Decorative animation must respect reduced motion.
- Mobile viewport must allow zoom; do not reintroduce `user-scalable=no` or `maximum-scale=1`.

## Security Gate

Before publishing:

```powershell
git diff --check
git grep -nE "OPENAI_API_KEY|SUPABASE_SERVICE_ROLE|VERCEL_TOKEN|BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY|sk-[A-Za-z0-9]" -- .
git ls-files | Select-String -Pattern "node_modules|app/dist|\\.env|\\.vercel"
cd app
npm audit --audit-level=high
npm run lint -- --quiet
npm run build
```

No OpenAI, Supabase, Cloud Sync or backend secret should be committed to this release. If cloud features return later, secrets must live behind a server or edge function, never in the frontend bundle.

## Vercel Release Workflow

Use Git-backed production deployment for `main`:

```powershell
git push origin main
vercel inspect https://ip-os-linux.vercel.app --scope ikerperez12s-projects
```

If Git integration does not produce the expected production deployment, deploy explicitly:

```powershell
vercel deploy --prod --yes --scope ikerperez12s-projects
```

Do not commit `.vercel/`; it is local project-link metadata.

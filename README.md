# IP Linux

IP Linux is a local-first browser desktop built with React, TypeScript, and Vite. It presents a polished desktop shell with window management, a dock, launcher, virtual workspaces, reactive wallpapers, folders, and a catalog of built-in apps that run entirely in the visitor's browser.

## Preview

The app is designed to deploy as a static web app on Vercel. It does not require a backend or secret environment variables.

## Features

- Desktop shell with draggable/resizable windows, dock, launcher, top panel, virtual workspaces, and snap assist.
- Organized desktop folders with strict grid placement and local persistence.
- Built-in apps including Files, Terminal, Browser, Music, Matrix Rain, Settings, Store, games, productivity tools, and developer utilities.
- Reactive animated wallpapers, acrylic grain, screen filters, visual effects, and reduced-motion support.
- Local-first persistence using IndexedDB/localStorage for user state in the current browser only.
- YouTube-aware browser fallback that embeds supported video URLs and explains sites blocked by iframe policies.

## Safety Model

- No OpenAI, Supabase, Cloud Sync, or backend service is active in this release.
- No real secrets are needed. Do not commit `.env`, tokens, private keys, or Vercel local config.
- Browser state remains on the visitor's own device. The app does not upload files, clipboard content, or app data to a server.
- HTML preview surfaces use DOMPurify where dynamic HTML is rendered.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI primitives
- IndexedDB via `idb-keyval`
- Vercel static hosting

## Quick Start

```powershell
cd app
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:3000/`.

## Build and Checks

```powershell
cd app
npm run build
npm audit --audit-level=high
```

The production build emits a static app into `app/dist`.

## Deploy

The repository includes `vercel.json` at the root:

```powershell
vercel login
vercel link --repo
vercel deploy --prod
```

Production should deploy from `main` after the release PR passes build and audit checks.

## Project Structure

```text
app/
  src/apps/          Built-in desktop applications
  src/components/    Shell, dock, launcher, windows, menus
  src/hooks/         OS store and filesystem hooks
  src/lib/           Layout, storage, effects, helpers
  public/            Manifest, sitemap, robots, public assets
SECURITY.md          Public security notes
vercel.json          Vercel build, routing, and security headers
```

## Current Scope

IP Linux is a browser-based desktop simulation and productivity playground. It is not a real Linux distribution, does not run native binaries, and does not provide cloud sync in this release.

## License

MIT. See [LICENSE](LICENSE).

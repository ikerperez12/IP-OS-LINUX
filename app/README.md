# IP Linux App

This directory contains the React/Vite frontend for [IP Linux](../README.md).

- Live site: <https://ip-os-linux.vercel.app>
- Public release notes, screenshots, security posture and architecture live in the repository root README.
- Vercel builds this directory through the root `vercel.json`.

## Development

```powershell
npm ci
npm run dev
```

## Production Build

```powershell
npm run build
```

The static output is written to `dist/`. The repository root contains the public release README, security notes, CI workflow, and Vercel configuration.

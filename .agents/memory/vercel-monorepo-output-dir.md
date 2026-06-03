---
name: Vercel monorepo output directory
description: Why a nested build output fails Vercel with "No Output Directory named public" and the deterministic fix
---

# Vercel "No Output Directory named public found" for monorepo sub-apps

## Symptom
Vercel build *succeeds* (the build command runs, vite emits files) but the deploy
fails with: `Error: No Output Directory named "public" found after the Build completed.`
This happens even when `vercel.json#outputDirectory` points at the correct nested
path (e.g. `artifacts/<app>/dist/public`).

## Why
Vercel's dashboard "Build & Development Settings" can override `vercel.json` on a
**per-field** basis (Override toggle). It's possible for `installCommand` and
`buildCommand` from `vercel.json` to be honored while `outputDirectory` is
overridden by the dashboard's default (`public`). So the file looks correct but
the effective output dir is the generic default. You cannot see or reliably fix
this from code, and telling the user to change the dashboard is unreliable.

## Deterministic fix (code-only, dashboard-independent)
Make the output land where Vercel looks by default — repo-root `public/`:
- `buildCommand`: append `&& rm -rf public && cp -r <app>/dist/public public`
- `outputDirectory`: `public`
- Add `/public` to root `.gitignore` (build artifact, regenerated each deploy).

**Why it's bulletproof:** whether Vercel uses our `outputDirectory: public` OR its
own default `public`, the files are in the same place. Do NOT change vite's
`build.outDir` — it stays `dist/public` because the Replit artifact serve config
depends on it; the copy shim only affects Vercel.

## Note on this repo's vite config
`artifacts/pk-site/vite.config.ts` THROWS if `PORT` or `BASE_PATH` is unset, so the
Vercel `buildCommand` inlines `BASE_PATH=/ PORT=5173`. A build that completes is
proof those env vars were set (i.e. our buildCommand ran).

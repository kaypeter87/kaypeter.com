---
name: Vercel monorepo output directory
description: Why a monorepo sub-app fails Vercel with "No Output Directory" / cp errors and the real fix (Root Directory awareness)
---

# Vercel "No Output Directory" for monorepo sub-apps — paths are relative to Root Directory

## Symptom
Build *succeeds* (vite emits files) but the deploy fails with either:
- `Error: No Output Directory named "public" found after the Build completed.`, or
- a post-build `cp: cannot stat '<path>': No such file or directory`.

## Real root cause (confirmed from the build log)
The Vercel project's **Root Directory** was set to the sub-app folder
(`artifacts/pk-site`), NOT the repo root. **Every path in `vercel.json`
(`outputDirectory`, and any cwd-relative shell paths in `buildCommand`) resolves
relative to that Root Directory, not the repo root.** So a value like
`artifacts/pk-site/dist/public` becomes `artifacts/pk-site/artifacts/pk-site/dist/public`
→ not found → Vercel falls back to its default name `public` and reports it missing.

### How to read the log to confirm Root Directory
- pnpm install progress lines prefixed with `../..` → cwd is 2 levels below the
  workspace root, i.e. Vercel is running inside `artifacts/<app>`.
- The build banner `> @workspace/<app> build /vercel/path0/artifacts/<app>` plus a
  cwd-relative `cp`/`ls` that can't find `artifacts/<app>/...` confirms cwd = the sub-app.

## Fix (code-only, matches the existing Root Directory)
Make all `vercel.json` paths relative to the sub-app:
- `outputDirectory: "dist/public"` (NOT `artifacts/<app>/dist/public`).
- `buildCommand`: just build; no `cp` shim. `pnpm --filter @workspace/<app> run build`
  still works from the sub-app cwd because pnpm walks up to the workspace root.
- `rewrites`/`headers` use URL paths, so they're unaffected by Root Directory.

**Why not change the dashboard instead:** dashboard changes are unverifiable from
here and the user had trouble applying them; adapting `vercel.json` to the existing
Root Directory is deterministic. (Alternative, if Root Directory is empty/repo-root:
then `outputDirectory` must be the full `artifacts/<app>/dist/public`.)

## Repo-specific
`artifacts/pk-site/vite.config.ts` THROWS if `PORT` or `BASE_PATH` is unset, so the
Vercel `buildCommand` inlines `BASE_PATH=/ PORT=5173`. vite `build.outDir` is the
absolute `<config-dir>/dist/public` — do not change it (Replit serve depends on it).

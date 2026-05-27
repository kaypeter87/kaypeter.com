# How to add blog posts

A personal-reference doc for the recommended journal/blog setup on `pk-site`.
Nothing in here is implemented yet — this captures the plan so you can pick it
up when you're ready (or hand it to the agent to scaffold).

## TL;DR

Posts live as **MDX files in the repo**. To publish a new post:

1. Drop a file in `artifacts/pk-site/content/posts/`.
2. Commit and push to your default branch.
3. Netlify rebuilds in ~30s and the post is live.

That's it. No CMS, no database, no admin UI — your editor is the CMS, git is
the history, GitHub is the backup.

---

## Why MDX (and not the other options)

| Option | Verdict | Why |
| --- | --- | --- |
| **MDX files in repo** | ✅ Recommended | Free, fast, version-controlled, fits Netlify's static model. Lets you embed React components inside posts when you want them (charts, custom callouts, image galleries). |
| Plain Markdown | Fine fallback | Same workflow as MDX but no embedded components. Use this if you never want JSX in a post. |
| Headless CMS (Sanity, Contentful, Notion) | Skip for now | Worth it only if you'll write often from a phone/tablet or have non-technical collaborators. Overkill for a solo journal. |
| `api-server` + Postgres | Skip for now | Means hosting an API + DB. Too heavy for a personal blog. Revisit if you ever want comments, drafts with auth, or per-user features. |

---

## Proposed file layout

```text
artifacts/pk-site/
  content/
    posts/
      2026-05-22-hello-world.mdx
      2026-06-03-on-quiet-design.mdx
  src/
    pages/
      Journal.tsx          # /journal — list of all posts (newest first)
      JournalPost.tsx      # /journal/:slug — single post
    lib/
      posts.ts             # loads + parses all posts at build time
```

## Post file format

Each post is an MDX file. The filename is the URL slug. Frontmatter sits at
the top, the body is Markdown (with JSX if you need it).

```mdx
---
title: "Hello, world"
date: "2026-05-22"
excerpt: "A short blurb that shows up in the journal index and meta tags."
tags: ["meta", "introductions"]
draft: false
---

This is the body. Plain Markdown works — **bold**, _italic_, [links](https://example.com),
lists, code blocks, the usual.

You can also drop React components in for richer posts:

<Callout tone="quiet">
  Drafts are excluded from the index automatically — flip `draft: false` to
  publish.
</Callout>
```

### Frontmatter fields

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Shown in index + post header + `<title>` tag. |
| `date` | yes | ISO format (`YYYY-MM-DD`). Used for sort order. |
| `excerpt` | recommended | Short summary for the index and Open Graph tags. |
| `tags` | optional | Array of strings. Useful later for filtering. |
| `draft` | optional | `true` keeps a post out of the index. Defaults to `false`. |

---

## How the loading works (when scaffolded)

A tiny helper in `src/lib/posts.ts` uses a Vite glob import:

```ts
const modules = import.meta.glob("/content/posts/*.mdx", { eager: true });
```

This gives the bundler the full list of posts at build time. The helper then:

1. Strips the `.mdx` extension from each filename → slug.
2. Reads the frontmatter from each module.
3. Filters out drafts.
4. Sorts by `date` descending.
5. Exports `getAllPosts()` (for the index) and `getPostBySlug(slug)` (for the
   detail page).

No runtime fetching, no API, no environment variables. The whole journal is
baked into the static bundle at build time, which is why Netlify can serve it
for free.

---

## Workflow

### Writing a new post

1. Copy the most recent post in `content/posts/` as a starting point.
2. Rename the file using today's date and a slug:
   `YYYY-MM-DD-short-slug.mdx`
3. Update the frontmatter (`title`, `date`, `excerpt`).
4. Write the body.

### Previewing locally

```bash
pnpm --filter @workspace/pk-site run dev
# open the URL in the Replit preview pane, navigate to /journal
```

### Publishing

```bash
git add artifacts/pk-site/content/posts/YYYY-MM-DD-short-slug.mdx
git commit -m "post: short-slug"
git push
```

Netlify rebuilds on push. The new post appears in the index and at
`/journal/short-slug` once the build finishes.

### Drafts

Set `draft: true` in the frontmatter while you're still writing. The post will
be ignored by the index and detail routes but stays in the repo so you can
keep iterating across machines.

---

## When you're ready to build this

Hand this doc to the agent and say something like:

> Scaffold the MDX blog as described in `HOW_TO_ADD_POSTS.md`. Add the Vite
> MDX plugin, the post loader, the `/journal` index page, the
> `/journal/:slug` detail page, and one sample post.

The agent will install `@mdx-js/rollup` + `gray-matter`, wire up the Vite
config, create the loader, add the two routes, and seed one example post.

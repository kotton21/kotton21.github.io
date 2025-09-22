# prompt.md

## Part 1 — Analyze Draft `projects/` Folder & Propose Schema/Requirements

**Title:** Analyze draft `projects/` folder and propose schema/requirements

**Goal:** Inspect my draft `projects/` folder (each subfolder = one project with media and/or notes), propose an Astro content schema and minimal site requirements that match what’s actually there, and then rewrite the build prompt accordingly. 

**Scope & Steps:**
1. **Scan & summarize** the `projects/` folder:
   - List subfolders (treat each as a project).
   - For each, summarize media types (images/gifs/video/audio), likely thumbnails, any text/notes files, and naming patterns.
   - Note inconsistencies (missing thumbs, unclear dates, unusual extensions, mixed content).
2. **Propose a content schema** for `src/content/projects/*.(md|mdx)`:
   - Core fields you recommend (e.g., `title`, `date`, `tags`, `thumb`, `blurb`, optional `links`).
   - Add a `template` field (e.g., `default`, `gallery`, `videoFirst`, `caseStudy`, `custom`) to support different click-through layouts.
   - If helpful, suggest a discriminated union so certain templates require extra fields (e.g., `heroVideo` for `videoFirst`).
3. **Identify gaps & ask questions** needed to finalize the schema and requirements:
   - How should dates be derived if not present (folder name, file mtime, manual)?
   - Should tags be required or auto-guessed?
   - Preferred thumbnail rules (look for `*-thumb.*`, first image, etc.)?
   - Any special handling for videos/gifs?
   - Do all projects need per-page MDX or are some “card only”?
4. **Recommend layout defaults** based on what you see:
   - Grid density (card min width), aspect ratio for thumbs, tag categories to surface, need for filters (optional).
5. **Output:** Provide a **revised Part 2 build prompt** tailored to this folder, including the final schema fields, template options, ingest/scan behavior, and any special rules you discovered.

---

## Part 2 — Build the Site (Use the Revised Schema from Part 1)

**Title:** Build Astro static portfolio site (using revised schema)

**Goal:** Using the updated schema and requirements from Part 1, scaffold a static Astro site: a portfolio grid on `/`, dynamic per-project pages at `/projects/[slug]`, plus `/resume` and `/contact`. Include an optional Node script that can **scan** (advice only) or **ingest** (write MDX + copy media). Use the theme from here: https://astro.build/themes/details/saral/

**Requirements (static, minimal):**
1. Initialize **Astro** with **MDX** support.
2. Define a **`projects` content collection** in `src/content/config.ts` using Zod with the **final schema from Part 1** (include a `template` field with a sensible default like `default`).
3. Pages & routes:
   - `/` (**index.astro**): responsive grid of all projects, newest first; each card links to `/projects/[slug]`.
   - `/projects/[slug]` (**dynamic detail page**): render the project using a shared **ProjectLayout**; select layout/partials by `template` (default fallback if unset).
   - `/resume`: a simple page with a prominent button/link to a Google Drive PDF (use placeholder).
   - `/contact`: list email, Instagram, LinkedIn (use placeholders).
4. Components & layout:
   - `ProjectCard.astro` for grid tiles (thumb, title, blurb, tags).
   - `ProjectLayout.astro` for detail pages; keep a small set of visual “knobs” (CSS variables for radius, accent color, spacing).
   - If `template` values require, add lightweight partials (e.g., a simple gallery or video-first hero), but keep everything static.
5. Optional Node script: `scripts/ingest-projects.mjs`
   - **Scan-only mode:** `npm run scan` (or `--scan-only`) analyzes the local `projects/` folder and prints layout/schema suggestions (no writes).
   - **Ingest mode:** `npm run ingest` copies media to `public/assets/projects/<slug>/` and generates/updates MDX files in `src/content/projects/` to match the **final schema**.
   - **Selection:** default scans all; support `--only <name-or-path>` (repeatable) to ingest just one or a few projects.
   - **Filters:** `--match "<glob>"`, `--since "<YYYY-MM-DD>"`.
   - **Toggles:** `--dry-run` (no writes), `--force` (overwrite existing MDX).
   - **Slug rules:** derive from folder name; allow `--slug "<custom>"` in single-project mode.
   - **Idempotent:** if MDX exists and not `--force`, append newly discovered media but don’t rewrite core front-matter.
   - **Summary:** print ingested items and inferred tags.
   - **Note:** Do **not** run this automatically during `build`; it should be a manual step.
6. Styling:
   - Minimal dark theme, responsive CSS grid (`repeat(auto-fill, minmax(...)))`).
   - Expose corner radius, accent color, and grid density via CSS variables for quick theming.
7. Output a concise `README.md` with:
   - First-run steps (install, dev, build, preview).
   - How to set the resume/contact links.
   - How to run **scan** vs **ingest**.
   - GitHub Pages deployment notes (custom domain via `CNAME`) and/or Render static deploy.
8. Include an optional `environment.yml` (conda) that pins Node/npm for reproducible setup.

**Deliverables:**
- Config: `astro.config.mjs`, `package.json`, `tsconfig.json`
- Content: `src/content/config.ts` (revised schema), sample `src/content/projects/` entries
- Pages: `src/pages/index.astro`, `src/pages/projects/[slug].astro`, `src/pages/resume.astro`, `src/pages/contact.astro`
- Components/Layout: `src/components/ProjectCard.astro`, `src/layouts/ProjectLayout.astro` (+ any small template partials)
- Scripts: `scripts/ingest-projects.mjs` with **scan** and **ingest** modes (as specified)
- Public: `public/assets/.gitkeep` (media copied here by ingester)
- Docs: `README.md` (as above), optional `environment.yml`

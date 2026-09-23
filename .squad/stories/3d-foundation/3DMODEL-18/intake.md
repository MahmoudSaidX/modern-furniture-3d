# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/3d-foundation/3DMODEL-18/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** 3D Foundation
- **Feature slug (folder under `plans/`):** `3d-foundation`

## Tracker (metadata only)

- **Tracker type:** `none (Linear, read via connector)`
- **Work item id:** `3DMODEL-18`
- **Work item type:** `Story (feat)`
- **Status:** `Backlog`
- **Assignee:** ``
- **Labels:** `none`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

```md
S0-05 — Establish 3D Technology Foundation
```

---

## Description

```md
## User Story

As a developer, I want a minimal 3D foundation for upcoming furniture experiences.

## Business Rules

- Do not build a generic 3D engine
- prefer R3F/Drei unless lower-level Three.js is genuinely needed.

## Scene / Cinematic Requirements

Development Scene only: camera, environment/light, test model, controls.
```

---

## Acceptance criteria

```md
- R3F and Drei configured
- Canvas responsive
- test GLB loads
- basic environment/lighting, controls, and loading state work.
```

---

## Attachments

None. (The test model is a repo asset, see Extra notes — not a squad attachment.)

---

## Dependencies

- **Blocked by / related ids:** 3DMODEL-22 (S0-01 Initialize Next.js Application) — Done (delivered earlier as CRM-215); 3DMODEL-21 (S0-02 Establish Project Structure) — Done.
- **Blocks:** 3DMODEL-13 (US-101), 3DMODEL-16 (S0-07), 3DMODEL-17 (S0-06).
- **Depends on code areas or other stories:** `src/app/[lang]/` routing and `src/i18n/` dictionaries (S0-03/S0-04, Done).

## Extra notes (optional)

Human decisions recorded during /next-story (binding):

- **Test GLB:** use the prepared Stockholm Chair asset. Copy `/Users/mahmoudsaid/www/modern-models/stockholm-chair.glb` (9.8 MB) **unchanged** to `public/models/stockholm-chair.glb`. Do not optimize or modify the asset in this story.
- **Dev scene location:** new route `src/app/[lang]/dev/scene/page.tsx`, returning 404 in production builds.
- **Scene boundary:** the foundation is the first Product Scene code, under `src/features/product-scene/`.
- **Loading state:** localized DOM text from the dictionaries (e.g. `scene.loading` in en/ar), rendered as an overlay above the canvas — no text inside the 3D scene.

From docs/ARCHITECTURE.md: 3D is never mirrored (scene code must not read `dir`/locale; canvas not flipped); scene contains no user-facing text; public 3D assets under `public/` in a named subfolder documented in ARCHITECTURE.md when first added; directories created just-in-time.

## Technical hints (optional)

- Packages named by Linear: `@react-three/fiber`, `@react-three/drei` (with `three` as their peer). Next.js 16.3.5, React 19.2.8. Repos/roots: `.`. Primary language: `typescript`.

## Out of scope

- Optimizing or modifying the GLB asset (human decision).
- A generic 3D engine (Linear business rule).
- Any production scene (Linear: "Development Scene only").

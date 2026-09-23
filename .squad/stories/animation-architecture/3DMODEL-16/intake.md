# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/animation-architecture/3DMODEL-16/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** Animation & Cinematic Architecture
- **Feature slug (folder under `plans/`):** `animation-architecture`

## Tracker (metadata only)

- **Tracker type:** `none (Linear, read via connector)`
- **Work item id:** `3DMODEL-16` _(used in filenames and plan tables; fill manually if empty)_
- **Work item type:** `Story (feat)`
- **Status:** `Backlog`
- **Assignee:** ``
- **Labels:** `none`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

_(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)_

```
S0-07 — Establish Animation & Cinematic Architecture
```

---

## Description

```md
## User Story

As a developer, I want a simple animation approach so cinematic interactions remain predictable.

## Business Rules

- No custom animation framework
- use small explicit timelines
- interaction can interrupt cinematics when needed.

## Scene / Cinematic Requirements

Timelines may control camera/target, model transform, environment/lighting, and UI reveal.
```

---

## Acceptance criteria

```md
- GSAP configured
- ownership documented for R3F/GSAP/React/Zustand
- cleanup on unmount
- PRODUCT/DETAIL/CUSTOMIZE/CONTEXT states defined.
```

---

## Attachments

Place files in `attachments/` next to this `intake.md`, then list them here so the planner knows what to open.

| File (relative to this folder)  | What it is       |
| ------------------------------- | ---------------- |
| _(e.g. `attachments/flow.png`)_ | _(e.g. UX flow)_ |

None. (Linear issue has no attachments or comments.)

---

## Dependencies

- **Blocked by / related ids:** 3DMODEL-18 (S0-05 — Establish 3D Technology Foundation) — Done. Blocks 3DMODEL-7 (US-301 — Transition Product Into Room) and 3DMODEL-12 (US-102 — Cinematic Product Introduction).
- **Depends on code areas or other stories:** `src/features/product-scene/ProductScene.tsx` and `src/app/[lang]/dev/scene/page.tsx` (from 3DMODEL-18); `docs/ARCHITECTURE.md` (Lightweight shared state deferred to S0-08).

## Extra notes (optional)

Recorded human decisions (Stage 2, verbatim):

> 1: install gsap and @gsap/react. 2a: document Zustand ownership only; do not install or implement Zustand in S0-07. 3a: define PRODUCT, DETAIL, CUSTOMIZE and CONTEXT as a small TypeScript domain contract in product-scene and document their ownership, without introducing a state-machine framework. 4a: implement only a minimal development-scene lifecycle proof using a small GSAP timeline that demonstrates mount, interruption by user interaction, and cleanup on unmount. Do not design final cinematic choreography, camera behavior, durations, easing, or animation UX in this story. 5a: create docs/ANIMATION.md and link it from ARCHITECTURE.md. Stop again if another unresolved decision appears.

## Technical hints (optional)

- APIs, screens, services already discussed. Repos/roots: `.`. Primary language: `typescript`.

## Out of scope

- What this story explicitly does **not** cover (per recorded decision):
  - Installing or implementing Zustand (ownership is documented only; tooling arrives in S0-08).
  - A state-machine framework.
  - Final cinematic choreography, camera behavior, durations, easing, or animation UX.

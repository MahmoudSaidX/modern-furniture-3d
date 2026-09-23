# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/shared-state/3DMODEL-15/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** Lightweight Shared State
- **Feature slug (folder under `plans/`):** `shared-state`

## Tracker (metadata only)

- **Tracker type:** `none (Linear, read via connector)`
- **Work item id:** `3DMODEL-15` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story (feat)`
- **Status:** `Backlog`
- **Assignee:** ``
- **Labels:** `none`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
S0-08 — Configure Lightweight Shared State
```

---

## Description

```md
## User Story

As a developer, I want minimal shared state so configuration and 3D scenes stay synchronized.

## Business Rules

* No Redux
* do not globalize all UI state
* never store Three.js objects globally.

## Scene / Cinematic Requirements

Experience mode and scene selection are state values, not scene objects.
```

---

## Acceptance criteria

```md
* Zustand configured for genuinely shared product/configuration/experience/scene/lighting/cart state
* local state remains local.
```

---

## Attachments

Place files in `attachments/` next to this `intake.md`, then list them here so the planner knows what to open.

| File (relative to this folder) | What it is |
| ------------------------------ | ---------- |
| *(e.g. `attachments/flow.png`)* | *(e.g. UX flow)* |

None. (Linear issue has no attachments or comments.)

---

## Dependencies

- **Blocked by / related ids:** 3DMODEL-21 (S0-02 — Establish Project Structure) — Done. Blocks 3DMODEL-10 (US-201 — Change Product Color) and 3DMODEL-13 (US-101 — Interactive 3D Furniture Product).
- **Depends on code areas or other stories:** `src/features/product-scene/scene-states.ts` (`SceneState` contract, 3DMODEL-16), `src/features/product-scene/ProductScene.tsx`, `src/data/products.ts`, `docs/ARCHITECTURE.md` (Lightweight shared state deferred to S0-08), `docs/ANIMATION.md` (Zustand ownership row: "Introduced in S0-08; not installed yet").

## Extra notes (optional)

Recorded human decisions (Stage 2, verbatim):

> 1 yes, install Zustand 5.0.15. 2a: implement only real shared state that exists today: the existing SceneState contract and selectedProductId. Do not create placeholder configuration, lighting, cart, or other state fields; document that those domains are added by their owning stories when real requirements exist. 3a: use src/state/ as the shared-state boundary, but create only files needed by the current implementation. 4a: use a shared module store for the current client-only requirements; do not introduce a provider/per-request store abstraction until server-derived or request-specific initialization actually requires it. Document that this boundary can be revisited if that requirement appears. 5a: wire ProductScene to consume the real scene state as a minimal runtime proof, without adding artificial UI solely to demonstrate Zustand. Keep runtime Three.js/R3F objects, controls, refs and GSAP timelines out of Zustand; store domain values/intent only. Stop again if another unresolved decision appears.

## Technical hints (optional)

- APIs, screens, services already discussed. Repos/roots: `.`. Primary language: `typescript`.

## Out of scope

- What this story explicitly does **not** cover (per recorded decision):
  - Placeholder configuration, lighting, cart, or other state fields (added by their owning stories when real requirements exist).
  - A provider / per-request store abstraction.
  - Artificial UI added solely to demonstrate Zustand.
  - Storing Three.js/R3F objects, controls, refs or GSAP timelines in Zustand.
  - Redux.

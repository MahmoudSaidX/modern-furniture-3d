# Story 04 — S0-08 Configure Lightweight Shared State (Story: 3DMODEL-15)

## Prerequisites

- Story 03 completed: [S0-07 — Establish Animation & Cinematic Architecture](../animation-architecture/03-story-3DMODEL-16.md) (3DMODEL-16) — `SCENE_STATES` / `SceneState` in `src/features/product-scene/scene-states.ts`, Zustand ownership row in `docs/ANIMATION.md`.
- Story 01 completed: [S0-05 — Establish 3D Technology Foundation](../3d-foundation/01-story-3DMODEL-18.md) — `ProductScene` and dev route `src/app/[lang]/dev/scene/page.tsx`.
- Human decisions recorded in `.squad/stories/shared-state/3DMODEL-15/intake.md` ("Extra notes") are binding.

---

## Story Goal

1. **Zustand configured** — `zustand` installed, pinned exact `5.0.15` (matching the exact pins for `gsap`/`next`/`react`).
2. **One shared module store** in `src/state/` holding only the shared state that exists today: the current `sceneState` (`SceneState`, initial `"PRODUCT"`) and `selectedProductId` (initial `stockholmChair.id`), plus their setters. Domain values only — no Three.js/R3F objects, controls, refs or GSAP timelines.
3. **Minimal runtime proof** — `ProductScene`'s `Model` reads `sceneState` from the store; the S0-07 intro timeline runs only while the state is `"PRODUCT"`. No new UI.
4. **Local state remains local** — documented rule; existing component-local state/refs untouched.
5. **Documentation** — `docs/ARCHITECTURE.md` and `docs/ANIMATION.md` updated: `src/state/` boundary, what belongs there, domains added by owning stories, module store revisitable when server-derived/request-specific init is needed.

**Not in scope:** configuration/lighting/cart/other placeholder fields, a provider or per-request store, middleware (persist/devtools), UI to change state, Redux.

---

## Context — Read These Files First

1. `.squad/stories/shared-state/3DMODEL-15/intake.md` — acceptance criteria, business rules, decisions, out of scope.
2. `src/features/product-scene/scene-states.ts` — `SceneState` union (line 5).
3. `src/data/products.ts` — `stockholmChair` (lines 10–20), `id: "stockholm-chair"` (line 11).
4. `src/features/product-scene/ProductScene.tsx` — `Model` (lines 19–47); `useGSAP` call (lines 28–40) with `{ dependencies: [controls], revertOnUpdate: true }`.
5. `docs/ARCHITECTURE.md` — "Lightweight shared state" under "Intended (not yet created)" (lines 83–87).
6. `docs/ANIMATION.md` — Zustand ownership row (line 20); Scene states paragraph (lines 39–41); Current implementation (end of file).
7. `node_modules/zustand/readme.md` (after install) — `create<T>()((set) => ({...}))` TypeScript form and selector usage.

---

## Implementation tasks

### 1 — Dependency

`npm install --save-exact zustand@5.0.15`. No other packages.

### 2 — Shared store

Create file: `src/state/experience-store.ts`

```ts
import { create } from "zustand";
import { stockholmChair } from "@/data/products";
import type { SceneState } from "@/features/product-scene/scene-states";

// Genuinely shared client state only: domain values, never Three.js/R3F
// objects, controls, refs or GSAP timelines (see docs/ARCHITECTURE.md).
type ExperienceState = {
  sceneState: SceneState;
  selectedProductId: string;
  setSceneState: (sceneState: SceneState) => void;
  selectProduct: (productId: string) => void;
};

export const useExperienceStore = create<ExperienceState>()((set) => ({
  sceneState: "PRODUCT",
  selectedProductId: stockholmChair.id,
  setSceneState: (sceneState) => set({ sceneState }),
  selectProduct: (selectedProductId) => set({ selectedProductId }),
}));
```

No `"use client"` directive needed (a module, not a component); only imported from client components.

### 3 — Runtime proof in the development scene

File: `src/features/product-scene/ProductScene.tsx`

- Import `useExperienceStore` from `"@/state/experience-store"`.
- In `Model`, read `const sceneState = useExperienceStore((state) => state.sceneState);` (atomic selector).
- In the `useGSAP` callback, return early unless `sceneState === "PRODUCT"` (before creating the timeline); add `sceneState` to `dependencies`.
- Update the comment: the intro plays in the `PRODUCT` scene state, read from the shared store.
- Do not store `groupRef`, `controls`, `scene` or `tl` in the store.

### 4 — Documentation

File: `docs/ARCHITECTURE.md` — move "Lightweight shared state" from "Intended (not yet created)" to "Established":

- **Lightweight shared state** (`src/state/`) — Zustand stores for genuinely shared client state (first: `experience-store.ts`: `sceneState`, `selectedProductId`). Store domain values/intent only; never Three.js/R3F objects, controls, refs or GSAP timelines. Local UI state stays in components (`useState`/refs). Configuration, lighting, cart and other domains are added by their owning stories when real requirements exist. A shared module store fits today's client-only needs; revisit (provider/per-request store) when server-derived or request-specific initialization is required. No Redux.

File: `docs/ANIMATION.md`:
- Zustand row: replace "_Introduced in S0-08; not installed yet._" with a pointer to `src/state/experience-store.ts`.
- Scene states paragraph: current state is stored as `sceneState` in the shared store.
- Current implementation: intro timeline runs only while `sceneState` is `PRODUCT`.

---

## Edge Cases & Failure Modes

- **SSR** — module store is shared across requests on the server; safe now because the store is only initialised with static values and only read in the client-only `ProductScene` (`"use client"`, inside `<Canvas>`). Documented as the revisit trigger.
- **`sceneState` changes while intro runs** → `revertOnUpdate: true` reverts the timeline when dependencies change; non-`PRODUCT` states create no timeline.
- **Strict Mode double-mount** → unchanged from S0-07; store state unaffected.
- **Locale** — store holds no locale/`dir`; 3D never mirrored. `/ar` identical.

---

## Test Plan

No test runner in `package.json`.

1. Smoke: `/en/dev/scene` — intro rotation plays (state `PRODUCT`), orbit interrupts, no console errors.
2. Smoke: navigate `/en/dev/scene` → `/en` — no errors.
3. Smoke: `/ar/dev/scene` — identical behavior.

---

## Verification Steps

1. **Static:** `npm run lint`, `npx tsc --noEmit`, `npm run build` (repo root).
2. **Frontend runs:** `npm run dev`; Test Plan 1–3.
3. **Regression:** `/en`, `/ar` home pages unchanged.

---

## Done Criteria

- [ ] `zustand` `5.0.15` exact in `dependencies`; no Redux.
- [ ] `src/state/experience-store.ts` holds only `sceneState`, `selectedProductId` and setters; no Three.js objects.
- [ ] `ProductScene` consumes `sceneState`; no new UI.
- [ ] Docs state local-state rule, domain ownership by later stories, and module-store revisit condition.

**STOP HERE. Report to the user and wait for confirmation before proceeding to the next story.**

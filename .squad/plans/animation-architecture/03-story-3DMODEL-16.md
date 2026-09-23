# Story 03 — S0-07 Establish Animation & Cinematic Architecture (Story: 3DMODEL-16)

## Prerequisites

- Story 01 completed: [S0-05 — Establish 3D Technology Foundation](../3d-foundation/01-story-3DMODEL-18.md) (3DMODEL-18) — `src/features/product-scene/ProductScene.tsx`, dev route `src/app/[lang]/dev/scene/page.tsx`.
- Story 02 completed: [S0-06 — Define 3D Asset Standards](../3d-asset-standards/02-story-3DMODEL-17.md) — precedent for a standalone `docs/*.md` linked from `docs/ARCHITECTURE.md`.
- Human decisions recorded in `.squad/stories/animation-architecture/3DMODEL-16/intake.md` ("Extra notes") are binding.

---

## Story Goal

1. **GSAP configured** — `gsap` and `@gsap/react` installed (pinned exact versions `3.15.0` / `2.1.2`, matching the repo's exact pins for `next`/`react`) and used via `useGSAP`.
2. **Scene states defined** — `PRODUCT`, `DETAIL`, `CUSTOMIZE`, `CONTEXT` as a small TypeScript contract in `src/features/product-scene/` (a const tuple + derived union type). No state-machine framework, no transitions, no store.
3. **Ownership documented** — `docs/ANIMATION.md` defines who owns what between React, R3F, GSAP and Zustand (Zustand documented only), plus timeline rules (small explicit timelines, interruption, cleanup). Linked from `docs/ARCHITECTURE.md`.
4. **Cleanup on unmount** — a minimal lifecycle proof in the development `ProductScene`: one small GSAP timeline that plays on mount, is killed when the user starts orbiting, and is reverted when the scene unmounts.

**Not in scope:** Zustand install/implementation (S0-08), final choreography, camera behavior, durations, easing or animation UX, UI-reveal animations, using the scene states at runtime.

---

## Context — Read These Files First

1. `.squad/stories/animation-architecture/3DMODEL-16/intake.md` — acceptance criteria, business rules, decisions, out of scope.
2. `src/features/product-scene/ProductScene.tsx` — `Model` (lines 13–16) renders `<primitive object={scene} />`; `<OrbitControls makeDefault />` (line 45) — `makeDefault` exposes the controls via `useThree((s) => s.controls)`.
3. `docs/ARCHITECTURE.md` — Product Scene bullet (lines 32–36), Public 3D assets link pattern (lines 37–41), "3D is never mirrored" (lines 65–70), Lightweight shared state deferred to S0-08 (lines 81–85).
4. `node_modules/@gsap/react/README.md` (after install) — `useGSAP(callback, { scope, dependencies })`, `contextSafe`, automatic `gsap.context()` revert on unmount.

---

## Implementation tasks

### 1 — Dependencies

`npm install --save-exact gsap@3.15.0 @gsap/react@2.1.2`. No other packages.

### 2 — Scene state contract

Create file: `src/features/product-scene/scene-states.ts`

```ts
// Cinematic scene states. A contract only: transitions and storage are
// defined by the stories that use them (see docs/ANIMATION.md).
export const SCENE_STATES = [
  "PRODUCT",
  "DETAIL",
  "CUSTOMIZE",
  "CONTEXT",
] as const;

export type SceneState = (typeof SCENE_STATES)[number];
```

Not imported by runtime code in this story.

### 3 — Lifecycle proof in the development scene

File: `src/features/product-scene/ProductScene.tsx`

- Import `useRef`, `gsap` from `"gsap"`, `useGSAP` from `"@gsap/react"`, `useThree` from `@react-three/fiber`, `Group` type from `three`.
- Register once at module scope: `gsap.registerPlugin(useGSAP);`.
- Wrap the model in a `<group ref={groupRef}>` inside `Model`, and inside `Model` call `useGSAP` (runs after the GLB resolves, since `Model` suspends until then):
  - build `const tl = gsap.timeline();` with **one** tween, `tl.from(groupRef.current.rotation, { y: -Math.PI / 4 })` (GSAP default duration/ease — explicitly a placeholder, not final choreography);
  - get `controls` from `useThree((s) => s.controls)`; if present, add a `"start"` listener that calls `tl.kill()` (user interaction interrupts), and return a cleanup that removes the listener;
  - `useGSAP` reverts the timeline automatically on unmount (context revert).
  - Pass `{ dependencies: [controls] }`.
- Add a short comment stating this is the S0-07 lifecycle proof (mount → interrupt → cleanup), not final cinematics.
- Must not read locale/`dir` (3D is never mirrored).

### 4 — Documentation

Create file: `docs/ANIMATION.md` with sections:

1. **Scope** — GSAP for cinematic/timeline animation; no custom animation framework.
2. **Ownership** — table:
   - **React** — component lifecycle: mounts/unmounts scenes; owns when timelines exist.
   - **R3F** — the three.js scene graph, render loop, per-frame work (`useFrame`), and controls; it owns objects that timelines tween.
   - **GSAP** — time-based interpolation of values on those objects via small explicit timelines (camera/target, model transform, environment/lighting, DOM UI reveal).
   - **Zustand** — (introduced in S0-08, not installed) the current scene state and user selections; timelines react to state, never own it.
   - Rule: one owner per animated property at a time — a property tweened by GSAP isn't also written in `useFrame` or by controls during the tween.
3. **Scene states** — the four states in `src/features/product-scene/scene-states.ts`; meaning (PRODUCT: product overview; DETAIL: focused product detail; CUSTOMIZE: configuring options; CONTEXT: product in environment); contract only, transitions defined by later stories; no state-machine framework.
4. **Timeline rules** — small explicit timelines per transition via `useGSAP`; user interaction can interrupt (kill) a timeline; all timelines/listeners cleaned up on unmount (`useGSAP` context revert + returned cleanup); timelines are locale-independent (3D never mirrored; DOM UI reveals follow `dir` naturally).
5. **Current implementation** — the lifecycle proof in `ProductScene`, marked as non-final.

File: `docs/ARCHITECTURE.md` — append to the Product Scene bullet (after line 36): a sentence that animation ownership, scene states and timeline rules are defined in [`ANIMATION.md`](ANIMATION.md).

---

## Edge Cases & Failure Modes

- **Controls not yet registered** (`controls` null on first render) → effect re-runs via `dependencies: [controls]`; timeline recreated, previous reverted by `useGSAP`. Acceptable for a proof.
- **User orbits during tween** → `"start"` fires → `tl.kill()`; model stays at its current rotation, no fight with controls (controls move the camera, not the group).
- **Unmount mid-tween** (navigate away) → `useGSAP` reverts; listener removed; no console errors.
- **React Strict Mode double-mount in dev** → `useGSAP` reverts on the simulated unmount; only one live timeline.
- **SSR** — `ProductScene` is `"use client"`; `useGSAP` uses isomorphic layout effect.

---

## Test Plan

No test runner exists in `package.json`; verification is static checks + runtime browser check.

1. Smoke (browser): `/en/dev/scene` — model rotates into place on load; no console errors.
2. Smoke: reload, drag immediately — rotation stops, orbit works.
3. Smoke: navigate from `/en/dev/scene` to `/en` mid-tween — no errors; `gsap.globalTimeline.getChildren().length` is 0 afterwards (dev console, if gsap is exposed) or no warnings.
4. `/ar/dev/scene` — identical scene behavior.

---

## Verification Steps

1. **Static:** `npm run lint`, `npx tsc --noEmit`, `npm run build` (repo root).
2. **Frontend runs:** `npm run dev`; check Test Plan 1–4.
3. **Regression:** `/en`, `/ar` home pages unchanged.

---

## Done Criteria

- [ ] `gsap` and `@gsap/react` in `dependencies` (exact pins); `useGSAP` used.
- [ ] `docs/ANIMATION.md` documents React/R3F/GSAP/Zustand ownership; linked from `docs/ARCHITECTURE.md`.
- [ ] Lifecycle proof timeline is killed on user interaction and reverted on unmount.
- [ ] `SCENE_STATES` / `SceneState` define PRODUCT/DETAIL/CUSTOMIZE/CONTEXT in `src/features/product-scene/scene-states.ts`.
- [ ] No Zustand, no state-machine library, no final choreography.

**STOP HERE. Report to the user and wait for confirmation before proceeding to the next story.**

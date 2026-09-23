# Story 08 — US-102 Cinematic Product Introduction (Story: 3DMODEL-12)

## Prerequisites

- Story 07 completed: [../interactive-product/07-story-3DMODEL-13.md](../interactive-product/07-story-3DMODEL-13.md) — Product Studio, `CameraRig`, `canonicalRef`, Zoom/Reset controls.
- Story 03 completed: [../animation-architecture/03-story-3DMODEL-16.md](../animation-architecture/03-story-3DMODEL-16.md) — GSAP + `useGSAP` rules in `docs/ANIMATION.md`.
- Human decision in `.squad/stories/cinematic-intro/3DMODEL-12/intake.md` ("Extra notes") is binding.

---

## Story Goal

Once the chair GLB has loaded, the Product Studio plays a short (~3 s) intro that the user can interrupt:

1. the camera starts at a **wide** pose and moves to the **canonical final framing**, which is the same pose Reset View uses;
2. the localized product **name** and **tagline** then fade in. The existing Zoom In / Zoom Out / Reset View controls stay **mounted, focusable and operable for the whole intro**: they are only visually subdued (reduced opacity), then brought to full opacity with the reveal;
3. pointer/touch or wheel input on the viewer, or **focusing** or activating Zoom In / Zoom Out / Reset View, **ends** the intro at once. The timeline is killed, the canonical pose is applied, the controls are synchronized, the UI is shown, and OrbitControls takes back the camera. The skip itself is not animated;
4. while the timeline runs, **GSAP is the only writer of the camera pose**. OrbitControls is suspended (see Task 4, "Camera ownership");
5. with `prefers-reduced-motion: reduce` there is no intro: the camera starts at the canonical pose and the UI shows immediately;
6. the intro plays at most once per mount.

**Not in scope:** price (US-203), animating page-level heading/caption, new dependencies, model changes.

---

## Context — Read These Files First

1. `src/features/product-scene/ProductScene.tsx`: `CANONICAL_DIRECTION` (~line 18), `CameraPose` (~line 22), `CameraRig` (~lines 45–92, a `useEffect` that computes `canonicalRef` and applies it once on first framing), `Model` (~lines 94–112), `resetView` (~lines 143–157), the controls group (~lines 177–187).
2. `src/data/products.ts`: `Product` type (`name`, `description`).
3. `src/app/[lang]/page.tsx` and `src/app/[lang]/dev/scene/page.tsx`: both render `<ProductScene labels={dict.scene} />`.
4. `docs/ANIMATION.md`: Ownership, Timeline rules (one writer per property, interruptible, `useGSAP` cleanup, `contextSafe`, locale-independent), and "Current implementation".
5. `node_modules/@gsap/react/README.md`: `useGSAP` config (`scope`) and `contextSafe`.
6. `node_modules/three-stdlib/controls/OrbitControls.js`: every input handler returns early when `scope.enabled === false` (~lines 616, 630, 705, 726, 735, 817), so a disabled control neither moves the camera nor dispatches `start`. `update()` itself does not check `enabled`, so `applyPose` can still sync a disabled control. `node_modules/@react-three/drei/core/OrbitControls.js` ~line 30: Drei's per-frame loop is `if (controls.enabled) controls.update()`, so disabling also stops per-frame updates and damping.

---

## Implementation tasks

### 1 — Product tagline

File: `src/data/products.ts`: add `tagline: LocalizedText` to `Product`. On `stockholmChair`, set `tagline: { en: "Designed for quiet moments.", ar: "صُمم للحظات الهادئة." }`.

### 2 — ProductScene props

File: `src/features/product-scene/ProductScene.tsx`: change the props to `{ labels: Dictionary["scene"]; name: string; tagline: string }`. The strings arrive already localized, so the scene never reads the locale.

Files: `src/app/[lang]/page.tsx` and `src/app/[lang]/dev/scene/page.tsx`: pass `name={stockholmChair.name[locale]}` and `tagline={stockholmChair.tagline[locale]}`. The dev page adds `getLocale` and the `stockholmChair` import. The page-level heading, caption and article stay as they are.

### 3 — Shared canonical pose contract

In `ProductScene.tsx`:

- Add `applyPose(controls, pose)`, taken from the body of `resetView`: flush damping with damping off, copy `pose.position`/`pose.target`, `update()`, then restore damping. **Every** path to the final framing calls it: intro completion, intro skip, reduced-motion start, and Reset View. `resetView` becomes `finishIntro(); applyPose(...)`.
- `CameraRig`: change `useEffect` to **`useLayoutEffect`** so `canonicalRef` is set before `CinematicIntro`'s `useGSAP` (also a layout effect, in a later sibling) runs. Nothing else changes.

### 4 — CinematicIntro (new component in the same file, rendered in `Model` after `CameraRig`)

Props: `controlsRef`, `canonicalRef`, `copyRef` (the name/tagline block), `controlsUiRef` (the controls group), `finishRef: RefObject<(() => void) | null>`, `playedRef: RefObject<boolean>` (refs owned by `ProductScene`).

```ts
const INTRO_SECONDS = 3;           // within 2–4 s
const UI_REVEAL_AT = 2.2;          // UI reveal over the last 0.8 s
const SUBDUED_CONTROLS_OPACITY = 0.5;
const WIDE_DISTANCE_FACTOR = 1.6;  // × canonical distance, < maxDistance (2 × fit)
const WIDE_AZIMUTH_OFFSET = -0.35; // rad; same polar angle, so within the polar limits
```

#### Camera ownership

- **While the intro runs, `controls.enabled = false`.** This is the concrete way OrbitControls is stopped from writing the camera. Every three-stdlib input handler returns early, so there is no rotate, zoom, pan or `start`. Drei's per-frame `controls.update()` is skipped because it is guarded by `controls.enabled`, so damping never runs. The GSAP tween's `onUpdate` is then the only code that writes `camera.position`. The target is not tweened; it stays at the canonical target set by `CameraRig`.
- **Detecting intent while the controls are disabled** is done with DOM capture listeners on the `ProductScene` root `div`, not with OrbitControls events. That means `onPointerDownCapture` (mouse, pen and touch, since three-stdlib uses pointer events) and `onWheelCapture`. On the controls group it means `onFocusCapture` plus each button's `onClick`. React's capture handlers run before the canvas's own `pointerdown`/`wheel` listeners, so `finish()` re-enables the controls before OrbitControls sees the event, and the same gesture carries straight on as a normal orbit or zoom.
- **Handoff**, in order, in `finish()`, whether the intro is interrupted or completes on its own:
  1. `tl.kill()`;
  2. `applyPose(controls, canonicalRef.current)`: damping-off flush, copy the pose, `controls.update()` to synchronize the controls' internal spherical state with the pose, restore damping;
  3. show the UI at its final state (`gsap.set`);
  4. `controls.enabled = true`, which makes OrbitControls the only interactive owner again;
  5. `playedRef.current = true`.

#### useGSAP

In `useGSAP((ctx, contextSafe) => { … })`:

- `finish = contextSafe(() => { … handoff above … })`. Assign `finishRef.current = finish`. The steps are idempotent, so calling it more than once is harmless.
- If `playedRef.current` is set, `canonicalRef.current` is null, or `matchMedia("(prefers-reduced-motion: reduce)").matches`, call `finish()` and return. This gives reduced motion the canonical pose, with the UI final immediately.
- Otherwise:
  - set `controls.enabled = false`;
  - `gsap.set(copyRef.current, { autoAlpha: 0, y: 8 })` and `gsap.set(controlsUiRef.current, { opacity: SUBDUED_CONTROLS_OPACITY })`. Opacity only: the controls keep `visibility` and `display`, stay in the tab order and are never disabled;
  - convert the canonical offset (`position − target`) to a `Spherical` and make a wide copy (`radius × WIDE_DISTANCE_FACTOR`, `theta + WIDE_AZIMUTH_OFFSET`), then write it to the camera once before the first tick.
- Timeline:
  - proxy `{ t: 0 → 1 }` over `INTRO_SECONDS`, `ease: "power2.inOut"`. `onUpdate` interpolates radius and theta from wide to **the current `canonicalRef`**, which is read each tick so a resize ends on the Reset framing. It then writes `camera.position = target + spherical` and `camera.lookAt(target)`, because `controls.update()` is not running;
  - at `UI_REVEAL_AT`, over 0.8 s: `copyRef` to `{ autoAlpha: 1, y: 0 }` and `controlsUiRef` to `{ opacity: 1 }`;
  - `onComplete: finish`.
- Cleanup (returned from the callback, and on revert): `controls.enabled = true`, so an unmount mid-intro never leaves the controls disabled.

#### Overlay (DOM, in `ProductScene`)

- The name/tagline block `ref={copyRef}` sits at `absolute top-4 inset-s-4 text-start` and uses `<p>` elements, since the page already has an `h2`. It is non-interactive, so it may stay hidden (`invisible opacity-0` class, raised with `autoAlpha`) until the reveal. It carries `aria-hidden` only while hidden, which GSAP's `autoAlpha` handles through `visibility`.
- The controls group `ref={controlsUiRef}` keeps its current markup and position, with no `invisible` class. During loading it stays fully visible, as today; only the intro subdues it.

#### Interruption wiring in `ProductScene`

- `const finishIntro = () => finishRef.current?.()`.
- Root `div`: `onPointerDownCapture={finishIntro}` and `onWheelCapture={finishIntro}`.
- Controls group: `onFocusCapture={finishIntro}`. Keyboard focus reaching any control ends the intro and reveals the final UI.
- Zoom In / Zoom Out `onClick`: `finishIntro(); zoomBy(…)`. Reset: `finishIntro(); applyPose(…)`.

### 5 — Docs

- `docs/ANIMATION.md` "Current implementation": describe the US-102 intro timeline in `CinematicIntro`, what interrupts it, the reduced-motion skip, and the shared `applyPose` contract with Reset.
- `docs/ARCHITECTURE.md` Product Scene bullet: one sentence noting the scene overlay (name/tagline/controls) and the intro.

---

## Required plan coverage

- **Files:** `src/features/product-scene/ProductScene.tsx`, `src/data/products.ts`, `src/app/[lang]/page.tsx`, `src/app/[lang]/dev/scene/page.tsx`, `docs/ANIMATION.md`, `docs/ARCHITECTURE.md`, intake, this plan, `cinematic-intro/00-overview.md`, `00-index.md`. Dictionaries unchanged (the tagline is product data, like `name`).
- **State:** no Zustand changes. Local refs only: `finishRef`, `playedRef`, `copyRef` and `controlsUiRef` in `ProductScene`; `controls.enabled` is toggled only by `CinematicIntro`. Camera state stays out of the store.
- **3D.** **Camera:** wide pose (1.6× distance, −0.35 rad azimuth, same polar angle) moving to the canonical pose (same as Reset) over 3 s, `power2.inOut`. **Model/assets:** `stockholm-chair.glb` unchanged; no model motion, because the "subtle movement" is the camera sweep. **Environment and lighting:** unchanged. **Timelines:** one GSAP timeline in `CinematicIntro` via `useGSAP`, reverted on unmount. **Camera ownership:** GSAP is the only writer while `controls.enabled = false`; OrbitControls takes over after `finish()` (Task 4).
- **RTL / LTR:** name and tagline are localized product data; overlay positions use logical `inset-s`/`inset-e` and `text-start`. The timeline never reads the locale or `dir`, and the camera path is identical in `/en` and `/ar`.
- **Performance:** no new dependency. GSAP is already installed and was unused in src. The GSAP ticker runs for 3 s. The intro starts only after the GLB resolves (it sits inside the `Model` Suspense), so it never delays loading, and input ends it at once.
- **Tests & verification:** see below.
- **Risks:**
  - Layout-effect ordering: if `CameraRig` has not set `canonicalRef`, the intro would start with no target. The intro guards on `canonicalRef.current` and calls `finish()` when it is null.
  - Strict Mode double mount in dev: `useGSAP` reverts the context and runs the callback again, which rebuilds the intro from t=0 in the same frame. This isn't visible and doesn't happen in production.
  - Controls left disabled: if `finish()` is never reached, input would be dead. Caught by the capture listeners (pointer, wheel, focus, click all call `finish()`), `onComplete`, and the cleanup that re-enables on unmount.
  - Capture ordering: if React's capture handler ran after OrbitControls' listener, the first gesture would be dropped, but never stuck, because the intro still ends. Verified in the browser: a drag started mid-intro keeps orbiting.
- **Out of scope & deferred:** price (US-203); page-level reveal; replacement reduced-motion animation.

---

## Edge Cases & Failure Modes

- **Input during loading:** `finishRef` is null and OrbitControls is enabled, as in US-101; the intro then plays after load.
- **Keyboard only:** Tab reaches the (subdued) controls at any time; `onFocusCapture` ends the intro, restores the pose and reveals the full UI.
- **Input mid-intro:** `finish` kills the timeline, applies the canonical pose exactly and reveals the UI. No tween.
- **Reset or zoom during the intro:** the intro finishes first, then the action runs. Reset leaves the camera at the canonical pose; zoom works from the canonical pose.
- **Resize mid-intro:** `onUpdate` reads the recomputed `canonicalRef`, so the end pose matches Reset.
- **Reduced motion:** there is no timeline; the pose and UI appear immediately.
- **Replay:** `playedRef` stays true for the mount, so the intro never restarts.
- **Unmount mid-intro:** `useGSAP` reverts the timeline and the cleanup removes the controls listener.

---

## Test Plan

There is no test framework in the repo. Verification is manual in the browser (below).

---

## Verification Steps

1. **Static:** `npm run lint`, `npx tsc --noEmit`, `npm run build`.
2. **Browser (`npm run dev`)** on `/en` and `/ar` at 390×844 and 1440×900:
   - the intro plays after loading and lasts about 3 s, moving from wide to final;
   - the UI fades in at the end with the localized name/tagline at the inline start and the controls at the inline end;
   - dragging, wheel, Tab-focusing a control and each button mid-intro jump straight to the final state, and a drag started mid-intro continues as an orbit;
   - the final pose after the intro equals the pose after Reset (compare camera position in devtools);
   - with reduced motion emulated in DevTools, there is no intro;
   - no console errors.
3. **Regression:** Zoom/Reset and the orbit limits behave as in US-101; `/en/dev/scene` renders.

---

## Done Criteria

- [ ] Intro starts only after the GLB is ready.
- [ ] Wide-to-final camera move ends at the canonical pose shared with Reset.
- [ ] Coordinated UI reveal: localized name, tagline and controls; no price.
- [ ] Interruptible by pointer/touch, wheel, and focusing or activating the three buttons; the skip is not animated.
- [ ] Controls are focusable and operable throughout the intro (subdued only, never hidden or disabled).
- [ ] OrbitControls is disabled while the timeline runs (GSAP is the only camera writer) and re-enabled after the pose is synced.
- [ ] About 3 s long.
- [ ] Reduced motion skips the intro.
- [ ] No restart within the same mount; no new dependency; 3D not mirrored.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 09.**

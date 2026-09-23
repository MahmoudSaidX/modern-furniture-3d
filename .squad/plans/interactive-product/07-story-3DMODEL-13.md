# Story 07 — US-101 Interactive 3D Furniture Product (Story: 3DMODEL-13)

## Prerequisites

- Story 01 completed: [../3d-foundation/01-story-3DMODEL-18.md](../3d-foundation/01-story-3DMODEL-18.md) — `ProductScene`, R3F/Drei, `stockholm-chair.glb`.
- Story 03 ([../animation-architecture/03-story-3DMODEL-16.md](../animation-architecture/03-story-3DMODEL-16.md)) and Story 04 ([../shared-state/04-story-3DMODEL-15.md](../shared-state/04-story-3DMODEL-15.md)) completed.
- Human decision in `.squad/stories/interactive-product/3DMODEL-13/intake.md` ("Extra notes") is binding.

---

## Story Goal

The home page `/[lang]` shows a customer-facing Product Studio for the Stockholm Chair:

1. localized loading state while the GLB loads;
2. drag to rotate, wheel/pinch to zoom (mouse and touch), plus localized, accessible **Zoom In**, **Zoom Out**, **Reset View** buttons;
3. constrained camera: 360° azimuth, no pan, never below the floor, limited polar range, min/max zoom derived from the model's bounds;
4. responsive framing: the canonical view fits the model to the current viewport aspect;
5. premium neutral studio: light neutral background, soft lights, local lightformers, soft contact shadows.

**Not in scope:** product routing, GLB changes, cinematic intro (US-102), configuration state (US-201/202), new dependencies.

---

## Context — Read These Files First

1. `src/features/product-scene/ProductScene.tsx` — whole file (~84 lines): `Model` with the S0-07 `useGSAP` rotation (~lines 20–48), `LoadingOverlay` (~lines 51–60), `ProductScene` canvas (~lines 63–84).
2. `src/app/[lang]/page.tsx` — home page (server component; `getDictionary`, `getLocale`, `stockholmChair`).
3. `src/app/[lang]/dev/scene/page.tsx` — dev route rendering `ProductScene loadingLabel={dict.scene.loading}`.
4. `src/i18n/dictionaries/en.ts`, `ar.ts` — `scene` block.
5. **Controls API actually used:** Drei's `<OrbitControls>` wraps **`three-stdlib`** (`node_modules/@react-three/drei/core/OrbitControls.js` line 4), not `three/examples`. `node_modules/three-stdlib/controls/OrbitControls.js`: `minPolarAngle`/`maxPolarAngle` clamp `spherical.phi` in `update()` (~line 215; phi measured from +Y: 0 = straight down onto the product, π/2 = level with the target); `enableDamping` defaults `false` in the class (~line 42) but Drei sets it `true`; damping carries `sphericalDelta` into later `update()` calls (~lines 191–235); `saveState()`/`reset()` ~lines 159–171 restore `target0`/`position0`. The type to import is `OrbitControls` from `three-stdlib` (as `drei/core/OrbitControls.d.ts` line 3 does), **not** `three/addons/…` as the current file does.
6. `docs/ARCHITECTURE.md` (scene copy rule, 3D never mirrored, store holds no controls), `docs/ANIMATION.md` (Current implementation paragraph), `docs/3D-ASSETS.md` (front faces +Z).

---

## Implementation tasks

### 1 — Dictionaries

Files: `src/i18n/dictionaries/en.ts`, `ar.ts` — add under `scene`:

```ts
controls: {
  label: "Camera controls",       // ar: "عناصر التحكم في الكاميرا"
  zoomIn: "Zoom in",              // ar: "تكبير"
  zoomOut: "Zoom out",            // ar: "تصغير"
  reset: "Reset view",            // ar: "إعادة ضبط العرض"
},
```

### 2 — ProductScene

File: `src/features/product-scene/ProductScene.tsx`:

- **Remove** the `useGSAP` block, `gsap` imports/registration, `groupRef`, `controls`/`sceneState` reads and the store import from `Model` (Q6-A). `Model` renders `<primitive object={scene} />` and reports its bounds.
- **Props:** `{ labels: Dictionary["scene"] }` replaces `loadingLabel` (uses `labels.loading` and `labels.controls`).
- **Studio:** `<color attach="background" args={["#f4f2ee"]} />`; keep ambient + directional + the three local `Lightformer`s (soften directional to ~1); add `<ContactShadows position={[0, 0, 0]} opacity={0.4} blur={2.5} far={1} />` sized from model bounds (`scale` = 2 × footprint). Wrapper `div` gets the same neutral background class so the page and canvas match.
- **Camera rig** — new component `CameraRig` inside the `Suspense` with the model (runs only after the GLB loads). Receives `controlsRef` and a `canonicalRef` (`useRef<{ position: Vector3; target: Vector3 } | null>`) owned by `ProductScene`; both are component refs, never Zustand.
  - **Bounds:** `new Box3().setFromObject(scene)` → `center`; `getBoundingSphere` → radius `r`. Computed once per loaded scene (`useMemo` on `scene`).
  - **Fit distance (responsive framing):** `fit = r / Math.sin(fovFit / 2)` where `fovFit` is the camera's vertical fov (radians), or the horizontal fov `2·atan(tan(vfov/2)·aspect)` when `aspect < 1`. Recomputed when `useThree(state => state.size)` changes.
  - **Limits** (set on the controls instance in the same effect): `target` ← `center`; `minDistance = r * 1.2` (camera stays outside the bounding sphere); `maxDistance = fit * 2`; `enablePan = false`; azimuth unbounded (`minAzimuthAngle`/`maxAzimuthAngle` left at ±Infinity → 360° orbit).
  - **Vertical constraint, in polar-angle terms** (phi from +Y around `center`): `minPolarAngle = Math.PI / 6` (30° from vertical — a useful elevated, looking-down view without going fully top-down) and `maxPolarAngle = (5 * Math.PI) / 12` (75° from vertical, i.e. 15° above the horizontal through `center`). Because `maxPolarAngle < π/2` and `center.y > 0` (origin floor-centre per `docs/3D-ASSETS.md`), the camera is always above the target's height and therefore above the floor/product base — it can never orbit beneath it.
  - **Canonical pose:** direction `new Vector3(0.6, 0.35, 1).normalize()` (front three-quarter from **+Z**, since the asset's front faces +Z; polar ≈ 73°, inside the range) × `fit`, from `center`. Stored in `canonicalRef` as `{ position, target: center }`.
  - **First load:** after computing, apply the canonical pose (copy into `camera.position` and `controls.target`, `controls.update()`). Reset reads `canonicalRef`, so it restores exactly this pose; `controls.reset()`/`saveState()` are **not** used.
  - **Resize:** recompute `fit`, limits and `canonicalRef` only; the camera is **not** moved (an actively positioned camera stays where the user left it; OrbitControls clamps its distance to the new min/max on the next `update()`). The next Reset uses the recomputed pose.
- **Controls access for DOM buttons:** `ProductScene` owns `controlsRef = useRef<OrbitControlsImpl>(null)` (type from `three-stdlib`) and passes it to `<OrbitControls ref={controlsRef} makeDefault enablePan={false} />` and to `CameraRig`.
- **Button zoom — explicit distance, not `dollyIn`/`dollyOut`:** `three-stdlib` does expose `dollyIn(scale)`/`dollyOut(scale)`, but they only multiply an internal scale consumed by `update()` and interact with damping; instead use a supported, deterministic approach: helper `zoomBy(factor)` —
  ```ts
  const c = controlsRef.current;
  if (!c) return;
  const offset = c.object.position.clone().sub(c.target);
  const next = MathUtils.clamp(
    offset.length() * factor,
    c.minDistance,
    c.maxDistance,
  );
  c.object.position.copy(c.target).addScaledVector(offset.normalize(), next);
  c.update();
  ```
  Zoom In = `zoomBy(0.8)`, Zoom Out = `zoomBy(1.25)`; distance always within `minDistance`/`maxDistance`.
- **Reset View:** `const pose = canonicalRef.current; if (!c || !pose) return;` Leftover drag momentum (`sphericalDelta`, decayed only while damping is on) would otherwise drift the camera off the pose, and with damping off `update()` applies the full residual then zeroes it (`three-stdlib` ~lines 191–238). So: save `const damping = c.enableDamping`; set `c.enableDamping = false`; `c.update()` (flushes and zeroes the residual); copy `pose.position` → `c.object.position` and `pose.target` → `c.target`; `c.update()`; restore `c.enableDamping = damping`. Result is exactly the canonical pose. Camera only — no store or product/configuration writes.
- **CameraControls overlay** (DOM, inside wrapper): `<div role="group" aria-label={labels.controls.label} className="absolute bottom-4 end-4 flex gap-2">` with three `<button type="button">`: `+` (`aria-label={labels.controls.zoomIn}`), `−` (`aria-label={labels.controls.zoomOut}`), and the visible text `labels.controls.reset`. Min 44×44 px, visible focus ring. Logical `end-4` so it follows `dir`; the canvas is never flipped.
- **Loading overlay:** unchanged behavior (`useProgress` + `role="status"`), fed `labels.loading`.
- **No store writes** anywhere in the scene (camera stays out of Zustand; configuration untouched).

### 3 — Home page

File: `src/app/[lang]/page.tsx` — insert a Product Studio section before the product `article`: `<section className="h-[60vh] w-full max-w-5xl sm:h-[70vh]"><ProductScene labels={dict.scene} /></section>`. Remaining copy unchanged.

### 4 — Dev route

File: `src/app/[lang]/dev/scene/page.tsx` — pass `labels={dict.scene}` (prop rename only).

### 5 — Docs

File: `docs/ANIMATION.md` — replace "Current implementation" paragraph: no timelines yet; the S0-07 proof was removed in US-101 and the intro belongs to US-102. `docs/ARCHITECTURE.md` — Product Scene bullet: now a customer-facing Product Studio rendered on `/[lang]` (constrained orbit, DOM camera controls); camera state is local, never in Zustand.

---

## Required plan coverage

- **Files:** `src/features/product-scene/ProductScene.tsx`, `src/app/[lang]/page.tsx`, `src/app/[lang]/dev/scene/page.tsx`, `src/i18n/dictionaries/en.ts`, `ar.ts`, `docs/ANIMATION.md`, `docs/ARCHITECTURE.md`, intake, plan, overview, index.
- **State:** none added; camera state lives in OrbitControls/ref; `experience-store.ts` unchanged and no longer read by `ProductScene`.
- **3D — camera:** bounds-derived fit distance, min/max distance, polar range [π/6, 5π/12], no pan, canonical +Z three-quarter pose stored in a ref and used by first load and Reset (Task 2). **Model/assets:** `stockholm-chair.glb` unchanged. **Environment:** neutral background + local lightformers, no HDR. **Lighting:** ambient + softened directional + lightformers; contact shadows. **Timelines:** S0-07 GSAP rotation removed; none added.
- **RTL / LTR:** control labels from dictionaries; overlay positioned with `end-4`; canvas/camera identical in `/en` and `/ar`.
- **Performance:** no new dependency; `ContactShadows` default renders every frame — set `frames={1}` (static model) to render once. GLB size remains the documented exception (US-601).
- **Tests & verification:** see below.
- **Risks:** damping momentum after a drag could drift the camera during Reset — handled by flushing it with damping off before applying the pose; wrong controls type import (`three/addons` vs `three-stdlib`) — fixed in Task 2; resize before load (rig runs only after load); `gsap` packages become unused in src — they stay (US-102 needs them), no dependency change.
- **Out of scope & deferred:** as in Story Goal.

---

## Edge Cases & Failure Modes

- **Load in progress:** `canonicalRef` is `null` → Reset is a no-op; zoom works and clamps against the default limits.
- **Resize while the user is positioned:** camera not moved; limits updated; distance clamped by OrbitControls on its next `update()`.
- **Portrait mobile:** horizontal fov used for fit distance so the chair isn't cropped.
- **Zoom beyond limits:** `zoomBy` clamps with `MathUtils.clamp` to `minDistance`/`maxDistance`; gestures are clamped by OrbitControls itself.
- **Unmount:** R3F disposes the canvas; Drei `useGLTF` cache retained (existing behavior); no listeners added outside R3F.

---

## Test Plan

No test framework in the repo; verification is manual/browser (below).

---

## Verification Steps

1. **Static:** `npm run lint`, `npx tsc --noEmit`, `npm run build`.
2. **Browser (`npm run dev`):** `/en` and `/ar` at 390×844 and 1440×900 — loading text appears then the chair; drag rotates 360°; wheel zooms and stops at limits; vertical orbit stops between ~30° and ~75° from vertical and never goes under the floor; Reset returns to the same pose as the initial view after rotating, zooming and resizing; no pan (right-drag); Zoom In/Out/Reset work, keyboard-focusable, labels localized; controls sit at the inline end; scene identical in both locales; no console errors.
3. **Regression:** `/en/dev/scene` still renders; store values unchanged after interaction.

---

## Done Criteria

- [ ] Model loads with a localized loading state.
- [ ] Rotate, zoom, reset via gestures and localized buttons.
- [ ] Mouse and touch both work.
- [ ] Camera constrained (360° azimuth, no pan, above floor, bounds-derived zoom).
- [ ] Framing fits the model at mobile and desktop.
- [ ] Neutral studio with soft shadows; S0-07 rotation removed; no Zustand writes; no new dependency.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 08.**

# Story 09 — US-103 Product Detail Focus (Story: 3DMODEL-11)

## Prerequisites

- Story 07 completed: [../interactive-product/07-story-3DMODEL-13.md](../interactive-product/07-story-3DMODEL-13.md) — `CameraRig`, full-product limits, Zoom/Reset controls.
- Story 08 completed: [../cinematic-intro/08-story-3DMODEL-12.md](../cinematic-intro/08-story-3DMODEL-12.md) — `applyPose`, `CinematicIntro`, `finishIntro`, overlay `copyRef` / `controlsUiRef`.
- Human decisions 1–5 in `.squad/stories/product-detail-focus/3DMODEL-11/intake.md` ("Extra notes") are binding. Decision 4 (Stage 4, verbatim in the run state and summarised below) chose per-region orbit limits with a no-snap interruption. Decision 5 (plan review) removed the `sceneState` writes and approved the group label and the Reset behaviour.

---

## Story Goal

The Product Studio gains four **inspection regions**: Fabric, Cushion, Frame and Legs. They are visual camera regions over the single-mesh GLB, not model parts.

1. Four region buttons at the **bottom inline-start**. Selecting one runs a controlled camera move (target and position) from the **current** view to that region's focus pose. On arrival, the region's own zoom and orbit limits apply, and the view holds until another region or Reset.
2. The product **name** stays in the top overlay. While a region is active, the **tagline** is replaced by the region's localized name and sentence, announced with `aria-live="polite"`. The active button carries `aria-pressed="true"`.
3. **Region → region** moves go directly between the two views.
4. **Reset** exits inspection mode. It clears the region, restores the tagline and the US-101 limits, and returns smoothly to the shared canonical pose. With no region active, Reset stays instant, as in US-101.
5. **Reduced motion:** focus and reset poses are applied immediately, with no tween.
6. **Interruption during a move** (pointer, touch, wheel, Zoom In, Zoom Out): the timeline is killed at the exact current pose, **with no snap or clamp**. The region and its copy stay active; OrbitControls takes over with current-pose-safe limits. The next region selection starts a new move; Reset still exits.

**Not in scope:** GLB changes, part highlighting, materials, pricing, new dependencies.

---

## Context — Read These Files First

1. `src/features/product-scene/ProductScene.tsx`:
   - `CameraPose` (~line 35), `applyPose` (~lines 43–54), `CameraRig` (~lines 71–116: it sets `minDistance`, `maxDistance`, polar limits and `canonicalRef` in a layout effect that **re-runs on resize**);
   - `CinematicIntro` (~lines 118–196), `ProductScene` (~lines 225–334): `finishIntro`, `zoomBy`, `resetView`, the root capture listeners, the `copyRef` overlay (~lines 293–296) and the controls group (~lines 297–332).
2. `src/data/products.ts`: `Product`, `stockholmChair`.
3. `src/app/[lang]/page.tsx` and `src/app/[lang]/dev/scene/page.tsx`: both render `<ProductScene labels name tagline />`.
4. `src/i18n/dictionaries/en.ts` / `ar.ts`: the `scene.controls` block.
5. `src/state/experience-store.ts` and `src/features/product-scene/scene-states.ts`: read only, to confirm they stay **unchanged**. US-103 does not write `sceneState` (decision 5).
6. `node_modules/three-stdlib/controls/OrbitControls.js` ~lines 181–240: `update()` converts the offset to a `Spherical` (theta = `atan2(x, z)` in [−π, π]). It clamps theta to `[minAzimuthAngle, maxAzimuthAngle]` (with the `min <= max` branch when both are finite), phi to the polar limits and radius to `[minDistance, maxDistance]`, then writes `position` and calls `lookAt(target)`. Any limit that excludes the current pose therefore moves the camera on the next `update()`. `node_modules/@react-three/drei/core/OrbitControls.js` ~line 30: the per-frame `update()` runs only when `controls.enabled`.
7. `node_modules/@gsap/react/README.md`: `const { contextSafe } = useGSAP()` for tweens created in event handlers.
8. `docs/ANIMATION.md` "Current implementation"; `docs/3D-ASSETS.md` "Current deviations" (the addressable-parts row).

---

## Product rules (from story and decisions)

- Region identity, localized copy, focus pose, target and limits live in **product data**, not in the component.
- The approved copy is used verbatim; there are no material or construction claims.
- 3D coordinates are never mirrored; RTL changes only logical DOM positions.

---

## Implementation tasks

### 1 — Region data

File: `src/data/products.ts`: add these types:

```ts
type Vec3 = [number, number, number];

// Camera view of one inspection region, in world meters/radians. Angles use
// OrbitControls' spherical convention around `target`: azimuth = atan2(x, z)
// (0 = front, +Z), polar measured from +Y.
export type FocusCamera = {
  target: Vec3;
  distance: number;
  azimuth: number;
  polar: number;
  // Inspection limits, applied once the camera arrives.
  minDistance: number;
  maxDistance: number;
  minAzimuth: number;
  maxAzimuth: number;
  minPolar: number;
  maxPolar: number;
};

export type FocusRegion = {
  // Stable internal identifier; never translated.
  id: "fabric" | "cushion" | "frame" | "legs";
  name: LocalizedText;
  description: LocalizedText;
  camera: FocusCamera;
};
```

- Add `focusRegions: FocusRegion[]` to `Product`, with a comment: these are **visual inspection regions**, and the GLB has no semantic part nodes (see `docs/3D-ASSETS.md`).
- Add the four entries on `stockholmChair` with the approved copy, verbatim:

| id        | name EN / AR      | description EN                                    | description AR                                 |
| --------- | ----------------- | ------------------------------------------------- | ---------------------------------------------- |
| `fabric`  | Fabric / القماش   | "Explore the upholstery across the backrest."     | "استكشف تفاصيل التنجيد على امتداد مسند الظهر." |
| `cushion` | Cushion / الوسادة | "Explore the details of the seat cushion."        | "استكشف تفاصيل وسادة المقعد."                  |
| `frame`   | Frame / الهيكل    | "Explore the structure along the sides and back." | "استكشف تفاصيل الهيكل على الجانبين والظهر."    |
| `legs`    | Legs / الأرجل     | "Explore the chair's lower structure and legs."   | "استكشف الجزء السفلي من الهيكل والأرجل."       |

**Starting camera values.** These are tuned during implementation with the browser check in Verification step 2, and changed **only in this data**. The bounds used are X ±0.337, Y 0–0.85, Z ±0.444, with the front at +Z.

| id        | target            | distance | azimuth | polar | distance range | azimuth range | polar range |
| --------- | ----------------- | -------- | ------- | ----- | -------------- | ------------- | ----------- |
| `fabric`  | [0, 0.62, −0.28]  | 0.7      | 0.25    | 1.15  | 0.55–0.95      | −0.45 – 0.85  | 0.9 – 1.3   |
| `cushion` | [0, 0.42, 0.08]   | 0.75     | 0.35    | 0.87  | 0.6–1.0        | −0.6 – 1.1    | 0.6 – 1.15  |
| `frame`   | [0.3, 0.45, −0.1] | 0.7      | 1.77    | 1.24  | 0.55–0.95      | 1.3 – 2.3     | 1.0 – 1.3   |
| `legs`    | [0, 0.18, 0.2]    | 0.75     | 0.54    | 1.27  | 0.6–1.0        | 0.0 – 1.1     | 1.05 – 1.3  |

**Data invariants.** State them in a comment and check them in Verification:

- every value lies inside its own range;
- polar ranges stay within the US-101 range [π/6, 5π/12], so the camera is always above the target and the floor;
- azimuth ranges stay within (−π, π) without wrapping.

"Safe" means that anywhere inside the region's limits, the camera sees no geometry clipping or near-plane cuts, and the view is usable at 390×844 and 1440×900.

### 2 — Localized props and a label

- Files `src/app/[lang]/page.tsx` and `src/app/[lang]/dev/scene/page.tsx`: pass `regions={stockholmChair.focusRegions.map((r) => ({ id: r.id, name: r.name[locale], description: r.description[locale], camera: r.camera }))}`. This is plain serializable data, so the scene never reads the locale.
- Files `src/i18n/dictionaries/en.ts` / `ar.ts`: add `scene.focus.label`, the accessible name of the region group: EN "Product details", AR "تفاصيل المنتج". Approved (decision 5).

### 3 — Constraints helpers (in `ProductScene.tsx`)

```ts
type CameraLimits = {
  minDistance: number;
  maxDistance: number;
  minAzimuth: number;
  maxAzimuth: number;
  minPolar: number;
  maxPolar: number;
};

function applyLimits(controls: OrbitControlsImpl, l: CameraLimits) {
  /* set the six controls fields */
}

// Widens `l` just enough to contain the camera's current spherical offset, so
// the next update() changes nothing (no snap). A range that would reach 2π
// becomes unbounded.
function widenToCurrent(
  controls: OrbitControlsImpl,
  l: CameraLimits,
): CameraLimits;
```

- `CameraRig`: compute the US-101 full-product limits into `productLimitsRef` (`minDistance = r × 1.2`, `maxDistance = fit × 2`, polar [π/6, 5π/12], azimuth ±Infinity). Call `applyLimits` **only when `inspectingRef.current` is false**. That way a resize while inspecting, or with widened limits active, never overwrites the region's limits. `canonicalRef` is still updated as before.

### 4 — Focus and return transitions (in `ProductScene`)

State and refs:

- `const [activeRegion, setActiveRegion] = useState<string | null>(null)` is local UI state that drives the copy and `aria-pressed`;
- `inspectingRef` (boolean);
- `transitionRef` (the current GSAP tween or null);
- `const { contextSafe } = useGSAP()`.
- **No Zustand writes.** Inspection mode is represented entirely by the local `activeRegion`; `sceneState` is not set to `DETAIL` or `PRODUCT` in this story (decision 5).

`moveTo(end: CameraPose, arrive: () => void)` is wrapped in `contextSafe`:

- `reducedMotion` means `matchMedia("(prefers-reduced-motion: reduce)")`. In that case: `arrive()` and return.
- Otherwise:
  1. `controls.enabled = false`, so **GSAP is the only camera writer**, and no angular limits are applied during the move;
  2. snapshot the start target and the start spherical offset;
  3. the end spherical is taken from `end`, with the theta delta wrapped to (−π, π] for the shortest path;
  4. tween proxy `t` 0→1 over `FOCUS_SECONDS = 1.2` with `ease: "power2.inOut"`. `onUpdate` lerps `controls.target`, radius, phi and theta, sets `camera.position = target + offset` and calls `camera.lookAt(target)`;
  5. `onComplete: arrive`.

`arrive` for a region:

1. `applyLimits(controls, region limits)`;
2. `applyPose(controls, focusPose)`, which syncs OrbitControls exactly on the region pose, inside its limits;
3. `controls.enabled = true`, `transitionRef.current = null`.

`arrive` for Reset:

1. `applyLimits(productLimitsRef)`;
2. `applyPose(canonical)`;
3. `inspectingRef.current = false`, then enable.

`selectRegion(region)`:

1. `finishIntro()`;
2. kill `transitionRef`;
3. `inspectingRef.current = true`, `setActiveRegion(region.id)`;
4. `moveTo(regionPose(region.camera), arriveRegion)`, where `regionPose` builds the target and position from `target` plus `Spherical(distance, polar, azimuth)`. This is the **only** place region numbers become a pose.

`resetView()`:

- if a region is active or a transition is running: kill it, `setActiveRegion(null)`, then `moveTo(canonical, arriveReset)`, which is the smooth return. Under reduced motion, `moveTo` applies the pose immediately;
- otherwise: `applyPose(canonical)` as in US-101, instantly.

`interruptTransition()` runs from the root `onPointerDownCapture` / `onWheelCapture` and from Zoom In / Zoom Out, next to `finishIntro`. If `transitionRef.current` is set:

1. `kill()`; the camera and target stay exactly where the last tick put them;
2. `applyLimits(controls, widenToCurrent(controls, destinationLimits))`. The destination limits are the region's limits, or the product limits for a Reset move. `widenToCurrent` returns a **new object**. These widened limits are **temporary runtime constraints** that exist only on the controls instance: they never mutate `FocusCamera` data or `productLimitsRef`, and the next `selectRegion` installs that region's canonical limits from data on arrival;
3. `controls.update()`, which is a no-op for the pose because every limit contains it;
4. `controls.enabled = true`, so OrbitControls continues from there. The region and its copy stay active.

The next `selectRegion` or `resetView` starts a fresh move, and its `arrive` installs normal limits. The capture handler runs before OrbitControls' own `pointerdown`, so the same gesture carries on as an orbit (as in US-102).

Cleanup: `useGSAP` reverts tweens on unmount. Add `useEffect(() => () => { if (controlsRef.current) controlsRef.current.enabled = true; }, [])` so the controls are never left disabled.

### 5 — Overlay UI

- Top overlay (`copyRef`): the name `<p>` stays. The tagline `<p>` becomes a `<p aria-live="polite">` that shows `tagline` when no region is active, or the region `name` (`font-medium`) plus `description` while one is active. `text-start`, `inset-s-4` as today.
- New group at `absolute bottom-4 inset-s-4 flex flex-wrap gap-2` with `role="group"` and `aria-label={labels.focus.label}`. One `<button type="button" className={buttonClass} aria-pressed={activeRegion === r.id}>` per region, labelled with `r.name`, in data order. The active button adds a visible pressed style (`bg-neutral-900 text-white`).
- Responsive layout (decision 6, Stage 8): below `sm`, the region group is its own full-width row directly above the viewer controls (`inset-x-4 bottom-17`), aligned from inline-start; from `sm`, the same-bottom-edge layout with `sm:inset-e-auto sm:bottom-4 sm:max-w-[calc(100%-15rem)]` (the viewer controls measure 204–223 px). Touch targets stay ≥ 44 px, labels are never truncated, and there is no horizontal scroll. Camera framing and region limits are not changed to compensate. Check EN and AR at 390 px.
- The existing viewer controls group stays at `bottom-4 inset-e-4`, unchanged.

### 6 — Docs

- `docs/ANIMATION.md` "Current implementation": add a **Detail focus (US-103)** subsection covering the move, arrival limits, reduced motion, Reset as exit, and a table contrasting interruption. The **intro** snaps to the final pose; a **focus move** stops at the current pose with widened, no-snap limits.
- `docs/3D-ASSETS.md`, below the deviations table: one line saying that US-103 inspection regions are camera regions in product data because of the addressable-parts deviation. That deviation is still open.

### 7 — Stage 8 amendments (decisions 6–7 and a verification fix)

- **Tuned camera data:** the starting values were too close (Fabric and Cushion filled the view with fabric). Final values are in `src/data/products.ts`: focus distance ~1.0 m, with limits about 0.75–1.35 m. They were verified with a limit sweep at 1440×900 and 390×844.
- **Portrait override (decision 7):** `FocusCamera.portrait?: Partial<Omit<FocusCamera, "portrait">>`, resolved by `resolveCamera` when the canvas is taller than it is wide (`controls.domElement` client size). Only Legs uses it: `{ distance: 1.3, minDistance: 1.05, maxDistance: 1.6 }`. A resize while inspecting keeps the current pose and limits; the new orientation applies on the next selection.
- **`finishIntro` guard:** US-102's `finish()` re-applied the canonical pose on every later pointer, wheel or zoom input. That broke the no-snap interruption, and repeated Zoom In never went past one step. `finishIntro` is now a no-op once `playedRef.current` is true.

---

## Required plan coverage

- **Files:**
  - changed: `src/data/products.ts`, `src/features/product-scene/ProductScene.tsx`, `src/app/[lang]/page.tsx`, `src/app/[lang]/dev/scene/page.tsx`, `src/i18n/dictionaries/en.ts`, `src/i18n/dictionaries/ar.ts`, `docs/ANIMATION.md`, `docs/3D-ASSETS.md`, `.squad/plans/00-index.md`;
  - created: the intake, this plan and `product-detail-focus/00-overview.md`;
  - nothing is deleted.
- **State:**
  - Zustand: **no changes** and no writes; `sceneState` stays untouched (decision 5).
  - Local: `activeRegion` (useState), plus `inspectingRef`, `transitionRef` and `productLimitsRef`. Camera and controls state stay in refs only.
- **3D:**
  - **Camera:** four data-driven focus poses; region → region and region → canonical moves in spherical coordinates around a moving target; per-region distance, azimuth and polar limits after arrival; widened no-snap limits after an interruption; US-101 limits unchanged outside inspection.
  - **Model/assets:** `stockholm-chair.glb` unchanged; the deviation is still documented.
  - **Environment and lighting:** unchanged.
  - **Timelines:** one `contextSafe` GSAP tween per move (1.2 s, `power2.inOut`), killed on interruption or a new selection and reverted on unmount; the intro is unchanged.
- **RTL / LTR:** the region group sits at `inset-s`, the controls at `inset-e`, and the copy uses `text-start`; button order follows the DOM, so it reverses visually in RTL. The camera data and moves are identical in `/en` and `/ar`.
- **Performance:** no new dependency, and no per-frame work outside the tweens. The copy is plain DOM text.
- **Tests & verification:** see below. There is no test framework in the repo.
- **Risks:**
  - _Clipping inside a region's limits._ Caught by the visual sweep of each region's extremes on desktop and mobile; fixed only in the data.
  - _Snap after an interruption._ `widenToCurrent` includes the current theta, phi and radius. It is checked by logging the camera position before and after `interruptTransition` (difference 0).
  - _A resize overwriting the region limits._ Guarded by `inspectingRef` in `CameraRig`.
  - _Theta wrapping._ The data ranges do not cross ±π; if a widened range would, it becomes unbounded.
  - _Portrait framing too tight._ The 390×844 check can fail on the fixed distances; they are tuned in the data, and if no single set works on both viewports, a Decision Gate follows.
  - _Mobile overlap_ of the two bottom groups: checked at 390 px.
- **Out of scope & deferred:** splitting the GLB into part nodes (US-601 or an asset story), part highlighting, and materials (US-202).

---

## Edge Cases & Failure Modes

- **Region selected during the intro:** `finishIntro()` runs first, then the move starts from the canonical pose.
- **Region selected during a move:** the running tween is killed, and the new move starts from the current pose.
- **The same region selected again:** a move to its pose from the current view (for example after the user orbited). Harmless.
- **Drag, wheel or zoom mid-move:** the move stops at the exact pose, the widened limits apply, and the copy stays.
- **Reset mid-move or after an interruption:** a smooth return to canonical, with the US-101 limits restored on arrival.
- **Reset with no region:** instant, as in US-101.
- **Reduced motion:** every pose applies at once; a snap is intended here.
- **Resize while inspecting:** only `canonicalRef` and `productLimitsRef` are refreshed; the region limits stay.
- **Unmount mid-move:** the tween is reverted and the controls are re-enabled.
- **Keyboard:** Tab reaches the region buttons, Enter or Space selects one, and `aria-pressed` reflects the active region; screen readers get the new copy through `aria-live`.

---

## Test Plan

No automated test framework exists. Verification is manual in the browser (below).

---

## Verification Steps

1. **Static:** `npm run lint`, `npx tsc --noEmit`, `npm run build`.
2. **Browser (`npm run dev`)** on `/en` and `/ar` at 390×844 and 1440×900:
   - each region: the move is smooth, the target visibly shifts, and the hold is stable;
   - orbit and zoom to every limit of each region: no clipping, no view through the geometry, and the part is still framed;
   - region → region goes directly;
   - Reset from a region returns smoothly to the same pose as Reset without a region, and the tagline comes back;
   - dragging, wheeling or zooming mid-move stops with no jump (compare the logged camera position), and the copy stays;
   - reduced motion (emulated in DevTools): instant poses;
   - `aria-pressed` and `aria-live` are correct in the accessibility tree;
   - RTL: the groups are mirrored and the 3D is identical;
   - no console errors.
3. **Regression:** the US-102 intro and its interruption, and US-101 zoom, reset and limits outside inspection; `/en/dev/scene` renders.

---

## Done Criteria

- [ ] Fabric, Cushion, Frame and Legs focus actions exist, driven by product data.
- [ ] The camera target moves smoothly to each region; the inspection view holds.
- [ ] Localized region name and sentence (approved copy) replace the tagline; the name stays visible; `aria-live` and `aria-pressed` are in place.
- [ ] Reset returns to the full view, the canonical pose, the US-101 limits and the tagline.
- [ ] Per-region limits are applied on arrival and verified clipping-free on desktop and mobile.
- [ ] An interrupted move keeps the exact pose with no snap; the region stays active.
- [ ] Reduced motion applies poses instantly.
- [ ] No GLB change, no new dependency, 3D not mirrored; docs updated.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 10.**

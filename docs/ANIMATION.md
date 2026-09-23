# Animation & Cinematic Architecture

How cinematic interactions are animated, who owns what, and how timelines
are cleaned up. Linked from [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Scope

Cinematic and timeline animation uses [GSAP](https://gsap.com) (`gsap`) with
its React hook `useGSAP` (`@gsap/react`). There is no custom animation
framework and no wrapper layer over GSAP: components build small timelines
directly.

## Ownership

| Layer       | Owns                                                                                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React**   | Component lifecycle: which scenes and overlays are mounted, and therefore when a timeline exists. Unmounting a component ends its timelines.                   |
| **R3F**     | The three.js scene graph, render loop, per-frame work (`useFrame`) and controls. It owns the objects (camera, model groups, lights) that timelines animate.    |
| **GSAP**    | Time-based interpolation of values on those objects through small explicit timelines: camera/target, model transform, environment/lighting, and DOM UI reveal. |
| **Zustand** | The current scene state and user selections (`src/state/experience-store.ts`). Timelines react to state changes; they never own or store state themselves.     |

- **One writer per property at a time.** While a timeline tweens a property,
  nothing else (`useFrame`, controls, React props) writes that property.
- **Timelines don't hold application state.** A timeline's progress is not
  the source of truth for which scene state is active.

## Scene states

`src/features/product-scene/scene-states.ts` defines the cinematic states as
a TypeScript contract (`SCENE_STATES`, `SceneState`):

| State       | Meaning                               |
| ----------- | ------------------------------------- |
| `PRODUCT`   | Product overview.                     |
| `DETAIL`    | Focus on a product detail.            |
| `CUSTOMIZE` | Configuring product options.          |
| `CONTEXT`   | The product placed in an environment. |

This is a contract only: no state-machine framework and no transitions. The
current state is stored as `sceneState` in the shared Zustand store
(`src/state/experience-store.ts`); how each transition animates is defined
by the stories that use them.

## Timeline rules

- **Small and explicit.** One short timeline per transition, created in
  `useGSAP` in the component that owns the animated objects. No global
  timeline registry.
- **Interruptible.** User interaction (e.g. starting to orbit) can kill a
  running cinematic timeline; the interaction then takes over the property.
- **Cleaned up on unmount.** `useGSAP` reverts everything created in its
  callback when the component unmounts; event listeners added there are
  removed in the callback's returned cleanup. Timelines created later (event
  handlers) are wrapped in `contextSafe` so they are reverted too.
- **Locale-independent.** Timelines never read the locale or `dir` — 3D is
  never mirrored (see `ARCHITECTURE.md`). DOM UI reveals follow document
  direction through logical CSS, not per-locale timelines.

## Current implementation

US-102's cinematic product introduction lives in `CinematicIntro` in
`ProductScene.tsx`:

- It starts after the GLB has loaded, because it sits inside the model's
  `Suspense`. Over 3 s the camera moves from a wide pose to the canonical
  framing, then the product name/tagline fade in and the subdued controls
  return to full opacity.
- **Camera ownership:** while it runs, `controls.enabled = false`. OrbitControls
  input and Drei's per-frame `update()` both stop, so GSAP is the only writer
  of the camera.
- **Interruption:** pointer, touch or wheel input on the viewer, or focusing or
  activating Zoom In/Zoom Out/Reset View, calls `finish()`. DOM capture
  listeners detect the input. `finish()` kills the timeline, applies the
  canonical pose, reveals the UI and re-enables the controls. The skip is not
  animated.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, the intro is
  skipped and the scene starts at the canonical pose with the final UI.
- **Once per mount:** the intro plays at most once per mount; once it has
  finished, input no longer calls `finish()`, so it never re-applies the pose.
- **One final pose:** intro completion, skip, reduced motion and Reset View all
  use `applyPose`, so they always produce the same view.
- **Controls stay usable:** the controls stay focusable and operable
  throughout; only their opacity is reduced.

### Detail focus (US-103)

The Product Studio's inspection regions (Fabric, Cushion, Frame, Legs) are
camera views stored in product data (`focusRegions` in `src/data/products.ts`):
target, distance, azimuth, polar angle and per-region zoom/orbit limits.
`ProductScene` owns the moves.

- **Move:** selecting a region tweens camera and target from the current
  view to the region pose in spherical coordinates (1.2 s, `power2.inOut`).
  Region → region moves go directly. `controls.enabled = false` while it runs,
  so GSAP is the only camera writer and no limits pull the camera off its path.
- **Arrival:** the region's limits are applied and `applyPose` syncs
  OrbitControls on the region pose; the view holds until another region or
  Reset. The active region is local UI state, not `sceneState`.
- **Reset:** exits inspection: clears the region, restores the full-product
  limits and returns smoothly to the canonical pose. With no region active,
  Reset stays instant.
- **Reduced motion:** focus and reset poses apply immediately.
- **Portrait:** a region may carry an optional `portrait` override (only the
  values that differ, e.g. distance and zoom limits), used when the canvas is
  taller than wide at selection time. A resize while inspecting keeps the
  current pose and limits.

Interruption differs from the intro:

| Timeline   | Manual interaction (pointer, touch, wheel, zoom) during the timeline                                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intro      | Kills the timeline and **snaps to the final** canonical pose.                                                                                                                                                                                                                                      |
| Focus move | Kills the timeline and **keeps the exact current pose**. OrbitControls takes over with temporary limits: the destination limits widened just enough to contain that pose, so nothing snaps. They never change the region data; the next region selection installs that region's limits on arrival. |

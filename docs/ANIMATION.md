# Animation & Cinematic Architecture

How cinematic interactions are animated, who owns what, and how timelines
are cleaned up. Linked from [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Scope

Cinematic and timeline animation uses [GSAP](https://gsap.com) (`gsap`) with
its React hook `useGSAP` (`@gsap/react`). There is no custom animation
framework and no wrapper layer over GSAP: components build small timelines
directly.

## Ownership

| Layer       | Owns                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **React**   | Component lifecycle: which scenes and overlays are mounted, and therefore when a timeline exists. Unmounting a component ends its timelines.                       |
| **R3F**     | The three.js scene graph, render loop, per-frame work (`useFrame`) and controls. It owns the objects (camera, model groups, lights) that timelines animate.        |
| **GSAP**    | Time-based interpolation of values on those objects through small explicit timelines: camera/target, model transform, environment/lighting, and DOM UI reveal.     |
| **Zustand** | _Introduced in S0-08; not installed yet._ The current scene state and user selections. Timelines react to state changes; they never own or store state themselves. |

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

This is a contract only: no state-machine framework, no store, no
transitions. Where the current state is stored (Zustand, S0-08) and how each
transition animates are defined by the stories that use them.

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

`ProductScene` (development scene) contains a lifecycle proof only: one
timeline that rotates the model into place on mount, is killed when
OrbitControls fires `start`, and is reverted on unmount. Its values (GSAP
default duration and ease) are placeholders, not final choreography, camera
behavior or animation UX.

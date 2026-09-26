# Story 10 — US-201 Change Product Color (Story: 3DMODEL-10)

## Prerequisites

- Story 04 completed: [../shared-state/04-story-3DMODEL-15.md](../shared-state/04-story-3DMODEL-15.md) — `useExperienceStore` in `src/state/experience-store.ts`.
- Story 07 completed: [../interactive-product/07-story-3DMODEL-13.md](../interactive-product/07-story-3DMODEL-13.md) — `Model`, `ProductScene` and the overlay button style.
- Story 09 completed: [../product-detail-focus/09-story-3DMODEL-11.md](../product-detail-focus/09-story-3DMODEL-11.md) — the region button group and `aria-pressed` pattern.
- 3DMODEL-28 completed (merged, PR #15): [../recolorable-fabric/11-story-3DMODEL-28.md](../recolorable-fabric/11-story-3DMODEL-28.md) — `Chair_Fabric` has a neutral base-color texture suitable for tinting, resolving the Q5 asset blocker.
- Human decisions Q1–Q4 in `.squad/stories/product-color/3DMODEL-10/intake.md` are binding: the palette, `Chair_Fabric` only, tint over the texture, and session-only Zustand state.

---

## Story Goal

1. A **Color** group in the Product Studio overlay shows the four predefined upholstery colors (Sand, Olive, Terracotta, Charcoal / رملي، زيتوني، طوبي، فحمي). The selected color is marked with `aria-pressed="true"` and a visible ring. Sand is the default.
2. Selecting a color tints **only** the `Chair_Fabric` material instantly, with no reload. `Chair_Wood` and `Material_0.001` are unchanged. The fabric texture stays visible: `material.color` multiplies the base-color map.
3. The selection lives in `useExperienceStore` (session only). It therefore survives focus/Reset transitions and any remount of the scene within the session, and future scenes can read it.
4. The camera is untouched: selecting a color is not viewer input, so it does not move, interrupt or reset the camera.

**Not in scope:** material customization (US-202), reload persistence (no persist middleware, localStorage or URL), texture replacement, a color transition animation (optional per Linear; omitted to avoid complexity), GLB changes, new dependencies.

---

## Context — Read These Files First

1. `src/features/product-scene/ProductScene.tsx`:
   - `Model` (~lines 273–292): it renders `<primitive object={scene} />` from `useGLTF(MODEL_URL)`. Drei caches that scene, so it is **shared** by every mount.
   - `buttonClass` (~lines 306–307); the region group (~lines 504–523, `aria-pressed` pattern); the copy overlay at `top-4 inset-s-4` (~lines 489–501); the root capture listeners `onPointerDownCapture` / `onWheelCapture` (~lines 460–461).
2. `src/data/products.ts`: `Product` (~lines 36–45) and `stockholmChair` (~line 47).
3. `src/state/experience-store.ts` (whole file, 20 lines).
4. `src/app/[lang]/page.tsx` ~lines 19–29 and `src/app/[lang]/dev/scene/page.tsx` ~lines 16–26: both map product data to localized `ProductScene` props.
5. `src/i18n/dictionaries/en.ts` ~lines 15–30 and `ar.ts`: the `scene.focus` block.
6. `public/models/stockholm-chair.glb` (verified during planning): materials `Material_0.001` (0), `Chair_Fabric` (1) and `Chair_Wood` (2). Each has a `baseColorTexture` and **no `baseColorFactor`**, so three.js loads `color = #ffffff`. The single mesh has 3 primitives, which GLTFLoader turns into 3 child `Mesh`es, one per material.
7. `docs/ARCHITECTURE.md` ~lines 49–58 ("Lightweight shared state"): the store contents line to update.

---

## Implementation tasks

### 1 — Palette in product data

File: `src/data/products.ts`

```ts
export type ProductColor = {
  // Stable internal identifier; never translated.
  id: "sand" | "olive" | "terracotta" | "charcoal";
  name: LocalizedText;
  // sRGB hex; tints the texture (multiplied), so the render is not an exact match.
  hex: string;
};
```

Add to `Product`:

- `colorMaterial: string`: the material name to tint (semantic target, never an index);
- `colors: ProductColor[]`;
- `defaultColorId: ProductColor["id"]`.

In `stockholmChair`:

- `colorMaterial: "Chair_Fabric"`;
- `defaultColorId: "sand"`;
- `colors`:
  - sand — Sand / رملي, `#B8A58F`
  - olive — Olive / زيتوني, `#6F7456`
  - terracotta — Terracotta / طوبي, `#A9654B`
  - charcoal — Charcoal / فحمي, `#4A4947`

### 2 — Shared state

File: `src/state/experience-store.ts`

- Add `selectedColorId: ProductColor["id"]`, initialised to `stockholmChair.defaultColorId`.
- Add `selectColor: (colorId: ProductColor["id"]) => void`.
- No middleware.

### 3 — Instance-owned fabric material

File: `src/features/product-scene/ProductScene.tsx`

- Add a prop `colorMaterial: string` and pass it through to `Model`.
- In `Model`, replace direct use of the cached scene with an instance copy:

```ts
// The cached GLTF scene is shared; clone it and own the tinted material so a
// color never leaks into another mount. Geometry and textures stay shared.
const { model, fabric } = useMemo(() => {
  const model = scene.clone(true);
  let fabric: MeshStandardMaterial | null = null;
  model.traverse((object) => {
    if (
      object instanceof Mesh &&
      object.material instanceof MeshStandardMaterial &&
      object.material.name === colorMaterial
    ) {
      fabric ??= object.material.clone();
      object.material = fabric;
    }
  });
  return { model, fabric };
}, [scene, colorMaterial]);
useEffect(() => () => fabric?.dispose(), [fabric]);
```

- Render `<primitive object={model} />`.
- Keep `useModelBounds(scene)` and `CameraRig scene={scene}`: the bounds are identical and the camera code is unchanged.
- Tint in an effect:

```ts
const hex = useExperienceStore((s) => colorHexById[s.selectedColorId]);
useEffect(() => {
  fabric?.color.set(hex);
}, [fabric, hex]);
```

`colorHexById` is passed in as a prop map `Record<ProductColor["id"], string>`. `Color.set` with a hex string converts sRGB → linear under three's default ColorManagement.

- If no material matches (`fabric` is null), log `console.error` once in development and render untinted. That is a gate-worthy asset regression, not a silent fallback.
- **No** material cloning for `Chair_Wood` / `Material_0.001`.

### 4 — Color group UI

File: `src/features/product-scene/ProductScene.tsx`

- Add props: `colors: { id: ProductColor["id"]; name: string; hex: string }[]` (localized by the page).
- Render a `role="group"` with `aria-label={labels.color.label}` at `absolute top-4 inset-e-4 flex gap-2`.
- Each color is a 44 × 44 `button` (`min-h-11 min-w-11 rounded-full`) with:
  - an inner swatch `span` whose `style={{ backgroundColor: hex }}` is decorative (`aria-hidden`);
  - `aria-label={name}` and `aria-pressed={selected}`;
  - selected: `ring-2 ring-neutral-900 ring-offset-2`;
  - focus-visible outline as in `buttonClass`.
- `onClick={() => selectColor(id)}`. Do **not** call `onViewerInput`/`finishIntro`: the camera and intro are unaffected.
- A pointer-down on a swatch also reaches the root `onPointerDownCapture` (capture runs root-first, so it cannot be stopped from the group). Guard `onViewerInput`: return early when `colorsRef.current?.contains(e.target as Node)`, where `colorsRef` is on the color group.
- The group is not faded by the intro; it stays operable.
- Below the swatches, render the selected color's localized name as visible text (`text-xs text-neutral-700 text-end`). That gives the selected state a visible label, not only a ring.

### 5 — Page wiring and copy

Files: `src/app/[lang]/page.tsx`, `src/app/[lang]/dev/scene/page.tsx`

Pass these props to `ProductScene`:

- `colorMaterial={stockholmChair.colorMaterial}`
- `colors={stockholmChair.colors.map((c) => ({ id: c.id, name: c.name[locale], hex: c.hex }))}`

Files: `src/i18n/dictionaries/en.ts`, `ar.ts`

- Add `scene.color.label`: EN "Color", AR "اللون".

### 6 — Docs

- `docs/ARCHITECTURE.md` ~line 50: the store holds `sceneState`, `selectedProductId` and `selectedColorId`.
- `docs/3D-ASSETS.md`, "Current deviations" note: US-201 tints the `Chair_Fabric` material by name on a per-mount clone. The addressable-parts deviation remains.

---

## Required plan coverage

- **Files:**
  - `src/data/products.ts`
  - `src/state/experience-store.ts`
  - `src/features/product-scene/ProductScene.tsx`
  - `src/app/[lang]/page.tsx`
  - `src/app/[lang]/dev/scene/page.tsx`
  - `src/i18n/dictionaries/en.ts`
  - `src/i18n/dictionaries/ar.ts`
  - `docs/ARCHITECTURE.md`
  - `docs/3D-ASSETS.md`
  - No files are created or deleted.
- **State:**
  - Shared: `selectedColorId` + `selectColor` in `useExperienceStore`, session only, domain value (id) only.
  - Local: the cloned scene and material in `Model` (a `useMemo`); no Three.js objects in the store.
- **3D:**
  - Camera: unchanged, with no camera writes.
  - Model/assets: GLB unchanged. A per-mount `scene.clone(true)` plus one cloned `Chair_Fabric` material; geometry and textures stay shared.
  - Environment: unchanged.
  - Lighting: unchanged.
  - Timelines: none added (no transition).
- **RTL / LTR:**
  - The group sits at `inset-e-4`, the copy at `inset-s-4`, so they mirror by `dir`.
  - Names are localized from product data; the group label comes from the dictionary.
  - The 3D is not mirrored.
- **Performance:**
  - One scene clone per mount (shallow objects; buffers and textures shared) and one extra material.
  - A color change is a uniform update, with no shader recompile (map, normal map and roughness map unchanged).
  - No bundle or asset change; no dependency.
- **Tests & verification:** see Test Plan / Verification Steps.
- **Risks:**
  - (a) A dark texture could make colors muddy → browser check of all four; muddy → Decision Gate (Q3).
  - (b) The top-end group could overlap the name/tagline on 390px → browser check; overlap → Decision Gate on placement.
  - (c) A color click interrupting the intro/focus → the `contains` guard, verified in the browser.
  - (d) The cloned material not disposed → the effect cleanup, verified by unmount/remount (locale switch).
- **Out of scope & deferred:** see Story Goal. No deferred work is expected; runtime checks that cannot be made here go to "Deferred verification".

---

## Edge Cases & Failure Modes

- Selecting the already-selected color: `set` is a no-op visually, and `aria-pressed` is unchanged.
- The color is changed mid-intro or mid-focus-move: the camera continues unaffected (enforced by the root handler guard, task 4).
- Scene remount (language switch, route change): a new clone reads `selectedColorId` from the store and applies it on first effect, so the color persists. The old cloned material is disposed.
- No material named `colorMaterial` exists (asset regression): a dev `console.error`, and the model renders untinted.
- Two mounts at once (not in the app today): each has its own cloned material, so there is no leak.

---

## Test Plan

No automated test framework exists. Verification is manual in the browser (below), as in Story 09.

---

## Verification Steps

1. **Static:** `npm run lint`, `npx tsc --noEmit`, `npm run build`.
2. **Browser (`npm run dev`)** on `/en` and `/ar` at 390×844 and 1440×900:
   - four swatches, with Sand selected by default, a visible ring and the name shown;
   - each color tints only the upholstery; the wood and the third material are unchanged; the texture is still visible; none is muddy;
   - the camera does not move on a color click, including mid-intro and mid-focus-move;
   - the color survives focus region selection, Reset and a language switch (remount);
   - `aria-pressed` / labels are correct in the accessibility tree; the AR names are shown;
   - RTL: the group sits at the opposite corner and the 3D is identical;
   - no console errors.
3. **Regression:** the US-101 zoom/reset, the US-102 intro, the US-103 regions; `/en/dev/scene` renders.

---

## Done Criteria

- [ ] Four predefined colors with a visible and ARIA selected state; Sand is the default.
- [ ] Selecting a color updates only `Chair_Fabric` without a reload; the texture is preserved.
- [ ] The selection lives in Zustand and persists across focus/reset and remounts; there is no reload persistence.
- [ ] AR/EN names, RTL/LTR placement, 3D not mirrored.
- [ ] The camera is unchanged; no new dependency; the GLB is unchanged; the cloned material is disposed.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 11.**

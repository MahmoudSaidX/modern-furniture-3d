# Story 02 — S0-06 Define 3D Asset Standards (Story: 3DMODEL-17)

## Prerequisites

- Story 01 completed: [S0-05 — Establish 3D Technology Foundation](../3d-foundation/01-story-3DMODEL-18.md) (3DMODEL-18, merged as PR #6) — `public/models/stockholm-chair.glb`, `src/features/product-scene/ProductScene.tsx`, `docs/ARCHITECTURE.md` 3D sections.
- Human decisions recorded in `.squad/stories/3d-asset-standards/3DMODEL-17/intake.md` ("Extra notes") are binding values for this standard.

---

## Story Goal

A written 3D asset standard at `docs/3D-ASSETS.md`, linked from `docs/ARCHITECTURE.md`, covering:

1. GLB/glTF file, node and material naming;
2. independently addressable customizable parts;
3. scale, axes, facing and origin;
4. web-optimization targets and compression;
5. one canonical product asset reused by Product Studio and Interior Context;
6. the current deviations of `stockholm-chair.glb`.

**Documentation only.** **Not in scope:** modifying/optimizing `stockholm-chair.glb`, adding tooling or dependencies, build-time enforcement of budgets, code changes.

---

## Context — Read These Files First

1. `.squad/stories/3d-asset-standards/3DMODEL-17/intake.md` — Business rules, acceptance criterion, recorded decisions (verbatim values), current asset facts.
2. `docs/ARCHITECTURE.md` — lines 21–25 (`src/data/`: internal mesh/material/asset IDs never translated), lines 32–38 (Product Scene, Public 3D assets), lines 65–69 ("3D is never mirrored"), lines 75–78 (Context Scene, intended).
3. `src/features/product-scene/ProductScene.tsx` — loads `useGLTF("/models/stockholm-chair.glb")`; the standard must not require changes here.

---

## Implementation tasks

### 1 — Asset standard

Create file: `docs/3D-ASSETS.md`. Sections, in order, with these exact rules:

1. **Scope** — applies to every product model under `public/models/`. Budgets are **targets**: exceeding one requires a written justification (in the asset's story/PR and in the deviations list), not a build failure.
2. **Format & naming** — binary glTF 2.0 (`.glb`) for runtime assets. Filenames kebab-case, product-identifying, no version/"final" suffixes (e.g. `stockholm-chair.glb`). Node and material names semantic PascalCase (e.g. `Seat`, `Frame`, `SeatFabric`, `FrameWood`); no exporter defaults (`Material_0.001`, `Cube.003`) and no underscores. Names are internal IDs: never translated or localized (ties to ARCHITECTURE `src/data/` rule).
3. **Customizable parts** — every independently customizable part is its own semantic named node carrying its own semantic named material, so code can address it by node name and swap/tint its material without affecting other parts. Non-customizable decorative geometry may be merged **only when safe**: it shares one material, is never customized independently, and merging does not break a customizable part's addressability.
4. **Scale, axes & origin** — 1 unit = 1 meter, real-world size; Y-up; product front faces −Z; origin at floor-centre: X/Z centre of the footprint, base resting on Y = 0. No scale/rotation baked into the root node (identity transforms).
5. **Web optimization targets** — primary product ≤ 80k triangles; textures ≤ 2K (2048 px) per side; primary GLB ≤ 5 MB target, 10 MB ceiling reserved for documented exceptions. Meshopt preferred for geometry compression; KTX2/Basis for optimized runtime textures. Avoid oversized geometry/textures (Linear business rule).
6. **Reuse across scenes** — one canonical product asset per product, loaded unchanged by Product Studio (`src/features/product-scene/`) and Interior Context (Context Scene, when introduced); no per-scene copies or variants. Scene-specific framing/lighting lives in scene code, not in the asset. Consistent with "3D is never mirrored": one asset for every locale.
7. **Current deviations — `stockholm-chair.glb`** — table, not fixed in S0-06:

| Rule              | Current asset                                                                              | Status               |
| ----------------- | ------------------------------------------------------------------------------------------ | -------------------- |
| Addressable parts | 1 node `Stockholm_Chair_Web`, 1 mesh with 3 primitives; parts addressable only by material | Deviation            |
| Naming            | node/mesh use underscores; materials `Material_0.001`, `Chair_Fabric`, `Chair_Wood`        | Deviation            |
| Facing            | backrest at −Z; front faces +Z                                                             | Deviation            |
| Units/axes/origin | meters, Y-up, base at Y = 0, centred on X/Z                                                | Compliant            |
| Triangles         | 79,999 (≤ 80k)                                                                             | Compliant            |
| Textures          | 3 × 2048² JPEG                                                                             | Compliant            |
| File size         | 9,821,512 bytes (~9.8 MB): over 5 MB target, under 10 MB ceiling                           | Documented exception |
| Compression       | none (no Meshopt / KTX2)                                                                   | Deviation            |

End with: remediation belongs to a later asset/optimization story (e.g. US-601); S0-06 leaves the file unchanged.

### 2 — Architecture link

File: `docs/ARCHITECTURE.md` — in the **Public 3D assets** bullet (lines 37–38), append: "Asset conventions (naming, customizable parts, scale/origin, optimization) are defined in [`3D-ASSETS.md`](3D-ASSETS.md)."

No frontend or backend code changes required.

---

## Edge Cases & Failure Modes

- **Asset modified by accident** — `public/models/stockholm-chair.glb` must be unchanged: `git diff main --stat -- public/` is empty.
- **Facing rule vs. current scene** — the chair faces +Z; the rule says −Z. Documented as a deviation only; `ProductScene.tsx` camera is not changed.
- **Numbers drift from the asset** — the deviations table values come from the GLB's JSON (intake "Current asset facts" + this plan); re-check if the file changes.

---

## Test Plan

No test framework; docs-only change — none added.

---

## Verification Steps

1. **Static checks:** `npm run lint`, `npx tsc --noEmit`, `npm run build` at repo root (regression; no code changed).
2. **Docs:** the link in `docs/ARCHITECTURE.md` resolves to `docs/3D-ASSETS.md`; every Linear AC topic and business rule appears in `docs/3D-ASSETS.md`.
3. **Regression:** `git diff main --stat` touches only `docs/` and `.squad/`.

---

## Done Criteria

- [ ] `docs/3D-ASSETS.md` documents GLB/glTF naming, independently addressable customizable parts, scale/origin, and web optimization.
- [ ] Business rules covered: avoid oversized geometry/textures; merge decorative geometry only when safe; reuse one product asset across scenes.
- [ ] Same-model reuse across Product Studio and Interior Context stated.
- [ ] Stockholm chair deviations documented; asset unchanged.
- [ ] `docs/ARCHITECTURE.md` links to `docs/3D-ASSETS.md`.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 03.**

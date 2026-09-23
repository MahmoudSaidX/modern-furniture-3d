# 3D Asset Standards

Conventions for every product model under `public/models/`, so furniture can
be customized and reused predictably. Numeric budgets are **targets**:
exceeding one requires a written justification (in the asset's story/PR and
in the deviations list below), not a build failure.

## Format and naming

- **Format** — binary glTF 2.0 (`.glb`) for runtime assets.
- **Filenames** — kebab-case, identifying the product, with no version or
  "final" suffixes (e.g. `stockholm-chair.glb`).
- **Nodes and materials** — semantic PascalCase names that describe the part
  or surface (e.g. nodes `Seat`, `Frame`; materials `SeatFabric`,
  `FrameWood`). No exporter defaults (`Material_0.001`, `Cube.003`) and no
  underscores.
- **Names are internal IDs** — never translated or localized (see
  `src/data/` in [ARCHITECTURE.md](ARCHITECTURE.md)).

## Customizable parts

- Every independently customizable part is its own semantic named node
  carrying its own semantic named material, so code can address the part by
  node name and change its material without affecting other parts.
- Non-customizable decorative geometry may be merged **only when safe**: it
  shares one material, is never customized on its own, and merging it does
  not break the addressability of any customizable part.

## Scale, axes and origin

- **Units** — 1 unit = 1 meter, at real-world size.
- **Axes** — Y-up; the product's front faces −Z.
- **Origin** — floor-centre: centred on the footprint in X/Z, with the base
  resting on Y = 0.
- **Transforms** — no scale or rotation baked into the root node (identity
  transforms).

## Web optimization

| Budget                      | Target                  | Notes                                         |
| --------------------------- | ----------------------- | --------------------------------------------- |
| Triangles (primary product) | ≤ 80k                   |                                               |
| Texture size                | ≤ 2K (2048 px) per side |                                               |
| Primary GLB file size       | ≤ 5 MB                  | 10 MB ceiling, only as a documented exception |

- Avoid oversized geometry and textures.
- **Geometry compression** — Meshopt preferred.
- **Runtime textures** — KTX2/Basis for optimized textures.

## Reuse across scenes

- One canonical asset per product, loaded unchanged by Product Studio
  (`src/features/product-scene/`) and Interior Context (the Context Scene,
  when introduced). No per-scene copies or variants.
- Scene-specific framing, lighting and camera live in scene code, not in the
  asset.
- The same asset serves every locale (3D is never mirrored — see
  [ARCHITECTURE.md](ARCHITECTURE.md)).

## Current deviations — `stockholm-chair.glb`

Recorded, not fixed, in S0-06; the file is unchanged.

| Rule              | Current asset                                                                              | Status               |
| ----------------- | ------------------------------------------------------------------------------------------ | -------------------- |
| Addressable parts | 1 node `Stockholm_Chair_Web`, 1 mesh with 3 primitives; parts addressable only by material | Deviation            |
| Naming            | node/mesh names use underscores; materials `Material_0.001`, `Chair_Fabric`, `Chair_Wood`  | Deviation            |
| Facing            | backrest at −Z; front faces +Z                                                             | Deviation            |
| Units/axes/origin | meters, Y-up, base at Y = 0, centred on X/Z                                                | Compliant            |
| Triangles         | 79,999 (≤ 80k)                                                                             | Compliant            |
| Textures          | 3 × 2048² JPEG                                                                             | Compliant            |
| File size         | 9,821,512 bytes (~9.8 MB): over the 5 MB target, under the 10 MB ceiling                   | Documented exception |
| Compression       | none (no Meshopt, no KTX2)                                                                 | Deviation            |

Remediation belongs to a later asset/optimization story (e.g. US-601).

Because parts are not addressable, US-103's inspection regions are camera
regions in product data (`focusRegions` in `src/data/products.ts`), not model
parts. The addressable-parts deviation remains open.

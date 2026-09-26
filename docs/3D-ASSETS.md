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

Recorded, not fixed, in S0-06. Since then only the fabric base-color texture
has changed (3DMODEL-28, below).

| Rule              | Current asset                                                                              | Status               |
| ----------------- | ------------------------------------------------------------------------------------------ | -------------------- |
| Addressable parts | 1 node `Stockholm_Chair_Web`, 1 mesh with 3 primitives; parts addressable only by material | Deviation            |
| Naming            | node/mesh names use underscores; materials `Material_0.001`, `Chair_Fabric`, `Chair_Wood`  | Deviation            |
| Facing            | backrest at −Z; front faces +Z                                                             | Deviation            |
| Units/axes/origin | meters, Y-up, base at Y = 0, centred on X/Z                                                | Compliant            |
| Triangles         | 79,999 (≤ 80k)                                                                             | Compliant            |
| Textures          | 3 × 2048² JPEG shared by all materials, plus 1 × 1024² JPEG owned by `Chair_Fabric`        | Compliant            |
| File size         | 9,996,724 bytes (~10.0 MB): over the 5 MB target, under the 10,000,000-byte ceiling        | Documented exception |
| Compression       | none (no Meshopt, no KTX2)                                                                 | Deviation            |

Remediation belongs to a later asset/optimization story (e.g. US-601).

Because parts are not addressable, US-103's inspection regions are camera
regions in product data (`focusRegions` in `src/data/products.ts`), not model
parts. The addressable-parts deviation remains open.

## Fabric recoloring treatment (3DMODEL-28)

All three materials originally shared one baked base-color atlas in which
fabric and wood UV islands interleave, and the fabric's base color was dark
brown — too dark for tint-based color customization (US-201 multiplies the
palette color over the base color). The treatment:

- `Chair_Fabric` now owns an **independent neutral base-color texture**
  (`ChairFabricNeutral`, 1024² sRGB JPEG, 175,467 bytes) derived from the atlas,
  so fabric detail stays at the same UVs. `Chair_Wood` and `Material_0.001`
  still use the original, byte-identical base-color image; the normal and
  metallic-roughness images are unchanged and still shared. Geometry, node,
  mesh and material names, and bounds are unchanged.
- **Why 1K:** the GLB had ~180 KB of headroom under the 10 MB ceiling; a 2K
  neutral image (≈0.8–1.2 MB) would have exceeded it. 1K keeps the fabric
  weave and tufting readable in the product and close-up views.
- **Image preparation** (one-time, local):
  1. macOS `sips` (sips-316, macOS 26.6.2): grayscale (`Generic Gray Gamma
     2.2 Profile`), resize to 1024, back to `sRGB Profile`, JPEG quality 60.
  2. `ffmpeg` 8.1 (Homebrew, local) once, as a brightness lift after the grayscale
     result rendered too dark: `colorlevels=rimax=0.72:gimax=0.72:bimax=0.72` —
     a uniform ×1.39 gain (black point unchanged; no contrast, blur or other
     processing), then re-encoded with `sips` at JPEG quality 60.
- **Packing:** `npx @gltf-transform/cli@4.5.0 copy` only (not a project
  dependency) to unpack to `.gltf` and repack; the new image/texture and the
  `Chair_Fabric` base-color assignment were added as a JSON edit. On rewrite,
  glTF Transform collapsed the exporter's 9 duplicate texture entries (same
  image + sampler) to 3 and wrote the default `REPEAT` wrap modes explicitly —
  no rendering change. No optimization or compression was applied.
- Resulting GLB: 9,996,724 bytes. Optimization and compression (Meshopt,
  KTX2) remain US-601 scope.

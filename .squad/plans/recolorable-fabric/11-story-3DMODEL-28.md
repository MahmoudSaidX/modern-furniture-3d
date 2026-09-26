# Story 11 — Recolorable Fabric Asset for Color Customization (Story: 3DMODEL-28)

## Prerequisites

- Story 02 completed: [../3d-asset-standards/02-story-3DMODEL-17.md](../3d-asset-standards/02-story-3DMODEL-17.md) — the budgets and the "Current deviations" table in `docs/3D-ASSETS.md`.
- Human decisions Q7 and Q8 (2026-09-26) are binding; they are recorded in `.git/next-story/3DMODEL-28.md`:
  - **Q7:** an independent neutral 1K base-color image for `Chair_Fabric`, starting at JPEG Q60; stay under the 10 MB ceiling; no 512, no re-encoding of other textures, no compression.
  - **Q8:** a pinned one-time `npx @gltf-transform/cli@4.5.0`, not added to `package.json`; `sips` for image preparation; no hand-written GLB binary edits; no optimize/compress commands.
- This story blocks Story 10 ([../product-color/10-story-3DMODEL-10.md](../product-color/10-story-3DMODEL-10.md), whose work is stashed). The US-201 runtime in that stash tints `Chair_Fabric` by name.

---

## Story Goal

1. `Chair_Fabric` gets its **own** neutral, light base-color texture (1024², JPEG). It is derived from the existing atlas, so fabric detail stays in the same UV positions.
2. `Chair_Wood` and `Material_0.001` keep referencing the **original**, unchanged base-color image. The normal and metallic-roughness images stay shared and unchanged.
3. The GLB stays **≤ 10,000,000 bytes**. Geometry, nodes, material names and bounds are unchanged.
4. Under the existing Product Scene lighting, Sand, Olive, Terracotta and Charcoal become clearly distinguishable and read as their names, with fabric detail still convincing.

**Not in scope:** the US-201 UI/runtime (stashed), Meshopt/KTX2/any compression (US-601), `Chair_Wood`/`Material_0.001`, geometry, US-103 copy contrast (3DMODEL-29), committed tooling.

---

## Context — Read These Files First

1. `docs/3D-ASSETS.md`: "Web optimization" (~lines 38–50) and "Current deviations" (~lines 60–79).
2. `.squad/stories/recolorable-fabric/3DMODEL-28/intake.md`, "3D / Scene requirements": the shared-atlas findings.
3. `public/models/stockholm-chair.glb`, verified during planning:
   - images: `Image_2` (normal, bufferView 4, 2,394,189 B), `Image_0` (base color, bufferView 5, 3,250,419 B), `Image_1` (metallic-roughness, bufferView 6, 1,757,335 B);
   - textures 0–8 cycle sources 0, 1, 2; `Chair_Fabric` is material 1 and uses `baseColorTexture.index = 4` (→ source 1).
4. `src/features/product-scene/ProductScene.tsx` on `main`: lighting, `Environment` lightformers and camera, used unchanged for verification.
5. `npx @gltf-transform/cli@4.5.0 help copy`: "Copy model with minimal changes"; writing `.gltf` emits external `.bin` and image files.

---

## Implementation tasks

All intermediate files live in the session scratchpad (`$SCRATCH`), never in the repo.

### 1 — Unpack

```sh
npx -y @gltf-transform/cli@4.5.0 copy public/models/stockholm-chair.glb $SCRATCH/unpacked/chair.gltf
```

Record the emitted image filenames and hash each one with `shasum -a 256`. They must equal the bytes of the three original images extracted from the GLB.

### 2 — Neutral fabric image (sips)

```sh
sips -m "/System/Library/ColorSync/Profiles/Generic Gray Gamma 2.2 Profile.icc" \
  -Z 1024 -s format jpeg -s formatOptions 60 <base-color image> --out $SCRATCH/unpacked/fabric-neutral.jpg
```

- Then convert the result back to an RGB (sRGB) JPEG so the image is a standard three-channel base color: `sips -m "/System/Library/ColorSync/Profiles/sRGB Profile.icc"`, keeping Q60.
- Measure the average brightness (`ffmpeg … signalstats`, read-only). The grey-only version averages about 157/255.
- Judge the grey-only result from the **rendered** view under the existing Product Scene lighting, not from the average alone.
- **Fallback (approved with a constraint, 2026-09-26):** use it only if the browser check in task 5 shows that the remaining blocker is specifically that the neutral albedo is too dark for the palette.
  - Apply **one** controlled brightness lift with the locally installed `ffmpeg` (`colorlevels`), once.
  - Preserve the tonal and weave detail: no flattening to uniform grey, no unrelated blur or contrast processing.
  - Record the exact filter and parameters, and rerun the full four-color verification.
  - If that single adjustment still fails → Decision Gate; no iterative tuning.

### 3 — Assign to Chair_Fabric only and repack

Edit `$SCRATCH/unpacked/chair.gltf` **JSON only**; no binary layout is written by hand:

- append `images`: `{ "name": "ChairFabricNeutral", "uri": "fabric-neutral.jpg", "mimeType": "image/jpeg" }`;
- append `textures`: `{ "sampler": 0, "source": <new image index> }`;
- set `materials[<Chair_Fabric>].pbrMetallicRoughness.baseColorTexture.index` to the new texture index. Find the material **by name**, not by index.

Repack:

```sh
npx -y @gltf-transform/cli@4.5.0 copy $SCRATCH/unpacked/chair.gltf public/models/stockholm-chair.glb
```

Do **not** run `optimize`, `dedup`, `prune`, `resize`, `jpeg` or any compression command.

### 4 — Structural verification (scratchpad script, not committed)

- `npx -y @gltf-transform/cli@4.5.0 inspect` on the old and new files: the mesh, primitive, node and material counts and names are identical; the vertex/index counts and bounds are identical.
- Parse the JSON and check:
  - `Chair_Wood` and `Material_0.001` base color → the original image;
  - `Chair_Fabric` base color → `ChairFabricNeutral`;
  - normal and metallic-roughness assignments unchanged.
- The SHA-256 of each original image, extracted from the new GLB, equals the original.
- `npx -y @gltf-transform/cli@4.5.0 validate`: no errors.
- File size ≤ 10,000,000 B, recorded exactly.

### 5 — Visual verification

Tint the fabric with each palette color, **without committing any runtime code** (the US-201 UI is stashed):

- Run a local scratch Playwright script against `npm run dev` on `/en` that finds the `Chair_Fabric` material through the React Three Fiber canvas internals and sets `.color`. Read-only for the app.
- Check in the default product view and in the Fabric and Cushion close-ups:
  - untinted neutral (white): the fabric detail reads;
  - each of Sand, Olive, Terracotta and Charcoal: clearly distinguishable and reads as its name;
  - wood and `Material_0.001` look unchanged versus `main`.
- Soft 1K detail or poor recoloring → Decision Gate (Q7); do not reduce quality or grow the budget.

### 6 — Docs

File: `docs/3D-ASSETS.md`

- Deviations table:
  - update the "File size" row with the new exact byte count;
  - update the "Textures" row: 3 × 2048² JPEG shared, plus 1 × 1024² JPEG owned by `Chair_Fabric`;
  - change the "Recolorable fabric" row to "Resolved (3DMODEL-28)".
- Add a short "Fabric recoloring treatment (3DMODEL-28)" note covering:
  - `Chair_Fabric` owns an independent neutral 1K base-color texture derived from the shared atlas;
  - why 1K was chosen (the 10 MB ceiling had about 180 KB of headroom; 2K would have exceeded it);
  - the one-time tools: `npx @gltf-transform/cli@4.5.0` (`copy` only) and macOS `sips`, plus `ffmpeg` if the fallback was used, with its parameters;
  - the resulting GLB size;
  - optimization/compression remains US-601 scope.

---

## Required plan coverage

- **Files:** `public/models/stockholm-chair.glb` (replaced) and `docs/3D-ASSETS.md`, plus this plan, `00-overview.md`, `00-index.md` and the intake. No source code changes; no `package.json` change.
- **State:** Not applicable — no shared or local application state changes.
- **3D:**
  - Camera: unchanged.
  - Model/assets: the GLB gains one image and one texture; `Chair_Fabric` is re-pointed to them; geometry and names are unchanged.
  - Environment: unchanged.
  - Lighting: unchanged.
  - Timelines: unchanged.
- **RTL / LTR:** Not applicable — the asset is locale-independent and 3D is never mirrored.
- **Performance:**
  - GLB +~160–270 KB, still ≤ 10 MB.
  - One more 1K texture upload on the GPU (~4 MB uncompressed RGBA plus mips).
  - No bundle change.
- **Tests & verification:** tasks 4 and 5, plus `npm run lint`, `npx tsc --noEmit` and `npm run build`, as a regression check.
- **Risks:**
  - (a) Grey-only too dark → the ffmpeg lift fallback, then a gate.
  - (b) 1K too soft → gate.
  - (c) The `copy` round trip changes other bytes → caught by the hashes and inspect diff in task 4.
  - (d) Visual regression of the wood → a side-by-side check against `main`.
- **Out of scope & deferred:** see Story Goal. US-201 re-verification happens when 3DMODEL-10 resumes.

---

## Edge Cases & Failure Modes

- **The `copy` round trip reorders buffers or bufferViews:** acceptable. Only the content equality in task 4 matters (image hashes, accessor counts, bounds).
- **The Blender exporter's texture duplication (9 textures over 3 images) is kept:** do not dedup; it is out of scope.
- **A grey JPEG decoded as single-channel:** avoided by the sRGB conversion in task 2.
- **The size lands above 10 MB (not expected):** gate; do not lower the quality below the Q60 start without a decision.

---

## Test Plan

No automated test framework exists. Verification is structural (task 4) and visual (task 5) in the browser.

---

## Verification Steps

1. **Structural:** task 4 output (inspect diff, assignment check, hashes, validate, size).
2. **Browser:** task 5 screenshots, both the product view and the close-ups, neutral plus four tints, and the wood compared against `main`; no console errors.
3. **Regression:** `npm run lint`, `npx tsc --noEmit`, `npm run build`; `/en` and `/ar` still render the chair; the US-101/102/103 behaviors are unaffected, since the asset is identical except for the fabric texture.

---

## Done Criteria

- [ ] `Chair_Fabric` uses an independent neutral base-color texture; `Chair_Wood` and `Material_0.001` use the original.
- [ ] Fabric detail is visibly preserved in the product and close-up views.
- [ ] The four approved colors are distinguishable and read as their names under the existing lighting.
- [ ] GLB ≤ 10 MB; geometry, names and bounds unchanged; no new dependency; no compression.
- [ ] `docs/3D-ASSETS.md` documents the treatment, the tools and versions, the size, and that US-601 still owns optimization.

**STOP HERE. Report to the user and wait for confirmation before resuming Story 10 (3DMODEL-10).**

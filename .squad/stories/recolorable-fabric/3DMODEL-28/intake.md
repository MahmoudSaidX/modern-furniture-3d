# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/recolorable-fabric/3DMODEL-28/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** Recolorable Fabric
- **Feature slug (folder under `plans/`):** `recolorable-fabric`

## Tracker (metadata only)

- **Tracker type:** `none (Linear, read via connector)`
- **Work item id:** `3DMODEL-28` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story (feat)`
- **Status:** `Backlog`
- **Assignee:** ``
- **Labels:** `none`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Recolorable Fabric Asset for Color Customization
```

---

## Description

```md
## User Story

As a customer, I want the chair's upholstery colors to look like their names so I can trust the color I choose.

## Context

US-201 (3DMODEL-10) tints the `Chair_Fabric` material by multiplying the approved palette color over its base color. Verification on 2026-09-23 found the current fabric base color is dark brown, so under the existing Product Scene lighting Sand no longer reads as sand and Olive/Charcoal are hard to tell apart. A brightness multiplier, texture removal or palette change were rejected; the fix belongs in the asset.

Approved US-201 palette (tint-based): Sand #B8A58F, Olive #6F7456, Terracotta #A9654B, Charcoal #4A4947.

## Business Rules

* Outcome-based: inspect the asset pipeline before choosing how the neutral treatment is achieved; no single texture channel is prescribed.
* Do not change geometry, semantic structure, `Chair_Wood`, or `Material_0.001`.
* Existing asset/texture budgets (docs/3D-ASSETS.md) still apply unless another documented decision is required.

## RTL/LTR

Not applicable to the asset itself; 3D world coordinates are never mirrored for RTL.
```

---

## Acceptance criteria

```md
* `Chair_Fabric` is suitable for the already-approved tint-based Sand, Olive, Terracotta and Charcoal customization, using a neutral recolorable fabric treatment.
* Visible fabric detail is preserved.
* All four approved colors are visually distinguishable and reasonably represent their names under the existing Product Scene lighting.
```

---

## RTL / LTR requirements

Source: Linear: Not applicable to the asset itself; 3D world coordinates are never mirrored for RTL.

## 3D / Scene requirements

Source: Linear business rules (above). Asset inspection (2026-09-26, `public/models/stockholm-chair.glb`):

- 3 materials (`Material_0.001`, `Chair_Fabric`, `Chair_Wood`) all reference the **same** 3 JPEG images: normal (Image_2, 2.39 MB), base color (Image_0, 3.25 MB), metallic-roughness (Image_1, 1.76 MB); one shared sampler.
- The base-color image is a baked atlas: fabric and wood UV islands interleave across it. Editing it in place would also change `Chair_Wood` and `Material_0.001`.
- Blender glTF exporter v5.2.40; no extensions; 1 buffer.

## Cinematic requirements

Not applicable — the story changes an asset; camera, timelines and lighting are unchanged ("under the existing Product Scene lighting").

## Performance requirements

Source: Linear: Existing asset/texture budgets (docs/3D-ASSETS.md) still apply unless another documented decision is required. Current GLB 9,821,512 bytes: over the 5 MB target, under the 10 MB ceiling (documented exception) — about 180 KB headroom.

## Edge cases

- Any texture edit must not alter how `Chair_Wood` or `Material_0.001` render.
- The US-201 runtime tints `Chair_Fabric` by material name on a clone; the material name must stay `Chair_Fabric`.

---

## Attachments

Place files in `attachments/` next to this `intake.md`, then list them here so the planner knows what to open.

| File (relative to this folder) | What it is |
| ------------------------------ | ---------- |

None.

---

## Dependencies

- **Blocked by / related ids:** Blocks 3DMODEL-10 (US-201 — Change Product Color, Backlog; its implementation is preserved in a git stash pending this story).
- **Depends on code areas or other stories:** `public/models/stockholm-chair.glb`, `docs/3D-ASSETS.md`.

## Extra notes (optional)

- Created 2026-09-26 by human decision during the 3DMODEL-10 run: outcome-based; not S0-11; not an expansion of US-601.

## Technical hints (optional)

- APIs, screens, services already discussed. Repos/roots: `.`. Primary language: `typescript`.

## Out of scope

- What this story explicitly does **not** cover: geometry, semantic structure, `Chair_Wood`, `Material_0.001` (Linear); US-103 detail-copy contrast (3DMODEL-29, human decision); US-201 runtime code.

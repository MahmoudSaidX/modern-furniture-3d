# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/3d-asset-standards/3DMODEL-17/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** 3D Asset Standards
- **Feature slug (folder under `plans/`):** `3d-asset-standards`

## Tracker (metadata only)

- **Tracker type:** `none (Linear, read via connector)`
- **Work item id:** `3DMODEL-17`
- **Work item type:** `Story (docs)`
- **Status:** `Backlog`
- **Assignee:** ``
- **Labels:** `none`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
S0-06 — Define 3D Asset Standards
```

---

## Description

```md
## User Story

As a developer, I want consistent asset conventions so furniture can be customized and reused predictably.

## Business Rules

* Avoid oversized geometry/textures
* merge decorative geometry only when safe
* reuse one product asset across scenes.

## Scene / Cinematic Requirements

Same product model renders in Product Studio and Interior Context.
```

---

## Acceptance criteria

```md
* Document GLB/GLTF naming, independently addressable customizable parts, scale/origin, and web optimization.
```

---

## Attachments

Place files in `attachments/` next to this `intake.md`, then list them here so the planner knows what to open.

| File (relative to this folder) | What it is |
| ------------------------------ | ---------- |
None.

---

## Dependencies

- **Blocked by / related ids:** 3DMODEL-18 (S0-05 — Establish 3D Technology Foundation) — Done. Blocks 3DMODEL-9 (US-202), 3DMODEL-10 (US-201), 3DMODEL-11 (US-103), 3DMODEL-13 (US-101).
- **Depends on code areas or other stories:** `docs/ARCHITECTURE.md` (3D rules, Product Scene / Context Scene boundaries); `public/models/stockholm-chair.glb` (from 3DMODEL-18).

## Extra notes (optional)

- **Linear comments/attachments:** none.
- **Human decisions (recorded 2026-09-23, verbatim):** "Q1a, Q2b, Q3a. Propose the standards using these decisions: meters, Y-up, -Z front, floor-center origin with base at Y=0, kebab-case asset filenames, semantic PascalCase node and material names, independently customizable parts represented by a semantic named node with a semantic named material, target <=80k triangles for the primary product, target <=2K textures, target <=5 MB primary GLB with 10 MB as a documented-exception ceiling, Meshopt preferred for geometry compression and KTX2/Basis for optimized runtime textures. Treat numeric budgets as targets requiring justification when exceeded, not arbitrary hard build failures. One canonical product asset must be reusable across Product Studio and Interior Context. Document the current Stockholm chair deviations but do not modify or optimize the asset in S0-06. Put the detailed standard in docs/3D-ASSETS.md and link it from ARCHITECTURE.md. Stop again if the plan reveals another unresolved decision."
- **Current asset facts (`public/models/stockholm-chair.glb`, inspected from its glTF JSON):** generator Khronos glTF Blender I/O v5.2.40; 1 node `Stockholm_Chair_Web` → 1 mesh `Stockholm_Chair_Web_mesh` with 3 primitives (POSITION counts 2759, 26178, 31558); materials `Material_0.001`, `Chair_Fabric`, `Chair_Wood`; 3 JPEG images; no `extensionsUsed` (no Meshopt/Draco/KTX2); file 9,821,512 bytes (~9.8 MB); bounds X ≈ ±0.337, Y 0 → 0.85, Z ≈ −0.444 → 0.444 (meters, Y-up, base at Y=0, floor-centred).

## Technical hints (optional)

- APIs, screens, services already discussed. Repos/roots: `.`. Primary language: `typescript`.

## Out of scope

- What this story explicitly does **not** cover (per recorded decision):
  - Modifying or optimizing `stockholm-chair.glb` (deviations are documented only).
  - Build-time enforcement of budgets (budgets are targets requiring justification, not hard build failures).

# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/product-color/3DMODEL-10/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** Product Color
- **Feature slug (folder under `plans/`):** `product-color`

## Tracker (metadata only)

- **Tracker type:** `none (Linear, read via connector)`
- **Work item id:** `3DMODEL-10` _(used in filenames and plan tables; fill manually if empty)_
- **Work item type:** `Story (feat)`
- **Status:** `Backlog`
- **Assignee:** ``
- **Labels:** `none`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

```md
US-201 — Change Product Color
```

---

## Description

```md
## User Story

As a customer, I want to change furniture color so I can find a variation that suits my space.

## Business Rules

- Only predefined colors
- update intended mesh/material only.

## RTL/LTR

All user-facing UI and copy must support English LTR and Arabic RTL where applicable. 3D world coordinates are never mirrored for RTL.

## Scene / Cinematic Requirements

Camera remains stable; optional subtle material transition only.
```

---

## Acceptance criteria

```md
- Available colors and selected state
- relevant 3D material updates without reload
- persists across scenes
- AR/EN RTL/LTR.
```

---

## RTL / LTR requirements

Source: Linear "RTL/LTR" (verbatim): All user-facing UI and copy must support English LTR and Arabic RTL where applicable. 3D world coordinates are never mirrored for RTL.

Recorded decision (Q1): color names are localized — EN Sand / Olive / Terracotta / Charcoal; AR رملي / زيتوني / طوبي / فحمي. Color ids are internal and never translated.

## 3D / Scene requirements

Source: Linear "Business Rules": update intended mesh/material only.

Recorded decisions (verbatim, human, 2026-09-23):

- Q2 — Choose A: change Chair_Fabric only. Leave Chair_Wood unchanged and do not touch the unidentified Material_0.001. Treat this story as upholstery color selection; material customization remains US-202.
- Q3 — Choose A: tint the existing fabric texture through the material color so the texture detail remains visible. The palette hex values define the product/UI selections; they do not require exact rendered pixel matching after texture, lighting and color management. If visual verification shows that any approved palette color becomes materially unusable or muddy with the existing texture, stop at a Decision Gate rather than removing/replacing the texture or changing the palette automatically.
- Target the fabric through its material name/semantic identifier, not a primitive or child index. Because the GLTF may be cached/shared, do not mutate a shared cached material in a way that can leak state between scene instances; use safe instance-level material ownership if necessary.
- Stop at another Decision Gate if the actual GLB/material behavior makes safe isolated tinting impossible or if visual verification shows the palette is not viable with the existing fabric texture.

Asset context (from docs/3D-ASSETS.md): `stockholm-chair.glb` has 1 node, 1 mesh with 3 primitives; parts are addressable only by material (`Material_0.001`, `Chair_Fabric`, `Chair_Wood`); textures are 3 × 2048² JPEG.

## Cinematic requirements

Source: Linear: Camera remains stable; optional subtle material transition only.

Recorded decision: Camera behavior remains unchanged. A subtle material transition is optional and should not add complexity or a new dependency.

## Performance requirements

Not applicable as a separate Linear requirement — Linear states none beyond "without reload". Recorded decision: no new dependency for the transition.

## Edge cases

- Selecting the already-selected color is a no-op in effect (selected state unchanged).
- Selected color must survive scene-state and focus transitions (Q4).
- Material isolation: the color must not leak into other scene instances sharing the cached GLTF (recorded decision).
- A palette color unusable over the texture → Decision Gate, not an automatic change (Q3).

## Palette (recorded decision Q1, verbatim)

sand: EN Sand, AR رملي, #B8A58F, default
olive: EN Olive, AR زيتوني, #6F7456
terracotta: EN Terracotta, AR طوبي, #A9654B
charcoal: EN Charcoal, AR فحمي, #4A4947

## Shared state (recorded decision Q4, verbatim)

Choose A: store the selected color in Zustand as session-level shared state so it survives scene-state/focus transitions and can be consumed by future scenes. Do not add reload persistence, persist middleware, localStorage or URL state in US-201.

---

## Attachments

None.

---

## Dependencies

- **Blocked by / related ids:** 3DMODEL-17 (S0-06 — Define 3D Asset Standards, Done), 3DMODEL-15 (S0-08 — Configure Lightweight Shared State, Done), 3DMODEL-13 (US-101 — Interactive 3D Furniture Product, Done), 3DMODEL-28 (Recolorable Fabric Asset for Color Customization, Done — merged in PR #15). Blocks 3DMODEL-7 (US-301 — Transition Product Into Room) and 3DMODEL-8 (US-203 — Dynamic Configuration Pricing).
- **Depends on code areas or other stories:** `src/features/product-scene/ProductScene.tsx`, `src/data/products.ts`, `src/state/experience-store.ts`, `src/i18n/dictionaries/`.

## Extra notes (optional)

- Decisions above recorded verbatim from the human reply on 2026-09-23.
- Stage 8 finding (2026-09-23): the `Chair_Fabric` base-color texture is dark brown; tinted, Sand reads dark taupe, Olive and Charcoal are near-black.
- Q5 (human, verbatim excerpt): "Choose C conceptually, but do not change the asset inside US-201. ... Do not add a brightness multiplier, remove the texture, change the approved palette, or accept misleading rendered colors. Record this as an asset-pipeline blocker for acceptable color customization. ... US-201 should not be considered verification-complete until the approved palette can be visually distinguished and reasonably represents its named colors."
- Blocker status (2026-09-26): the Q5 asset-pipeline blocker was resolved by merged 3DMODEL-28 (`Chair_Fabric` now has an independent neutral base-color texture); US-201 verification is rerun against that asset.
- Q6 (human, verbatim excerpt): "Choose A. Below sm, place the color controls in their own row below the product name/tagline/detail-copy area. At sm and above, keep the existing top inline-end placement. Do not move them into the bottom control stack."

## Technical hints (optional)

- APIs, screens, services already discussed. Repos/roots: `.`. Primary language: `typescript`.

## Out of scope

- Material customization (US-202) — recorded decision Q2.
- Changing `Chair_Wood` or `Material_0.001` — recorded decision Q2.
- Reload persistence, persist middleware, localStorage or URL state — recorded decision Q4.
- Removing/replacing the fabric texture or changing the palette — recorded decision Q3.

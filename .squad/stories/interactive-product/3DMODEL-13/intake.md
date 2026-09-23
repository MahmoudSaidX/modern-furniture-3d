# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/interactive-product/3DMODEL-13/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** Interactive 3D Product
- **Feature slug (folder under `plans/`):** `interactive-product`

## Tracker (metadata only)

- **Tracker type:** `none (Linear, read via connector)`
- **Work item id:** `3DMODEL-13` _(used in filenames and plan tables; fill manually if empty)_
- **Work item type:** `Story (feat)`
- **Status:** `Backlog`
- **Assignee:** ``
- **Labels:** `none`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

```md
US-101 — Interactive 3D Furniture Product
```

---

## Description

```md
## User Story

As a customer, I want to inspect furniture in 3D so I can understand its design before purchasing.

## Business Rules

- Start with one fully supported product
- configuration survives camera interaction
- no fully free controls.

## RTL/LTR

All user-facing UI and copy must support English LTR and Arabic RTL where applicable. 3D world coordinates are never mirrored for RTL.

## Scene / Cinematic Requirements

Premium neutral Product Studio with soft lighting/shadows; furniture is the focal point.
```

---

## Acceptance criteria

```md
- Model loads with loading state
- rotate, zoom, reset
- mouse/touch
- constrained camera
- responsive framing.
```

---

## RTL / LTR requirements

From Linear: "All user-facing UI and copy must support English LTR and Arabic RTL where applicable. 3D world coordinates are never mirrored for RTL." Per decision: Zoom In, Zoom Out and Reset View controls are localized and accessible; the loading state is localized DOM.

## 3D / Scene requirements

From Linear: "Premium neutral Product Studio with soft lighting/shadows; furniture is the focal point." Per decision: light neutral background, soft lighting, local lightformers, soft contact shadows; no room, props, CDN HDR or new dependency. Camera: 360° horizontal orbit, no panning, never below the floor, constrained vertical orbit, zoom/framing distances derived from the model's actual bounds. Asset: `public/models/stockholm-chair.glb` (front faces +Z — documented deviation in `docs/3D-ASSETS.md`); not modified, accommodated only for framing.

## Cinematic requirements

Not applicable — per decision, the S0-07 placeholder GSAP rotation is removed; cinematic intro belongs to US-102.

## Performance requirements

Not applicable — Linear states none for this story. Asset optimization belongs to US-601 (per `docs/3D-ASSETS.md`).

## Edge cases

Linear lists none. Per decision: Reset returns only the camera to the canonical view and never resets or writes product/configuration state; camera interaction stays out of Zustand.

---

## Attachments

| File (relative to this folder) | What it is |
| ------------------------------ | ---------- |

None. (Linear issue has no attachments or comments.)

---

## Dependencies

- **Blocked by / related ids:** 3DMODEL-18 (S0-05 — 3D Technology Foundation) — Done; 3DMODEL-15 (S0-08 — Lightweight Shared State) — Done; 3DMODEL-17 (S0-06 — 3D Asset Standards) — Done. Blocks 3DMODEL-1, -7, -9, -10, -11, -12.
- **Depends on code areas or other stories:** `src/features/product-scene/ProductScene.tsx`, `src/app/[lang]/page.tsx`, `src/app/[lang]/dev/scene/page.tsx`, `src/i18n/dictionaries/{en,ar}.ts`, `src/state/experience-store.ts`, `docs/ARCHITECTURE.md`, `docs/ANIMATION.md`, `docs/3D-ASSETS.md`.

## Extra notes (optional)

Recorded human decision (Stage 2). Options offered — Q1 placement (A home `/[lang]`, B product route, C promote dev route); Q2 controls (A gestures + Reset, B gestures + Zoom In/Out/Reset); Q3 constraints (A 360° azimuth, limited polar, fitted zoom, no pan); Q4 config survival (A camera writes nothing to store, B add config state); Q5 studio (A neutral bg, contact shadows, local lightformers); Q6 S0-07 rotation (A remove, B keep).

Human answer (verbatim):

> Q1-A, Q2-B, Q3-A with model-aware constraints, Q4-A, Q5-A, Q6-A. Put the customer-facing Product Studio on /[lang] for the currently supported Stockholm Chair; do not introduce product/catalog routing yet. Provide drag/wheel/pinch controls plus localized accessible Zoom In, Zoom Out and Reset View controls. Allow 360-degree horizontal orbit, disable panning, prevent the camera from going below the floor, constrain vertical orbit appropriately, and derive zoom/framing distances from the actual model bounds rather than arbitrary fixed distances. Reset returns only the camera to a canonical product view and must not reset or write product/configuration state. Keep camera interaction out of Zustand. Use a premium but minimal neutral Product Studio: light neutral background, soft lighting, local lightformers and soft contact shadows, with no room, props, CDN HDR or new dependency. Remove the S0-07 placeholder GSAP rotation; cinematic intro behavior belongs to US-102. Do not modify the GLB to fix its known +Z-facing asset deviation in this story; accommodate the current asset only as needed for camera framing. Stop again if another unresolved decision appears.

## Technical hints (optional)

- Repos/roots: `.`. Primary language: `typescript`. Stack: Next.js 16 App Router, R3F 9, Drei 10, three 0.186, Zustand 5, Tailwind 4.

## Out of scope

- Per recorded decision:
  - Product/catalog routing.
  - Modifying the GLB (its +Z-facing deviation).
  - Cinematic intro (US-102); adding configuration state (US-201/202).
  - Room, props, CDN HDR, new dependencies.

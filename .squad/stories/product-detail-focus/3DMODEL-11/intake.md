# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/product-detail-focus/3DMODEL-11/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** Product Detail Focus
- **Feature slug (folder under `plans/`):** `product-detail-focus`

## Tracker (metadata only)

- **Tracker type:** `none (Linear, read via connector)`
- **Work item id:** `3DMODEL-11` _(used in filenames and plan tables; fill manually if empty)_
- **Work item type:** `Story (feat)`
- **Status:** `Backlog`
- **Assignee:** ``
- **Labels:** `none`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

```md
US-103 — Product Detail Focus
```

---

## Description

```md
## User Story

As a customer, I want to focus on important parts so I can understand materials and craftsmanship.

## Business Rules

- Only meaningful parts get focus points
- coordinates live in product/scene data, not scattered magic numbers.

## RTL/LTR

All user-facing UI and copy must support English LTR and Arabic RTL where applicable. 3D world coordinates are never mirrored for RTL.

## Scene / Cinematic Requirements

Full product → controlled detail camera move → inspection hold → smooth return.
```

---

## Acceptance criteria

```md
- Applicable Fabric/Cushion/Frame/Legs focus actions
- smooth camera target
- localized detail copy
- reset to full view.
```

---

## RTL / LTR requirements

From Linear: "All user-facing UI and copy must support English LTR and Arabic RTL where applicable. 3D world coordinates are never mirrored for RTL." Per decision, each region has a localized name and one sentence (see Extra notes). Focus poses are world coordinates shared by every locale.

## 3D / Scene requirements

From Linear: "coordinates live in product/scene data, not scattered magic numbers." Per decision:

- Four semantic **visual inspection regions**: Fabric (upper/back upholstery), Cushion (seat area), Frame (side/back structure), Legs (lower/base structure). They are not claims that the GLB contains four separately addressable meshes or nodes.
- Each region's identity, localized content, camera pose and target live in product/scene data.
- Do not modify the GLB, and do not hide the documented semantic-part asset gap (`docs/3D-ASSETS.md`, "Current deviations").
- Reset returns to the shared canonical full-product framing from US-101/US-102.

## Cinematic requirements

From Linear: "Full product → controlled detail camera move → inspection hold → smooth return." Per decision:

- After a focus move completes, hold that inspection view indefinitely until the user selects another region or Reset.
- Selecting another region moves directly from the current view to the new region, with no mandatory return to the full view in between.
- Reset returns to the canonical full-product framing.
- Reduced motion (`prefers-reduced-motion: reduce`): apply focus and reset poses immediately, with no camera tween.
- Interruption during a focus transition: meaningful manual viewer interaction kills the focus timeline **at its current camera pose** and hands control to OrbitControls from there. This is unlike the intro, which snaps to the final pose. Reset remains the explicit way back to the canonical full view. Document this distinction from the cinematic-intro interruption behaviour in the animation contract (`docs/ANIMATION.md`).

## Performance requirements

Not applicable — Linear states no performance requirement for this story. Asset optimization belongs to US-601.

## Edge cases

Per decision: selecting a region during another region's move goes straight to the new region; manual interaction mid-move stops at the current pose; reduced motion applies poses without tweens; the hold lasts until another region or Reset. Linear lists no others.

---

## Attachments

| File (relative to this folder) | What it is |
| ------------------------------ | ---------- |

None. (Linear issue has no attachments or comments.)

---

## Dependencies

- **Blocked by / related ids:** 3DMODEL-17 (S0-06 — Define 3D Asset Standards) — Done; 3DMODEL-13 (US-101 — Interactive 3D Furniture Product) — Done.
- **Depends on code areas or other stories:** `src/features/product-scene/ProductScene.tsx`, `src/data/products.ts`, `src/app/[lang]/page.tsx`, `src/app/[lang]/dev/scene/page.tsx`, `src/i18n/dictionaries/{en,ar}.ts`, `docs/ANIMATION.md`, `docs/3D-ASSETS.md`. US-102 (3DMODEL-12, Done) intro and canonical pose contract.

## Extra notes (optional)

Recorded human decisions (Stage 2), verbatim.

Decision 1 (parts, copy, hold, motion):

> Q1-1c, Q2-2b, Q3-3a, Q4 with the clarified behavior below. Provide four semantic inspection regions for this chair: Fabric, Cushion, Frame and Legs. These are visual focus regions, not claims that the GLB contains four separately addressable meshes/nodes. Fabric should focus the upper/back upholstery, Cushion the seat area, Frame the side/back wooden structure, and Legs the lower/base structure. Store each region's identity, localized content, camera pose and target in product/scene data rather than component magic numbers. Do not modify the GLB or hide the documented semantic-part asset gap. For detail copy, draft an English and Arabic localized name plus one short sentence for each region, but stop at a Decision Gate for copy approval before planning. Do not invent unsupported material, construction, durability or specification claims. After a focus move completes, hold that inspection view indefinitely until the user selects another region or Reset. Selecting another region moves directly from the current view to the new region; no mandatory return to the full view in between. Reset returns to the shared canonical full-product framing from US-101/102. For reduced motion, apply focus and reset poses immediately with no camera tween. For interruption during a focus transition, do not reuse the intro's snap-to-final behavior: meaningful manual viewer interaction must kill the focus timeline at its current camera pose and hand control to OrbitControls from there. Reset remains the explicit way back to the canonical full view. Document this distinction from cinematic-intro interruption behavior in the animation contract. Stop for the copy approval Decision Gate before generating the plan, and stop again for any other unresolved decision.

Decision 2 (approved copy):

> B. Approve with these edits:
>
> Fabric — EN: Explore the upholstery across the backrest. AR: استكشف تفاصيل التنجيد على امتداد مسند الظهر.
>
> Cushion — EN: Explore the details of the seat cushion. AR: استكشف تفاصيل وسادة المقعد.
>
> Frame — EN: Explore the structure along the sides and back. AR: استكشف تفاصيل الهيكل على الجانبين والظهر.
>
> Legs — EN: Explore the chair's lower structure and legs. AR: استكشف الجزء السفلي من الهيكل والأرجل.
>
> Keep the approved names Fabric / Cushion / Frame / Legs and القماش / الوسادة / الهيكل / الأرجل. Do not use wooden or الخشبي. These remain descriptive inspection-region labels/copy, not material or construction claims. Continue to the intake and plan, then stop at the mandatory Plan Approval Gate.

Decision 3 (camera constraints and UI), verbatim:

> Q1-1b + Q2-2a, with these constraints. Keep the US-101 full-product minimum distance unchanged outside inspection mode. Each inspection region may define its own minimum camera distance in product/scene data alongside its focus pose and target. Do not adopt 0.35 m or 0.5 m as a fixed contract yet; choose and verify a safe region-specific value that produces a meaningful close-up without entering visible geometry, causing clipping, or creating unusable mobile framing. When a region becomes active, apply that region's camera constraints as part of entering inspection mode. When switching directly between regions, switch to the destination region's constraints. If manual interaction interrupts a focus transition, cancel the animation at the current pose but keep the selected region's inspection constraints active. Reset is the explicit exit from inspection mode: restore the US-101 full-product constraints, restore the shared canonical full-product pose, clear the active region, and restore the normal product tagline. For the UI, place the four region controls at bottom inline-start and keep the existing viewer controls at bottom inline-end. Keep the product name visible in the top overlay; while a region is active, replace the tagline area with that region's localized name and sentence. Use aria-pressed for the active region and aria-live="polite" for the changing detail copy. RTL changes only logical DOM positioning, never the 3D scene. Continue the plan and stop at the mandatory Plan Approval Gate; stop earlier if another unresolved decision appears.

Decision 4 (inspection orbit limits), verbatim:

> Choose A — per-region orbit limits, but do not clamp the camera visibly when a focus transition is interrupted. Each inspection region should store data-driven focus pose/target plus its safe zoom and orbit constraints (minimum/maximum distance, azimuth range and polar range as applicable). These values may differ by region and must be verified visually on desktop and mobile so they allow useful inspection without entering visible chair geometry or producing clipping. During the animated transition, GSAP remains the sole camera owner and the destination region's OrbitControls angular constraints must not be applied in a way that pulls the camera off the transition path. Once the transition reaches the region's canonical focus pose, synchronize OrbitControls and activate that region's inspection constraints. If meaningful manual interaction interrupts the transition before that point, kill the timeline and preserve the exact current camera pose with no visible snap or clamp. Keep the selected region and its detail copy active, but do not immediately force the camera into the destination angular range. Hand control back using temporary/current-pose-safe interaction constraints that do not cause a correction; the next explicit region selection may start a new controlled transition, and successful arrival activates that destination region's normal inspection constraints. Reset exits inspection mode and restores the US-101 full-product constraints and canonical full-product pose. Do not assume all four regions need identical orbit ranges. Stop if defining a safe no-snap interrupted-state constraint requires another product/architecture decision; otherwise continue to the plan and mandatory Plan Approval Gate.

Decision 5 (plan review), verbatim:

> Revise the plan with one state-ownership change before approval: do not write DETAIL or PRODUCT to the shared Zustand sceneState in US-103. Keep inspection mode represented entirely by the local activeRegion; camera/detail inspection does not yet require an application-level scene-state transition, and this story should not establish broader semantics for the existing DETAIL state without a consumer that needs it. Therefore there are no Zustand changes in this story. I approve the proposed accessible group label: EN Product details, AR تفاصيل المنتج. I also approve the Reset behavior: Reset with no active region remains the instant US-101 reset; Reset from an active inspection region performs the story's smooth return to the canonical full-product view, except under reduced motion where it applies immediately. Also clarify that any widened constraints created after an interrupted transition are temporary runtime constraints only; they must not mutate the canonical region data, and a new explicit region selection uses that region's canonical constraints again. Everything else in the plan is approved. Return the revised plan for final approval; do not implement yet.

Decision 6 (Stage 8, mobile layout), verbatim:

> Choose A — stack on narrow screens. Below the sm breakpoint, place the four region controls in their own row directly above the viewer controls, aligned from inline-start. Keep at least 44 px touch targets and ensure the two groups never overlap. Do not truncate labels, introduce horizontal scrolling, or shrink touch targets merely to preserve one row. At sm and above, keep the already approved same-bottom-edge layout unchanged. RTL should affect only logical DOM positioning/direction, never the 3D scene or camera. Treat this strictly as a responsive layout fix: do not change camera framing or region constraints to compensate for the overlay. During verification explicitly test both EN and AR at 390×844 and confirm all four region buttons and all viewer controls are visible and tappable. If the stacked overlay materially obscures the product on mobile, stop at another Decision Gate rather than changing the camera automatically. Then continue the remaining camera-limit, interruption, reduced-motion, Arabic and regression verification.

Decision 7 (Stage 8, portrait framing), verbatim:

> Choose A, implemented as an optional data-driven portrait framing override for any inspection region rather than a Legs-specific code path. Base the choice on the actual viewer/canvas aspect ratio (width < height), not a CSS breakpoint or window width. A region's portrait override should contain only the camera values that genuinely need to differ, such as focus distance and corresponding zoom limits; inherit the default target, angles and other constraints unless they also require a verified difference. Start around 1.3 m for Legs but treat that only as a tuning starting point, not a fixed requirement. Verify the final portrait framing visually so both legs/lower structure read clearly, the stacked controls do not obscure the important area, and the view still feels like a Legs inspection rather than a full-product view. Keep the existing desktop framing unchanged. Do not add portrait overrides to Fabric, Cushion or Frame unless verification shows they actually need them. Use the same generic mechanism for any region that later requires one. If changing orientation or resizing while an inspection is active creates an unresolved snap/constraint behavior, stop at another Decision Gate rather than inventing it. Then continue the remaining limit sweep, no-snap interruption, reduced-motion and US-101/US-102 regression verification.

## Technical hints (optional)

- Repos/roots: `.`. Primary language: `typescript`. Stack: Next.js 16 App Router, R3F 9, Drei 10, three 0.186, GSAP 3.15 + @gsap/react 2.1, Zustand 5, Tailwind 4.
- Asset: `public/models/stockholm-chair.glb` — one node/mesh, materials `Material_0.001`, `Chair_Fabric`, `Chair_Wood`; meters, Y-up, base at Y = 0, centred on X/Z; bounds X ±0.337, Y 0–0.85, Z ±0.444; front faces +Z.

## Out of scope

- Per recorded decision:
  - Modifying the GLB or splitting it into semantic part nodes.
  - Material, construction, durability or specification claims in the copy.
  - A mandatory return to the full view between regions.
  - The intro's snap-to-final behaviour for focus interruption.

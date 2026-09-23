# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/cinematic-intro/3DMODEL-12/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** Cinematic Product Introduction
- **Feature slug (folder under `plans/`):** `cinematic-intro`

## Tracker (metadata only)

- **Tracker type:** `none (Linear, read via connector)`
- **Work item id:** `3DMODEL-12` _(used in filenames and plan tables; fill manually if empty)_
- **Work item type:** `Story (feat)`
- **Status:** `Backlog`
- **Assignee:** ``
- **Labels:** `none`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

```md
US-102 — Cinematic Product Introduction
```

---

## Description

```md
## User Story

As a customer, I want a short cinematic introduction so the product feels premium without delaying exploration.

## Business Rules

* Never create a blocking intro.

## RTL/LTR

All user-facing UI and copy must support English LTR and Arabic RTL where applicable. 3D world coordinates are never mirrored for RTL.

## Scene / Cinematic Requirements

Minimal environment → product reveal → subtle camera/model movement → final framing → localized name/tagline/price/controls.
```

---

## Acceptance criteria

```md
* Reveal after required assets are ready
* wide-to-final camera move
* coordinated UI reveal
* interruptible
* approximately 2–4 seconds
* reduced-motion considered.
```

---

## RTL / LTR requirements

From Linear: "All user-facing UI and copy must support English LTR and Arabic RTL where applicable. 3D world coordinates are never mirrored for RTL." Per decision: the revealed overlay shows the localized product name and tagline (EN "Designed for quiet moments." / AR "صُمم للحظات الهادئة.") and the existing localized viewer controls; layout uses logical CSS; timelines never read locale or `dir`.

## 3D / Scene requirements

From Linear: "Minimal environment → product reveal → subtle camera/model movement → final framing". Per decision: the cinematic final camera framing and the US-101 Reset View share the same canonical final framing contract, so completing/skipping the intro and pressing Reset produce the same view. Existing Product Studio (background, lightformers, contact shadows, model `public/models/stockholm-chair.glb`) is unchanged.

## Cinematic requirements

From Linear: wide-to-final camera move, approximately 2–4 seconds, reveal after required assets are ready, coordinated UI reveal, interruptible, never blocking. Per decision:
- Choreography stays inside the Product Scene boundary; only the scene overlay is animated/revealed, not the page-level heading/caption.
- Interruption = pointer/touch interaction, wheel interaction, OrbitControls interaction start, or activation of Zoom In, Zoom Out or Reset View. On interruption: kill the intro timeline, immediately apply the canonical final camera state, reveal the final UI, hand control to the user; no intermediate freeze, the skip itself is not animated.
- The intro does not restart during the same mount.
- `prefers-reduced-motion: reduce`: skip the intro entirely — start at the canonical final framing and show the final UI immediately; no replacement camera animation or required fade.

## Performance requirements

Not applicable — Linear states none beyond "never create a blocking intro" (a business rule, covered above). Asset optimization belongs to US-601.

## Edge cases

Per decision: interruption at any point jumps to the final state; reduced motion skips the intro; no restart within the same mount. Linear lists no others.

---

## Attachments

| File (relative to this folder) | What it is |
| ------------------------------ | ---------- |

None. (Linear issue has no attachments or comments.)

---

## Dependencies

- **Blocked by / related ids:** 3DMODEL-13 (US-101 — Interactive 3D Furniture Product) — Done; 3DMODEL-16 (S0-07 — Animation & Cinematic Architecture) — Done.
- **Depends on code areas or other stories:** `src/features/product-scene/ProductScene.tsx`, `src/data/products.ts`, `src/app/[lang]/page.tsx`, `src/app/[lang]/dev/scene/page.tsx`, `src/i18n/dictionaries/{en,ar}.ts`, `docs/ANIMATION.md`, `docs/ARCHITECTURE.md`.

## Extra notes (optional)

Recorded human decision (Stage 2). Questions: Q1 tagline/price (1a provide copy+price, 1b tagline only, defer price to US-203, 1c reuse description, no price); Q2 reduced motion (2a skip, 2b fade); Q3 reveal scope (3a scene overlay only, 3b also page text); Q4 interruption (4a any input jumps to final, 4b freeze in place).

Human answer (verbatim):

> 1b + 2a + 3a + 4a. Add a real localized product tagline and use Designed for quiet moments. for English and صُمم للحظات الهادئة. for Arabic. Do not add or invent a price in US-102; explicitly defer price to US-203, which owns dynamic configuration pricing. The final reveal contains the localized product name, tagline and existing viewer controls, with no placeholder price. For prefers-reduced-motion: reduce, skip the cinematic camera intro entirely: start at the canonical final framing and show the final UI immediately, with no replacement camera animation or required fade. Keep cinematic choreography inside the Product Scene boundary; animate/reveal the scene overlay only, not the page-level heading/caption. Interruption means meaningful interaction with the viewer: pointer/touch interaction, wheel interaction, OrbitControls interaction start, or activation of Zoom In, Zoom Out or Reset View. On interruption, kill the intro timeline, immediately apply the canonical final camera state, reveal the final UI, and hand control to the user; do not freeze at an intermediate camera pose and do not animate the skip itself. The intro must not restart during the same mount. The cinematic final camera framing and US-101 Reset View must share the same canonical final framing contract so completing/skipping the intro and pressing Reset do not produce different product views. Stop again if another unresolved decision appears.

## Technical hints (optional)

- Repos/roots: `.`. Primary language: `typescript`. Stack: Next.js 16 App Router, R3F 9, Drei 10, three 0.186, GSAP 3.15 + @gsap/react 2.1, Zustand 5, Tailwind 4.

## Out of scope

- Per recorded decision:
  - Price (deferred to US-203 — Dynamic Configuration Pricing); no placeholder price.
  - Animating page-level heading/caption.
  - Restarting the intro within the same mount.
  - A replacement animation for reduced motion.

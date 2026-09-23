# Story 01 — S0-05 Establish 3D Technology Foundation (Story: 3DMODEL-18)

## Prerequisites

- S0-01 (3DMODEL-22, delivered as CRM-215), S0-02 (3DMODEL-21), S0-03 (3DMODEL-20) and S0-04 (3DMODEL-19) merged on `main`: `[lang]` routing, typed dictionaries, `<html dir>`.
- No prior plans exist under `.squad/plans/`; this is the first plan.

---

## Story Goal

A developer-only scene at `/en/dev/scene` and `/ar/dev/scene` that:

1. renders an R3F `<Canvas>` which fills its container and resizes with the viewport;
2. loads the Stockholm Chair GLB from `public/models/stockholm-chair.glb`;
3. has basic environment/lighting and orbit controls;
4. shows a localized DOM loading overlay while the model loads.

The route returns 404 in production builds. **Not in scope:** a production scene, a generic 3D engine, asset optimization or modification, cinematic/animation, shared state.

---

## Context — Read These Files First

1. `docs/ARCHITECTURE.md` — "Scene copy rule", "3D is never mirrored", "Intended → Three.js / scene code" (Product Scene vs Context Scene), "Public 3D assets", "Principle".
2. `src/app/[lang]/layout.tsx` — lines 18–23: `dynamicParams = false` + `generateStaticParams`; lines 33–50: root layout (body is `min-h-full flex flex-col`).
3. `src/app/[lang]/page.tsx` — lines 4–6: page pattern `getDictionary()` in an async Server Component.
4. `src/i18n/dictionaries/en.ts` lines 13–20 and `src/i18n/dictionaries/ar.ts` lines 15–20 — `scene` key; `ar` must `satisfies Dictionary`.
5. `src/components/LanguageSwitcher.tsx` — client component style (`"use client"`, named export, typed props).
6. `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` — `ssr: false` only works inside Client Components.

---

## Implementation tasks

### 1 — Dependencies

`npm install three@^0.186.0 @react-three/fiber@^9.8.0 @react-three/drei@^10.7.8` and `npm install -D @types/three@^0.186.0`. (R3F peer: `react >=19 <19.4`; repo has 19.2.8.)

### 2 — Asset

Copy `/Users/mahmoudsaid/www/modern-models/stockholm-chair.glb` **unchanged** (byte-identical; verify with `shasum`) to `public/models/stockholm-chair.glb`. **Do not** optimize or modify it.

### 3 — Dictionaries

File: `src/i18n/dictionaries/en.ts` — add under `scene`: `loading: "Loading 3D model…"`.
File: `src/i18n/dictionaries/ar.ts` — add under `scene`: `loading: "جارٍ تحميل النموذج ثلاثي الأبعاد…"`.

### 4 — Product Scene

Create file: `src/features/product-scene/ProductScene.tsx` (`"use client"`).

```tsx
type ProductSceneProps = { loadingLabel: string };
export function ProductScene({ loadingLabel }: ProductSceneProps)
```

- Wrapper `<div className="relative h-full w-full">` containing `<Canvas camera={{ position: [...], fov: 45 }}>` (Canvas fills parent and tracks resize).
- Inside Canvas: `<ambientLight>`, one `<directionalLight>`, Drei `<Environment>` built from `<Lightformer>` children (**no** `preset` — presets fetch HDRs from an external CDN), `<Suspense fallback={null}>` around a `Model` component that renders `useGLTF("/models/stockholm-chair.glb").scene` through `<primitive>`, and `<OrbitControls makeDefault />`.
- Outside Canvas: `Loader` overlay using Drei `useProgress()` — while `active`, render `<p role="status" className="absolute inset-0 grid place-items-center">{loadingLabel}</p>`. No text inside the 3D scene.
- Scene code must **not** read `dir`/locale; no transforms on the canvas.

### 5 — Dev route

Create file: `src/app/[lang]/dev/scene/page.tsx` (async Server Component).

- If `process.env.NODE_ENV === "production"` → `notFound()` (from `next/navigation`).
- `const dict = await getDictionary();` render `<main className="flex flex-1 flex-col"><div className="h-[70vh] w-full"><ProductScene loadingLabel={dict.scene.loading} /></div></main>` (responsive: full width, viewport-relative height).

### 6 — Architecture doc

File: `docs/ARCHITECTURE.md` — move Product Scene and Public 3D assets into "Established": `src/features/product-scene/` (R3F/Drei; first content: dev scene), `public/models/` (GLB models; first: `stockholm-chair.glb`); note `src/app/[lang]/dev/` is a development-only route (404 in production). Context Scene stays "Intended".

No backend changes required.

---

## Edge Cases & Failure Modes

- **Production build** — `NODE_ENV === "production"` → page calls `notFound()` (task 5); `/en/dev/scene` 404s under `npm start`.
- **SSR of Canvas** — if importing `ProductScene` into the Server Component page causes SSR errors, wrap it with `next/dynamic(..., { ssr: false })` in a small client component (lazy-loading guide). Verify at runtime.
- **GLB load failure / 404** — Suspense stays pending; loader overlay stays visible. Error boundaries are out of scope (US-603).
- **RTL** — `/ar/dev/scene` renders an identical scene; only the overlay text changes.
- **Unmount** — navigating away unmounts Canvas; R3F disposes its renderer. Check no console errors after navigating from the scene to `/en`.
- **Large asset (9.8 MB)** — loading overlay visible for noticeable time; optimization deferred (S0-06 / US-601).

---

## Test Plan

No test framework exists in `package.json`; none added.

1. Smoke: `npm run dev`, open `/en/dev/scene` and `/ar/dev/scene` at 375px and 1440px — model visible, orbit works, loader shown then hidden, no console errors.
2. Smoke: `npm run build && npm start`, `/en/dev/scene` → 404.

---

## Verification Steps

1. **Static checks:** `npm run lint`, `npx tsc --noEmit` at repo root.
2. **Build:** `npm run build`.
3. **Frontend runs:** test plan items 1–2.
4. **Regression:** `/en` and `/ar` home pages unchanged.

---

## Done Criteria

- [ ] R3F and Drei installed and used (`package.json`, `ProductScene.tsx`).
- [ ] Canvas fills its container and resizes with the viewport.
- [ ] `public/models/stockholm-chair.glb` is byte-identical to the source and loads in the scene.
- [ ] Environment/lighting, orbit controls and localized loading overlay work in `/en` and `/ar`.
- [ ] Dev route 404s in production.
- [ ] `docs/ARCHITECTURE.md` updated.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 02.**

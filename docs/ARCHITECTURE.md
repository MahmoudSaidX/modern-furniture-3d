# Architecture

This document describes the intended structural boundaries of the codebase.
Physical directories are created just-in-time, with the story that first has
real implementation content for them — not in advance. No empty architecture
layers are committed.

## Established

- **Routes** — `src/app/` (Next.js App Router). All routes, layouts, and route
  handlers live here. Every route is nested under `src/app/[lang]/`, whose
  layout is the root layout; `/` redirects (temporarily) to the default
  locale `/en` via `next.config.ts`. Unsupported locales return 404.
- **Localization** (`src/i18n/`) — `config.ts` holds the supported locales,
  default locale, per-locale document direction, and `hasLocale()`.
  `dictionaries/` holds one typed dictionary per locale (`en.ts` defines the
  `Dictionary` shape; other locales must satisfy it). `get-dictionary.ts`
  resolves the locale from the `[lang]` root param (server-only). One
  page/layout implementation serves every locale — no language-specific
  components. `<html>` gets `lang` and `dir` (see Direction, below).
- **Reusable UI** (`src/components/`) — presentational components shared
  across routes (first: `LanguageSwitcher`, rendered by the root layout).
- **Static/local product data** (`src/data/`) — hardcoded product definitions.
  User-facing text is `LocalizedText` (one string per locale); internal
  IDs (product, mesh, material, asset) are never translated.
- **Scene copy rule** — scene copy lives in the dictionaries (`scene.*`),
  not in scene code. The 3D scene must not contain user-facing text — copy
  (overlay, loading state) is rendered as localized DOM over it, so one
  scene/timeline serves all locales.
- **Feature code** (`src/features/`) — feature-scoped code that isn't a
  route itself, one folder per feature (first: `product-scene/`).
- **Product Scene** (`src/features/product-scene/`) — 3D rendering for
  individual product viewing/configuration, built on React Three Fiber and
  Drei (lower-level Three.js only when genuinely needed). First content:
  `ProductScene`, a development scene (camera, environment/lighting, model,
  orbit controls, localized DOM loading overlay).
- **Public 3D assets** (`public/models/`) — GLB models served by Next.js as
  static files (first: `stockholm-chair.glb`). Asset conventions (naming,
  customizable parts, scale/origin, optimization) are defined in
  [`3D-ASSETS.md`](3D-ASSETS.md).
- **Development routes** (`src/app/[lang]/dev/`) — developer-only pages
  (first: `dev/scene`); they call `notFound()` in production builds.

## Direction (RTL/LTR)

- **Inherited, not re-implemented.** Direction comes only from `<html dir>`
  (`localeDirections` in `src/i18n/config.ts`); components inherit it. There
  are no separate Arabic components and no locale branches for layout.
- **Logical properties.** Use CSS logical properties and Tailwind's logical
  utilities (`ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `text-start`/`text-end`,
  `border-s`/`border-e`, `rounded-s`/`rounded-e`) instead of left/right
  equivalents. Enforced by review, not tooling.
- **No faked RTL.** Don't reverse DOM order or use `flex-row-reverse`/`order-*`
  to simulate RTL; flex/grid already follow `dir`, and DOM order keeps focus
  order matching visual order.
- **Mixed-direction content.** Inline content in another language gets its own
  `lang` (and `dir` when its direction differs), e.g. the language switcher
  links. Wrap embedded opposite-direction or dynamic runs (product codes,
  user text) in `<bdi>` or an element with `dir="auto"`.
- **Directional icons and interactions.** Icons that encode direction
  (back/next arrows, chevrons) flip in RTL (e.g. `rtl:-scale-x-100`);
  symmetric icons don't. Arrow-key and swipe semantics in sliders, carousels
  and tabs follow reading direction.
- **Future feature verification.** Navigation, product, configurator and cart
  stories must verify their layout and interactions in both `/en` and `/ar`
  (including responsive widths) when those features are built.
- **3D is never mirrored.** The 3D world — canvas, camera coordinates and
  paths, lighting, geometry, models, animation paths — is identical for every
  locale; scene code must not read `dir` or the locale, and the canvas must
  not be flipped by transforms. Only DOM overlays above it follow document
  direction.
- **Undecided.** Arabic typography (currently system fallback) and digit
  style for numbers/prices are deferred to the stories that need them.

## Intended (not yet created)

- **Context Scene** — 3D rendering for placing/viewing products in an
  environment (e.g. a room). Not implemented yet. When introduced, it stays a
  distinct module from the Product Scene rather than merged into one generic
  "3D" folder.
- **Lightweight shared state** — cross-component client state (e.g. a
  configurator's selected options). Its own conceptual boundary, distinct
  from shared helpers/modules. Physical structure and naming are
  intentionally deferred to S0-08, when the actual state requirements and
  tooling are introduced.

## Deliberately undecided

- **`lib/` vs. `utils/`** — not chosen. This applies only to future shared
  helpers/modules, not application state (see Lightweight shared state,
  above). Both names get used inconsistently across the ecosystem; forcing
  a choice before there's real shared code to organize would just be a
  guess. The first story that needs a shared helper/module directory should
  introduce the name it actually needs, and this document should be updated
  at that point.

## Principle

A directory under `src/` (beyond `src/app/`) is created only when a story
has real content for it. No placeholder `README.md` or `.gitkeep` files are
used to reserve structure ahead of need.

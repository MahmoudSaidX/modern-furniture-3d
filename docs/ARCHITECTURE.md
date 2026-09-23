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
  components. `<html>` gets `lang` and `dir`; RTL layout behavior is out of
  scope here (S0-04).
- **Reusable UI** (`src/components/`) — presentational components shared
  across routes (first: `LanguageSwitcher`, rendered by the root layout).
- **Static/local product data** (`src/data/`) — hardcoded product definitions.
  User-facing text is `LocalizedText` (one string per locale); internal
  IDs (product, mesh, material, asset) are never translated.
- **Scene copy rule** — cinematic overlay copy lives in the dictionaries
  (`scene.overlay`), not in scene code. No 3D scene exists yet; when one is
  introduced, it must not contain user-facing text — overlay copy is rendered
  as localized DOM over it, so one scene/timeline serves all locales.

## Intended (not yet created)

- **Feature code** (`src/features/`) — feature-scoped logic that isn't a
  route itself (e.g. a checkout flow's non-UI logic). Created with the first
  feature that needs isolation from its route.
- **Three.js / scene code** — 3D rendering logic, split into two separate
  conceptual boundaries:
  - **Product Scene** — 3D rendering for individual product configuration/viewing.
  - **Context Scene** — 3D rendering for placing/viewing products in an
    environment (e.g. a room).
  Neither scene is implemented yet. When introduced, each should remain a
  distinct module rather than merged into one generic "3D" folder.
- **Lightweight shared state** — cross-component client state (e.g. a
  configurator's selected options). Its own conceptual boundary, distinct
  from shared helpers/modules. Physical structure and naming are
  intentionally deferred to S0-08, when the actual state requirements and
  tooling are introduced.
- **Public 3D assets** — models, textures, and other static 3D assets served
  by Next.js. These belong under `public/` (Next.js's static asset
  convention), in a clearly named subfolder (e.g. `public/models/`) that will
  be documented here when the first asset is added.

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

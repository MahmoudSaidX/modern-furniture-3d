# Architecture

This document describes the intended structural boundaries of the codebase.
Physical directories are created just-in-time, with the story that first has
real implementation content for them — not in advance. No empty architecture
layers are committed.

## Established

- **Routes** — `src/app/` (Next.js App Router). All routes, layouts, and route
  handlers live here.

## Intended (not yet created)

- **Feature code** (`src/features/`) — feature-scoped logic that isn't a
  route itself (e.g. a checkout flow's non-UI logic). Created with the first
  feature that needs isolation from its route.
- **Reusable UI** (`src/components/`) — presentational components shared
  across more than one route or feature. Created with the first component
  that's actually reused.
- **Three.js / scene code** — 3D rendering logic, split into two separate
  conceptual boundaries:
  - **Product Scene** — 3D rendering for individual product configuration/viewing.
  - **Context Scene** — 3D rendering for placing/viewing products in an
    environment (e.g. a room).
  Neither scene is implemented yet. When introduced, each should remain a
  distinct module rather than merged into one generic "3D" folder.
- **Localization** — translation strings and locale routing/config. Directory
  name and structure (e.g. `src/i18n/` vs. `messages/`) to be decided by the
  story that introduces localization.
- **Lightweight shared state** — cross-component client state (e.g. a
  configurator's selected options). Its own conceptual boundary, distinct
  from shared helpers/modules. Physical structure and naming are
  intentionally deferred to S0-08, when the actual state requirements and
  tooling are introduced.
- **Static/local product data** (`src/data/`) — hardcoded/local product
  definitions used before a real data source exists. Preferred future
  location is `src/data/`, but it is only created once a story has actual
  product data to place there (e.g. S0-02 does not).
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

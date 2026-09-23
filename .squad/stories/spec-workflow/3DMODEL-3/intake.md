# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/spec-workflow/3DMODEL-3/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** Claude Spec-Driven Workflow
- **Feature slug (folder under `plans/`):** `spec-workflow`

## Tracker (metadata only)

- **Tracker type:** `none (Linear, read via connector)`
- **Work item id:** `3DMODEL-3` _(used in filenames and plan tables; fill manually if empty)_
- **Work item type:** `Story (docs)`
- **Status:** `Backlog`
- **Assignee:** ``
- **Labels:** `none`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

```md
S0-09 — Establish Claude Spec-Driven Workflow
```

---

## Description

```md
## User Story

As a developer, I want Claude to follow consistent specifications so AI implementation stays controlled and reviewable.

## Business Rules

- One story → one spec → one plan
- no scope expansion/opportunistic refactors
- dependencies require justification
- repo specs hold implementation detail.

## Scene / Cinematic Requirements

Every 3D story explicitly describes its scene/cinematic requirements or states none.

## Squad Kit Foundation

- Add and initialize the Squad Kit package/workflow for this repository during Foundation.
- Preserve Squad Kit-owned `.squad/` artifacts and use its generated workflow rather than hand-maintaining generated files.
- Story intake/specs live under `.squad/stories/` and implementation plans under `.squad/plans/`.
- Maintain `.squad/plans/00-index.md` as the plan index when plans are generated.
- Workflow: Linear story → Squad Kit intake/spec → plan → human review/approval → implementation → verification → commit.
- Generate plans just-in-time per story; do not pre-generate implementation plans for the entire backlog.
- Do not invent package commands in documentation; use the package's actual installed CLI/setup instructions when initializing the repository.
```

---

## Acceptance criteria

```md
- Document locations for product docs, story specs, plans, decisions
- every story has a Markdown spec
- required sections include scope/out-of-scope, AC, rules, RTL/LTR, 3D, cinematic, performance, edge cases, dependencies.
```

---

## RTL / LTR requirements

Not applicable — documentation/workflow story; no UI or layout changes.

## 3D / Scene requirements

Not applicable — no scene code changes. (Linear's scene rule is a rule the spec standard must impose on future 3D stories, captured under Description.)

## Cinematic requirements

Not applicable — no animation or timeline changes.

## Performance requirements

Not applicable — no runtime code changes.

## Edge cases

Not applicable — no runtime behaviour. Linear lists no edge cases.

---

## Attachments

| File (relative to this folder) | What it is |
| ------------------------------ | ---------- |

None. (Linear issue has no attachments or comments.)

---

## Dependencies

- **Blocked by / related ids:** 3DMODEL-22 (S0-01 — Initialize Next.js Application) — Done. Blocks 3DMODEL-14 (S0-10 — Establish Claude Planning & Review Workflow) — Backlog.
- **Depends on code areas or other stories:** squad-kit is already installed and initialized (`.squad/config.yaml`, `.squad/README.md`, `.claude/commands/squad-*.md`, existing intakes/plans for 3DMODEL-15/16/17/18, `.squad/plans/00-index.md`). `.claude/skills/next-story/SKILL.md` (repo-owned delivery workflow). `AGENTS.md` (contains a Next.js-managed block between `<!-- BEGIN:nextjs-agent-rules -->` / `<!-- END:nextjs-agent-rules -->` markers; only content outside the markers is repo-owned). `docs/ARCHITECTURE.md`, `docs/ANIMATION.md`, `docs/3D-ASSETS.md`.
- **squad-kit intake template (package-owned) headings today:** Feature, Tracker, Title, Description, Acceptance criteria, Attachments, Dependencies, Extra notes, Technical hints, Out of scope. It has no RTL/LTR, 3D/Scene, Cinematic, Performance, Edge cases or explicit Scope sections.

## Extra notes (optional)

Recorded human decision (Stage 2, verbatim):

> A2 + B1. Keep product documentation under docs/ and create subdirectories only when real content requires them. Story-specific decisions stay with the story intake/plan; cross-cutting decisions belong in the relevant owning documentation, and we should introduce a dedicated ADR/decisions directory only when real decision history justifies it. Add a repo-owned docs/SPEC-STANDARD.md defining the required spec sections, and reference it from AGENTS.md and /next-story rather than modifying squad-kit-owned templates or generated command files. When populating an intake, add missing required sections. Use "Not applicable — <reason>" only when a section genuinely does not apply; if required information is unknown or ambiguous, trigger the Decision Gate instead of writing None/N/A. Stop again if another unresolved decision appears.

## Technical hints (optional)

- Repos/roots: `.`. Primary language: `typescript`. Deliverable is documentation only.

## Out of scope

- Per recorded decision:
  - Modifying squad-kit-owned templates or generated command files (`.claude/commands/squad-*.md`, package templates).
  - Creating `docs/` subdirectories or an ADR/decisions directory without real content.
  - Re-initializing squad-kit (already initialized) or pre-generating plans for the backlog.
  - Editing the Next.js-managed block in `AGENTS.md`.

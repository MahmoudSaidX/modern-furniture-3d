# Story 05 — S0-09 Establish Claude Spec-Driven Workflow (Story: 3DMODEL-3)

## Prerequisites

- 3DMODEL-22 (S0-01 — Initialize Next.js Application) — Done.
- squad-kit already installed and initialized (`.squad/config.yaml`, `.squad/README.md`, `.claude/commands/squad-*.md`); prior stories 01–04 used it. **Do not re-run `squad init`.**
- Human decision recorded in `.squad/stories/spec-workflow/3DMODEL-3/intake.md` ("Extra notes") is binding.

---

## Story Goal

A repo-owned spec standard at `docs/SPEC-STANDARD.md`, referenced from `AGENTS.md` and `/next-story`, that:

1. documents where product docs, story specs, plans and decisions live;
2. states that every story has one Markdown spec (its Squad intake) and one plan;
3. defines the required spec sections — scope/out-of-scope, AC, business rules, RTL/LTR, 3D/scene, cinematic, performance, edge cases, dependencies — and how to fill them when the squad-kit template lacks them;
4. restates the workflow and business rules from Linear.

**Documentation only.** **Not in scope:** editing squad-kit-owned templates or `.claude/commands/squad-*.md`, editing the Next.js-managed block in `AGENTS.md`, creating `docs/` subdirectories or a decisions/ADR directory, code changes.

---

## Context — Read These Files First

1. `.squad/stories/spec-workflow/3DMODEL-3/intake.md` — Linear description, AC, recorded decision (verbatim).
2. `AGENTS.md` — the whole file is the managed block between `<!-- BEGIN:nextjs-agent-rules -->` and `<!-- END:nextjs-agent-rules -->`; add content **only after** the END marker.
3. `.claude/skills/next-story/SKILL.md` — lines 17–20 (project-rules paragraph), lines 160–173 (Stage 3 steps 2–3, intake population/review).
4. `.squad/README.md` — squad-kit workflow (intake → plan → implement); do not edit (package-managed).
5. `.squad/stories/shared-state/3DMODEL-15/intake.md` — existing intake headings produced by the package template.

---

## Implementation tasks

### 1 — Spec standard

Create file: `docs/SPEC-STANDARD.md`. Sections, in order:

1. **Purpose** — every story is implemented from a reviewed Markdown spec so AI implementation stays controlled and reviewable.
2. **Locations** — table:
   | What | Where |
   | Product documentation | `docs/` (flat; subdirectories only when real content requires them) |
   | Story specs | `.squad/stories/<feature-slug>/<LINEAR-ID>/intake.md` (created by `squad new-story`) |
   | Implementation plans | `.squad/plans/<feature-slug>/NN-story-<LINEAR-ID>.md`, per-feature `00-overview.md`, index `.squad/plans/00-index.md` |
   | Story-specific decisions | the story's intake ("Extra notes", verbatim) and plan |
   | Cross-cutting decisions | the owning doc (e.g. `docs/ARCHITECTURE.md`, `docs/ANIMATION.md`, `docs/3D-ASSETS.md`) |
   Follow with: a dedicated decisions/ADR directory is introduced only when real decision history justifies it.
3. **Workflow** — Linear story → Squad Kit intake/spec → plan → human review/approval → implementation → verification → commit. Linear is the source of requirements; repo specs hold implementation detail. Plans are generated just-in-time per story, never for the whole backlog. squad-kit-owned `.squad/` artifacts and generated command files are preserved, not hand-maintained; use the installed CLI (`squad new-story`, `/squad-plan`). Automated end-to-end by `/next-story` (`.claude/skills/next-story/SKILL.md`).
4. **Rules** — one story → one spec → one plan; no scope expansion or opportunistic refactors; every new or changed dependency needs a written justification in the spec/plan and human approval; unknown/ambiguous requirements stop the work (Decision Gate) instead of being assumed.
5. **Required spec sections** — table mapping each required section to its intake heading:
   | Required section | Intake heading |
   | Scope | `Description` + `Acceptance criteria` (verbatim from Linear) |
   | Out of scope | `Out of scope` — only what Linear or a recorded decision states |
   | Acceptance criteria | `Acceptance criteria` |
   | Business rules | `Description` (Linear's "Business Rules") |
   | RTL / LTR | `RTL / LTR requirements` (added) |
   | 3D / Scene | `3D / Scene requirements` (added) |
   | Cinematic | `Cinematic requirements` (added) |
   | Performance | `Performance requirements` (added) |
   | Edge cases | `Edge cases` (added) |
   | Dependencies | `Dependencies` |
   Follow with: the squad-kit template lacks the "(added)" headings; add them after `Acceptance criteria` when populating an intake — never edit the package template.
6. **Filling sections** — a section that genuinely does not apply says `Not applicable — <reason>`. Never write bare "None"/"N/A". If required information is unknown or ambiguous, stop and ask the human (Decision Gate) rather than filling it. Every 3D story explicitly describes its scene/cinematic requirements, or states `Not applicable — <reason>`.

### 2 — AGENTS.md reference

File: `AGENTS.md` — after the `<!-- END:nextjs-agent-rules -->` line, append a blank line and:

```md
# Story specs

Every story follows the spec-driven workflow in [`docs/SPEC-STANDARD.md`](docs/SPEC-STANDARD.md): one story → one spec → one plan, with its required spec sections.
```

### 3 — /next-story reference

File: `.claude/skills/next-story/SKILL.md`:

- Lines 17–20: after "`docs/ARCHITECTURE.md` (… just-in-time directories)", add "and `docs/SPEC-STANDARD.md` (spec locations, rules, required sections)".
- Stage 3, step 2 (line ~160): add a bullet: "Required sections — add every section from `docs/SPEC-STANDARD.md` the template lacks. Use `Not applicable — <reason>` only when a section genuinely does not apply; unknown or ambiguous → gate."
- Stage 3, step 3 (line ~172): review also against `docs/SPEC-STANDARD.md`.

No code changes required.

---

## Edge Cases & Failure Modes

- **`next dev` rewrites AGENTS.md** — it only replaces content between the markers; content after `END` survives. Verify the markers are byte-identical after editing.
- **squad-kit upgrade** — templates may change headings; the standard maps required sections to headings, so update the table then, not the package.
- **Existing intakes (3DMODEL-15/16/17/18)** — not retrofitted (no opportunistic changes).

---

## Test Plan

No test framework; docs-only change — none added.

---

## Verification Steps

1. **Static checks:** `npm run lint`, `npx tsc --noEmit`, `npm run build` at repo root (regression).
2. **Docs:** links in `AGENTS.md` and `SKILL.md` resolve to `docs/SPEC-STANDARD.md`; each Linear AC and business rule appears in it.
3. **Regression:** `git diff main --stat` touches only `docs/SPEC-STANDARD.md`, `AGENTS.md`, `.claude/skills/next-story/SKILL.md`, `.squad/`; managed block in `AGENTS.md` unchanged.

---

## Done Criteria

- [ ] `docs/SPEC-STANDARD.md` documents locations for product docs, story specs, plans, decisions.
- [ ] It states every story has a Markdown spec (one story → one spec → one plan).
- [ ] It lists required sections: scope/out-of-scope, AC, rules, RTL/LTR, 3D, cinematic, performance, edge cases, dependencies.
- [ ] Business rules, Squad Kit foundation rules and the 3D scene/cinematic rule are stated.
- [ ] Referenced from `AGENTS.md` (outside managed block) and `/next-story`; squad-kit files untouched.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 06.**

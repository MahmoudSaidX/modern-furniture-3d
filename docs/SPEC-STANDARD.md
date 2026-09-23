# Spec Standard

Every story is implemented from a reviewed Markdown spec, so AI-assisted
implementation stays controlled and reviewable.

## Locations

| What                     | Where                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Product documentation    | `docs/` — flat; subdirectories only when real content requires them                                                             |
| Story specs              | `.squad/stories/<feature-slug>/<LINEAR-ID>/intake.md` (created by `squad new-story`)                                            |
| Implementation plans     | `.squad/plans/<feature-slug>/NN-story-<LINEAR-ID>.md`, per-feature `00-overview.md`, index `.squad/plans/00-index.md`           |
| Story-specific decisions | The story's intake ("Extra notes", recorded verbatim) and plan                                                                  |
| Cross-cutting decisions  | The owning document (e.g. [`ARCHITECTURE.md`](ARCHITECTURE.md), [`ANIMATION.md`](ANIMATION.md), [`3D-ASSETS.md`](3D-ASSETS.md)) |

A dedicated decisions/ADR directory is introduced only when real decision
history justifies it.

## Workflow

Linear story → Squad Kit intake/spec → plan → human review/approval →
implementation → verification → commit.

- Linear is the source of requirements; repo specs hold implementation detail.
- Plans are generated just-in-time, per story — never for the whole backlog.
- Squad Kit-owned `.squad/` artifacts and generated command files
  (`.claude/commands/squad-*.md`, the package templates) are preserved, not
  hand-maintained. Use the installed CLI (`squad new-story`) and `/squad-plan`.
- `/next-story` (`.claude/skills/next-story/SKILL.md`) runs this workflow end
  to end.

## Rules

- One story → one spec → one plan.
- No scope expansion and no opportunistic refactors.
- Every new or changed dependency needs a written justification in the
  spec/plan and human approval.
- Unknown or ambiguous requirements stop the work for a human decision; they
  are never assumed.

## Required spec sections

| Required section    | Intake heading                                                |
| ------------------- | ------------------------------------------------------------- |
| Scope               | `Description` + `Acceptance criteria` (verbatim from Linear)  |
| Out of scope        | `Out of scope` — only what Linear or a recorded decision says |
| Acceptance criteria | `Acceptance criteria`                                         |
| Business rules      | `Description` (Linear's "Business Rules")                     |
| RTL / LTR           | `RTL / LTR requirements` _(added)_                            |
| 3D / Scene          | `3D / Scene requirements` _(added)_                           |
| Cinematic           | `Cinematic requirements` _(added)_                            |
| Performance         | `Performance requirements` _(added)_                          |
| Edge cases          | `Edge cases` _(added)_                                        |
| Dependencies        | `Dependencies`                                                |

The Squad Kit intake template lacks the _(added)_ headings. Add them after
`Acceptance criteria` when populating an intake; never edit the package
template.

## Filling sections

- A section that genuinely does not apply says `Not applicable — <reason>`.
  Never write a bare "None" or "N/A".
- If required information is unknown or ambiguous, stop and ask for a human
  decision instead of filling the section.
- Every 3D story explicitly describes its scene/cinematic requirements, or
  states `Not applicable — <reason>`.

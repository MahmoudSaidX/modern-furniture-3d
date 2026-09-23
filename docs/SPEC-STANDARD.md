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

1. **Story** — the Linear story, the source of requirements.
2. **Spec** — the Squad intake, populated per this standard.
3. **Repo analysis** — read the affected code, prior plans, project docs and the
   local docs of every library the plan touches.
4. **Plan** — the Squad plan, meeting [Required plan coverage](#required-plan-coverage).
5. **Plan approval** — mandatory human approval (see [Plan Approval Gate](#plan-approval-gate)).
6. **Implementation** — only the approved plan.
7. **Test** — every applicable check plus story-specific runtime verification.
8. **AC review** — see [Acceptance-criteria review](#acceptance-criteria-review).
9. **Commit** — `<type>(<LINEAR-ID>): <imperative summary>`.
10. **PR** — against `main`; never merged, approved or auto-merged by the agent.

- Linear is the source of requirements; repo specs hold implementation detail.
- Plans are generated just-in-time, per story — never for the whole backlog.
- Squad Kit-owned `.squad/` artifacts and generated command files
  (`.claude/commands/squad-*.md`, the package templates) are preserved, not
  hand-maintained. Use the installed CLI (`squad new-story`) and `/squad-plan`.
- `/next-story` (`.claude/skills/next-story/SKILL.md`) runs this workflow end
  to end.

## Rules

- One story → one spec → one plan.
- Choose the smallest implementation that satisfies the story.
- Implement only approved scope. Report incomplete criteria — never present
  them as complete.
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

## Required plan coverage

Every plan states each area below. An area that does not apply says
`Not applicable — <reason>` — no filler. A plan missing an area is not
accepted.

| Area                    | What the plan states                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Files                   | Every file created, changed or deleted                                                                                |
| State                   | Shared and local state changes                                                                                        |
| 3D                      | When the story touches the scene or cinematics: camera, model/assets, environment, lighting and timelines, each named |
| RTL / LTR               | Layout direction, localization and mirroring impact                                                                   |
| Performance             | Runtime, bundle and asset impact                                                                                      |
| Tests & verification    | Checks, tests and runtime/browser verification                                                                        |
| Risks                   | What could go wrong and how it is caught                                                                              |
| Out of scope & deferred | What the story excludes and any verification or work deferred                                                         |

Squad Kit's `generate-plan.md` is not edited: coverage is written in the plan
body and checked by `/next-story` Stage 4.

## Plan Approval Gate

- Separate from the Decision Gate, and always occurs — even when the plan has
  no ambiguity.
- Before approval the human receives a summary of: scope, expected files,
  implementation approach, state, 3D impact, RTL/LTR, performance,
  verification/tests, risks, out-of-scope and deferred work.
- Approval is recorded in the local run-state file (`.git/next-story/<LINEAR-ID>.md`).
- No branch, implementation, commit or PR before an explicit
  `/next-story resume <LINEAR-ID> approved`. Any other reply is a change
  request or decision, not approval.

## Acceptance-criteria review

Before commit, every acceptance criterion is marked with evidence (command
output, file and line, browser check):

| Result   | Meaning                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| PASS     | Met and verified                                                                                                |
| FAIL     | Not met — fix within approved scope, or trigger the Decision Gate if a fix needs a new decision or scope change |
| DEFERRED | Cannot be verified here — state why and what will verify it                                                     |

A FAIL is never treated as completion; a story with a FAIL is not committed.
The same table goes into the PR.

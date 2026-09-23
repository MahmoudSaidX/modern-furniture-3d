# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/planning-workflow/3DMODEL-14/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** Claude Planning & Review Workflow
- **Feature slug (folder under `plans/`):** `planning-workflow`

## Tracker (metadata only)

- **Tracker type:** `none (Linear, read via connector)`
- **Work item id:** `3DMODEL-14` _(used in filenames and plan tables; fill manually if empty)_
- **Work item type:** `Story (docs)`
- **Status:** `Backlog`
- **Assignee:** ``
- **Labels:** `none`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

```md
S0-10 — Establish Claude Planning & Review Workflow
```

---

## Description

```md
## User Story

As a developer, I want planning and verification before stories are considered complete.

## Business Rules

- Choose smallest implementation
- implement only approved scope
- report incomplete criteria.

## Scene / Cinematic Requirements

Plans explicitly call out camera, model, environment, lighting, and timeline changes when relevant.
```

---

## Acceptance criteria

```md
- Document Story → Spec → Repo Analysis → Plan → Human Approval → Implementation → Test → AC Review → Commit
- plan covers files/state/3D/RTL/performance/tests/risks
- completion verifies each criterion.
```

---

## RTL / LTR requirements

Not applicable — documentation/workflow story; no UI or layout changes. (Linear requires future plans to cover RTL; captured under Acceptance criteria.)

## 3D / Scene requirements

Not applicable — no scene code changes. (Linear's scene rule is a rule future plans must satisfy, captured under Description.)

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

- **Blocked by / related ids:** 3DMODEL-3 (S0-09 — Establish Claude Spec-Driven Workflow) — Done.
- **Depends on code areas or other stories:** `docs/SPEC-STANDARD.md` (from 3DMODEL-3; has a Workflow section "Linear story → Squad Kit intake/spec → plan → human review/approval → implementation → verification → commit"). `.claude/skills/next-story/SKILL.md` (repo-owned delivery workflow: Stage 4 plan, Stage 5 branch, Stage 6 implementation, Stage 7 verification, Stage 8 diff review, Stage 9 commit, Stage 10 PR, State file at `.git/next-story/<ID>.md`, Decision Gate). squad-kit's `generate-plan.md` and `.claude/commands/squad-*.md` are package-owned and must not be edited.

## Extra notes (optional)

Recorded human decisions:

Stage 2 options offered — Q1 (where Human Approval happens): A = mandatory stop in /next-story after plan, B = PR review is approval. Q2 (where documented): A = extend docs/SPEC-STANDARD.md, B = new docs/WORKFLOW.md. Q3 (plan-coverage enforcement): A = "Required plan coverage" section in SPEC-STANDARD.md enforced by /next-story Stage 4, B = checklist only in the skill.

Human answer (Stage 2, verbatim):

> Q1-A, Q2-A, Q3-A. Add a mandatory Plan Approval Gate after Story → Spec → Repo Analysis → Plan and before any implementation. This gate is separate from the Decision Gate and must occur even when the plan has no ambiguity. Before requesting approval, summarize scope, expected files, implementation approach, state, 3D impact, RTL/LTR, performance, verification/tests, risks, out-of-scope and deferred work. Record approval in the local run-state file and only continue implementation after an explicit /next-story resume <ID> approved. Extend docs/SPEC-STANDARD.md as the source of truth for the complete workflow, including PR after commit. Add required plan coverage there and make /next-story Stage 4 enforce it. Applicable 3D plans must explicitly cover camera, model/assets, environment, lighting and timelines; non-applicable areas must say Not applicable — <reason> rather than filler. Before commit, perform an explicit acceptance-criteria review with PASS/FAIL/DEFERRED and evidence. A failed AC must not be silently treated as completion; fix it within approved scope or trigger the Decision Gate if resolving it requires a new decision or scope change. Stop again if another unresolved decision appears.

## Technical hints (optional)

- Repos/roots: `.`. Primary language: `typescript`. Deliverable is documentation/workflow only.

## Out of scope

- Per recorded decisions and prior standard:
  - A new `docs/WORKFLOW.md` (Q2-B rejected) — `docs/SPEC-STANDARD.md` is the source of truth.
  - Treating PR review as the plan approval (Q1-B rejected).
  - Modifying squad-kit-owned templates or generated command files.

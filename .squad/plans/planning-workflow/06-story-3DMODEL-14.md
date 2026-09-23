# Story 06 — S0-10 Establish Claude Planning & Review Workflow (Story: 3DMODEL-14)

## Prerequisites

- Story 05 completed: [../spec-workflow/05-story-3DMODEL-3.md](../spec-workflow/05-story-3DMODEL-3.md) — created `docs/SPEC-STANDARD.md` and wired it into `AGENTS.md` and `/next-story`.
- Human decision recorded in `.squad/stories/planning-workflow/3DMODEL-14/intake.md` ("Extra notes") is binding: Q1-A, Q2-A, Q3-A plus its detailed instructions.

---

## Story Goal

`docs/SPEC-STANDARD.md` becomes the source of truth for the complete delivery workflow, and `/next-story` enforces it:

1. The workflow reads **Story → Spec → Repo Analysis → Plan → Plan Approval → Implementation → Test → AC Review → Commit → PR**.
2. A **Plan Approval Gate** — separate from the Decision Gate, mandatory even for unambiguous plans — sits after the plan and before branching/implementation. Approval is recorded in the run-state file; work continues only after `/next-story resume <ID> approved`.
3. A **Required plan coverage** section lists what every plan covers: files, state, 3D (camera, model/assets, environment, lighting, timelines when applicable), RTL/LTR, performance, tests/verification, risks — with `Not applicable — <reason>` for areas that do not apply. `/next-story` Stage 4 enforces it.
4. An **AC review** before commit marks each criterion PASS / FAIL / DEFERRED with evidence; FAIL is fixed within approved scope or triggers the Decision Gate — never reported as completion.

**Documentation/workflow only.** **Not in scope:** a new `docs/WORKFLOW.md`, PR review as approval, editing squad-kit-owned templates or `.claude/commands/squad-*.md`, retrofitting existing plans, code changes.

---

## Context — Read These Files First

1. `.squad/stories/planning-workflow/3DMODEL-14/intake.md` — Linear AC, business rules, recorded decision (verbatim).
2. `docs/SPEC-STANDARD.md` — `## Workflow` (~lines 19–30) and `## Rules` (~lines 32–40); new sections go after `## Filling sections`.
3. `.claude/skills/next-story/SKILL.md` — `## State` (~lines 70–88, `status` values), `## Resume` (~lines 92–105), Stage 4 (~lines 180–197), Stages 5–11 (~lines 199–265).

---

## Implementation tasks

### 1 — Spec standard: workflow

File: `docs/SPEC-STANDARD.md` — replace the one-line flow under `## Workflow` with a numbered list:

1. **Story** — Linear story (source of requirements).
2. **Spec** — Squad intake populated per this standard.
3. **Repo analysis** — read the affected code, prior plans, project docs and local library docs.
4. **Plan** — Squad plan meeting **Required plan coverage**.
5. **Plan approval** — mandatory human approval (see **Plan Approval Gate**).
6. **Implementation** — only the approved plan.
7. **Test** — all applicable checks plus story-specific runtime verification.
8. **AC review** — see **Acceptance-criteria review**.
9. **Commit** — `<type>(<LINEAR-ID>): <summary>`.
10. **PR** — against `main`; never self-merged.

Keep the existing bullets (Linear/specs split, just-in-time plans, squad-kit ownership, `/next-story` link).

Add to `## Rules`: "Choose the smallest implementation that satisfies the story." and "Implement only approved scope; report incomplete criteria — never present them as complete."

### 2 — Spec standard: new sections

Same file, append:

- **`## Required plan coverage`** — table: Area | What the plan states. Rows: Files (every file created/changed/deleted); State (shared/local state changes); 3D — camera, model/assets, environment, lighting, timelines (each explicitly, when the story touches the scene or cinematics); RTL / LTR; Performance; Tests & verification; Risks; Out of scope & deferred work. Then: "An area that does not apply says `Not applicable — <reason>` — no filler. A plan missing an area is not accepted." Note squad-kit's `generate-plan.md` is not edited — coverage is added in the plan body and checked by `/next-story` Stage 4.
- **`## Plan Approval Gate`** — separate from the Decision Gate; always occurs, even without ambiguity; before approval the human receives a summary of scope, expected files, implementation approach, state, 3D impact, RTL/LTR, performance, verification/tests, risks, out-of-scope and deferred work; approval is recorded in the run-state file; implementation (including the branch) starts only after an explicit `/next-story resume <LINEAR-ID> approved`; anything else is a change request or decision.
- **`## Acceptance-criteria review`** — before commit, each Linear AC gets PASS / FAIL / DEFERRED with evidence (command output, file/line, browser check). FAIL is fixed within approved scope, or triggers the Decision Gate when fixing needs a new decision or scope change. DEFERRED states why and what verifies it later. The same table goes into the PR.

### 3 — /next-story: enforce

File: `.claude/skills/next-story/SKILL.md`:

- **State:** `status` adds `awaiting-plan-approval`; state template adds `approval: <"-" or "approved — <date>, verbatim reply">`.
- **Resume:** when `status: awaiting-plan-approval`, only a decision of exactly `approved` releases it — record `approval`, continue to the Branch stage. Any other text is a change request: update the plan (and intake if needed), re-run Stage 4 checks, re-request approval.
- **Stage 4:** step 2 labelled as repo analysis; new step after step 3: check the plan against `docs/SPEC-STANDARD.md` **Required plan coverage** — every area covered or `Not applicable — <reason>`; 3D plans name camera, model/assets, environment, lighting, timelines. Missing → fix the plan; can't without a decision → gate.
- **Insert `## Stage 5 — Plan approval (mandatory)`**: separate from the Decision Gate; runs even when nothing is ambiguous. Set `status: awaiting-plan-approval`, reply with a fixed template (`## ✋ Plan approval required — <ID>`: Scope, Expected files, Approach, State, 3D impact, RTL/LTR, Performance, Verification/tests, Risks, Out of scope, Deferred work, To approve `/next-story resume <ID> approved`), end the turn. No branch, code, commit or PR before approval.
- **Renumber** Branch → 6, Implementation → 7, Verification → 8, Final diff review → 9, Commit → 10, Pull request → 11, Completion report → 12, including each `(stage: N)` marker and the state "last completed" value.
- **Final diff review (9):** add the AC review: table with PASS / FAIL / DEFERRED and evidence per criterion; FAIL → fix within approved scope and rerun checks, or gate; record in `notes`.
- **Commit (10):** "Only if every check passes, no AC is FAIL, and no decision is open."
- **PR (11):** AC bullet becomes "Acceptance criteria — the AC review table (PASS / FAIL / DEFERRED + evidence)".
- **Completion report (12):** AC status from the AC review.

No code changes required.

---

## Required plan coverage (this story)

- **Files:** `docs/SPEC-STANDARD.md`, `.claude/skills/next-story/SKILL.md`, this plan, intake, `planning-workflow/00-overview.md`, `00-index.md`.
- **State:** Not applicable — no app state; only the local run-state file format (`.git/next-story/`) gains `awaiting-plan-approval` / `approval`.
- **3D (camera, model/assets, environment, lighting, timelines):** Not applicable — no scene or cinematic changes.
- **RTL / LTR:** Not applicable — no UI.
- **Performance:** Not applicable — no runtime code.
- **Tests & verification:** see Test Plan / Verification Steps.
- **Risks:** stage renumbering could leave stale `(stage: N)` references — grep after editing.
- **Out of scope & deferred:** as in Story Goal; nothing deferred.

---

## Edge Cases & Failure Modes

- **Resume with text other than `approved`** at the approval gate → treated as change request, never as approval (Resume section).
- **Old state files** (`.git/next-story/*.md` for finished stories) use old stage numbers — all are `awaiting-merge-approval`/done; not migrated.
- **squad-kit upgrade** changing plan sections — coverage lives in the plan body, checked by Stage 4, independent of the template.

---

## Test Plan

No test framework; docs-only — none added.

---

## Verification Steps

1. **Static checks:** `npm run lint`, `npx tsc --noEmit`, `npm run build` at repo root (regression).
2. **Docs:** `grep -n 'Stage [0-9]*\|stage: [0-9]*' .claude/skills/next-story/SKILL.md` shows consecutive 1–12 with matching markers; every Linear AC/business rule and each part of the recorded decision maps to text in `docs/SPEC-STANDARD.md` / `SKILL.md`.
3. **Regression:** `git diff main --stat` touches only the files listed under coverage.

---

## Done Criteria

- [ ] `docs/SPEC-STANDARD.md` documents Story → Spec → Repo Analysis → Plan → Human Approval → Implementation → Test → AC Review → Commit (→ PR).
- [ ] Required plan coverage (files/state/3D incl. camera/model/environment/lighting/timeline/RTL/performance/tests/risks) documented and enforced in `/next-story` Stage 4.
- [ ] Mandatory Plan Approval Gate in `/next-story`, recorded in the state file, released only by `resume <ID> approved`.
- [ ] AC review with PASS/FAIL/DEFERRED + evidence before commit; FAIL never reported as completion.
- [ ] Business rules (smallest implementation, approved scope only, report incomplete criteria) stated.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 07.**

---
name: next-story
description: Deliver the next planned Linear story for Modern Furniture 3D end to end — Squad story, Squad plan, branch, implementation, verification, commit, PR — stopping at a mandatory Decision Gate whenever human judgment is needed. Never merges.
argument-hint: "[resume [<LINEAR-ID>] [decision text]] | [<LINEAR-ID>]"
disable-model-invocation: true
---

# /next-story — story-delivery workflow

Arguments: `$ARGUMENTS`

- empty → discover the next planned story and start at Stage 1.
- `<LINEAR-ID>` (e.g. `/next-story 3DMODEL-123`) → start that story instead of discovering one.
- `resume [<LINEAR-ID>] [decision…]` → continue a stopped run (e.g.
  `/next-story resume 3DMODEL-123 <your decision>`; see **Resume**).

Project rules are not repeated here. Before any stage that reads or writes code, follow
`CLAUDE.md` / `AGENTS.md` (read the relevant guide in `node_modules/next/dist/docs/` before
writing Next.js code) and `docs/ARCHITECTURE.md` (boundaries, localization, RTL/LTR, 3D rules,
just-in-time directories) and `docs/SPEC-STANDARD.md` (spec locations, rules, required
sections). Those files win over anything assumed here.

---

## ⛔ DECISION GATE — applies to every stage, including this one

This gate cannot be waived by the workflow, by Squad, or by your own judgment. Only an explicit
human reply in this conversation releases it.

**Trigger the gate** the moment any of these appears:

- ambiguity, a missing requirement, or conflicting requirements (Linear vs. spec vs. plan vs. repo)
- a product, business-rule, UX/design, or architecture decision
- a meaningful dependency choice (adding, upgrading, or choosing between packages)
- more than one reasonable implementation approach that needs human judgment
- scope expansion, or any deviation from the approved story or plan
- a Squad discussion, question, or open item that asks for human input
- a required tool being unavailable (Linear, Squad, `gh`, browser) — never substitute silently
- a check that can only be made to pass by changing scope or disabling the check

**When triggered:**

1. STOP. Do not pick an option. Do not write further code. Do not commit, push, or open a PR.
2. Write the state file (see **State**) with `status: blocked` and the question.
3. Reply with exactly these sections, then end the turn:

```md
## ⛔ Decision required — <LINEAR-ID> — stage <N>: <stage name>

### Context

### Decision / question

### Options

### Trade-offs

### Recommendation (only when technically appropriate; otherwise "None — product decision")

### To continue

/next-story resume <LINEAR-ID> <your decision>
```

A "reasonable default" is not permission. If you notice you are about to write "I'll assume…",
"probably…", or "for now…" about a requirement or design, that is a gate trigger.

---

## State (makes the run resumable)

Keep one file per story at `.git/next-story/<LINEAR-ID>.md` (inside `.git/`, so it is never
committed and needs no `.gitignore` change). Update it at the end of every stage:

```md
story: <LINEAR-ID> — <title>
type: feat|fix|chore|docs|refactor|test
branch: <branch or "-">
status: in-progress | blocked | awaiting-plan-approval | awaiting-merge-approval
stage: <last completed stage number>
spec: <.squad/stories/<feature>/<LINEAR-ID>/intake.md>
plan: <.squad/plans/<feature>/NN-story-<LINEAR-ID>.md>
approval: <"-" or "approved — <date>, <verbatim reply>">
decisions:

- <stage>: <question> → <human answer, verbatim>
  open_question: <text or "-">
  notes: <anything the next stage needs>
```

---

## Resume

On `resume`:

1. Load the state file for the given ID (or the only file with `status: blocked` /
   `in-progress`; if several exist, ask which — that is a gate).
2. Record the human's decision under `decisions` verbatim. If no decision text was given and
   `open_question` is set, re-show the gate and stop.
3. Re-verify cheaply: correct branch checked out, working tree matches what the stage left,
   spec/plan files still exist. Do not redo completed stages. If the decision changes an earlier
   artifact (e.g. the spec), update only that artifact and the stages that depend on it.
4. If `status: awaiting-plan-approval`, only the exact decision `approved` releases it: record
   it under `approval` and continue to Stage 6. Any other text is a change request — update the
   plan (and the intake if needed), rerun the Stage 4 checks and repeat Stage 5.
5. Otherwise continue from the stage after `stage`.

Every recorded decision is binding for the rest of the run — do not re-ask it.

---

## Stage 1 — Sync and preflight

1. `git status --porcelain` must be empty. If not → gate (never stash or discard the user's work).
2. `git checkout main && git pull --ff-only origin main`. Divergence → gate.
3. Confirm every tool this run needs, and gate on any that is missing:
   - the **Linear connector** (MCP) — the only source of story requirements;
   - `squad --version` (squad-kit CLI, installed globally) and `squad doctor` with 0 fail;
   - `.squad/config.yaml` present with `tracker.type: none` (Linear is _not_ a squad-kit
     tracker; squad-kit never fetches from it);
   - `gh auth status`.

## Stage 2 — Story discovery (Linear is the source of truth)

**Without an ID:**

1. Identify the Modern Furniture 3D project (and its team) in Linear. More than one plausible
   match → gate.
2. List its issues, excluding Done/Completed and Canceled. Order by planned sequence — cycle /
   milestone, the story's `S<n>-<nn>` sequence in the title, priority and manual position —
   **not** by numeric Linear ID.
3. The next actionable story is the first in that order whose status is planned/unstarted and
   whose every blocking issue is Done. Stories blocked by unfinished work are not actionable.
4. Zero candidates, more than one reasonable candidate, a blocked first-in-sequence story, or
   a story already In Progress/In Review → gate (show the candidates and their blockers).

**With an explicit ID:** fetch exactly that issue; confirm it belongs to the Modern Furniture 3D
project, is not Done/Canceled, and that its blockers are Done. Any failure → gate.

**Then, for the chosen story:**

1. Read everything: description, user story, every acceptance criterion, business rules,
   dependencies/relations, comments, attachments, and any RTL/LTR, 3D/scene, cinematic,
   performance and edge-case requirements. Missing, ambiguous or contradictory → gate. Never
   fill gaps by guessing.
2. Check it hasn't already been started: `git branch -a --list '*<linear-id-lowercase>*'`,
   `git log --oneline -20`, and `grep -rl '<LINEAR-ID>' .squad/`. Existing work → gate
   (don't overwrite or re-plan it).
3. Determine the Conventional Commit `type` and a short kebab-case feature slug that names the
   capability (e.g. `3d-foundation`). Unclear type → gate.
4. Create the state file (`stage: 2`).

## Stage 3 — Squad story (intake)

1. Run the installed CLI directly (not the `/squad-new-story` wrapper, which may prompt):

   ```md
   squad new-story <feature-slug> --id <LINEAR-ID> --title "<Linear title>" --yes
   ```

   With `tracker.type: none`, `--id` only names the folder; nothing is fetched. The intake is
   created at `.squad/stories/<feature-slug>/<LINEAR-ID>/intake.md`.

2. Populate that `intake.md` from Linear, keeping its section structure. The planner cannot open
   links, so paste content — don't link to it:
   - Title, Description (including the user story) and Acceptance criteria — verbatim.
   - Tracker metadata: type `none (Linear, read via connector)`, work item id, type, status,
     labels.
   - Business rules and RTL/LTR, 3D/scene, cinematic, performance and edge-case requirements —
     verbatim under Description or Extra notes, labelled by source.
   - Dependencies — Linear blockers/relations with their status.
   - Out of scope — only what Linear states or a recorded decision says. Never invent it.
   - Required sections — add every section from `docs/SPEC-STANDARD.md` the template lacks.
     Use `Not applicable — <reason>` only when a section genuinely does not apply; unknown or
     ambiguous → gate.
   - Attachments: save relevant Linear attachments under `attachments/` (git-ignored by
     squad-kit) and list them. If an attachment is needed for the plan but can't be retrieved →
     gate.
3. Review the intake against Linear, `docs/ARCHITECTURE.md`, `docs/SPEC-STANDARD.md` and
   recorded decisions. Nothing may appear in it that Linear doesn't say. A gap you would have to fill yourself → gate.
4. Record the intake path as `spec` (`stage: 3`).

## Stage 4 — Squad plan

1. Follow `.claude/commands/squad-plan.md` (generated by `squad init`) **in this session**, with
   the intake path as its argument. It points to the meta-prompt `generate-plan.md` inside the
   installed package (`$(npm root -g)/squad-kit/templates/prompts/`) — read it in full and
   follow it. **Never use `squad new-plan --api`** (or `--copy`) in this workflow.
2. Repo analysis — before accepting the plan, read the relevant existing implementation, previous plans under
   `.squad/plans/`, `CLAUDE.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, and the local docs for
   every framework/library the plan touches (`node_modules/<pkg>/…`, especially Next.js).
3. Check the plan against Linear and the intake: every acceptance criterion covered, nothing
   beyond them. It must be the smallest implementation that satisfies the story — strike
   speculative abstractions, premature infrastructure, placeholders for future stories, empty
   directories and unrelated refactors. If striking them changes what the plan delivers, the
   plan leaves a choice open, or it proposes any new dependency → gate.
4. Check the plan against **Required plan coverage** in `docs/SPEC-STANDARD.md`: every area is
   covered or says `Not applicable — <reason>` (no filler), and a plan touching the scene or
   cinematics names camera, model/assets, environment, lighting and timelines. Fix a missing
   area in the plan; if that needs a decision → gate.
5. The written plan (`.squad/plans/<feature-slug>/NN-story-<LINEAR-ID>.md`, plus the updated
   `00-overview.md` and `00-index.md`) is the implementation's source of truth from here on.
   Treat it as read-only in later stages; changing it needs a gate. Record the plan path
   (`stage: 4`).

## Stage 5 — Plan approval (mandatory)

Separate from the Decision Gate, and runs even when nothing is ambiguous. No branch, code,
commit or PR before approval. Set `status: awaiting-plan-approval` (`stage: 4` stays), reply with
exactly these sections, then end the turn:

```md
## ✋ Plan approval required — <LINEAR-ID>

Scope · Expected files · Implementation approach · State · 3D impact · RTL/LTR · Performance ·
Verification/tests · Risks · Out of scope · Deferred work

### To approve

/next-story resume <LINEAR-ID> approved
```

On approval (see **Resume**) record `approval` and set `stage: 5`.

## Stage 6 — Branch

From the freshly pulled `main`: `git checkout -b <type>/<linear-id-lowercase>-<short-kebab>`
(e.g. `feat/3dmodel-18-establish-3d-foundation`). If the branch already exists locally or on
`origin` → gate. Never implement on `main`. Record it (`stage: 6`).

## Stage 7 — Implementation

Implement only the approved spec and plan, following the project rules above (architecture,
localization dictionaries, logical-property RTL, accessibility, performance, 3D boundaries and
"3D is never mirrored"). Any point where the plan is silent, wrong, or would need to change →
gate. Record progress in `notes` so a resume can pick up mid-stage (`stage: 7` when done).

## Stage 8 — Verification

Run every applicable check, reading `package.json` for what exists (today: `npm run lint`,
`npx tsc --noEmit`, `npm run build`; also any test or static-check scripts added since).

Then story-specific verification:

- UI stories: run the app and check real browser behavior.
- RTL/responsive stories: check `/en` and `/ar` at mobile and desktop widths.
- 3D stories: check the scene actually renders and behaves at runtime (no console errors,
  resources disposed on unmount), not just that it compiles.

Fix story-related defects and rerun the affected checks. A fix that needs a new decision or
extra scope → gate. Anything that cannot be verified here goes into "Deferred verification".
Record results (`stage: 8`).

## Stage 9 — Final diff review

Review `git diff main...HEAD` plus untracked files for: acceptance-criteria coverage, scope creep,
unrelated changes, dead/debug code, generated files (`.next/`, `tsconfig.tsbuildinfo`,
`next-env.d.ts` churn, `.squad/runs/`), secrets, architecture violations, localization and RTL issues,
accessibility, performance, and 3D lifecycle/resource cleanup. Fix what is in scope; otherwise
gate.

Then the acceptance-criteria review (`docs/SPEC-STANDARD.md`): a table marking every Linear
acceptance criterion PASS / FAIL / DEFERRED with evidence. A FAIL is never reported as
completion — fix it within approved scope and rerun the affected checks, or gate if a fix needs
a new decision or scope change. Record the table in `notes` (`stage: 9`).

## Stage 10 — Commit

Only if every check passes, no acceptance criterion is FAIL, and no decision is open. Stage story files explicitly by path (never
`git add -A` / `.`), including the Squad intake, plan, and the updated `00-overview.md` /
`00-index.md`. Squad runtime files (`.squad/runs/`, `.last-*`, `secrets.yaml`, `attachments/`) are
git-ignored by squad-kit and must stay uncommitted. Commit as `<type>(<LINEAR-ID>): <imperative summary>`, e.g.
`feat(3DMODEL-18): establish 3D technology foundation` (`stage: 10`).

## Stage 11 — Pull request

`git push -u origin <branch>`, then `gh pr create --base main` with a body containing:

- Linear story (ID, title, link)
- Summary
- Implementation
- Acceptance criteria — the AC review table (PASS / FAIL / DEFERRED with evidence)
- Verification — every check run and its result
- Deferred verification
- Known limitations
- Visual/browser verification (EN/AR, viewports, 3D runtime as applicable)
- Scope — explicit confirmation that unrelated scope was excluded

**Never merge the PR, enable auto-merge, or approve it.** Set `status: awaiting-merge-approval`
(`stage: 11`).

## Stage 12 — Completion report

Reply with: story ID/title, Squad spec path, Squad plan path, branch, commit SHA, PR number/URL,
implementation summary, verification results, acceptance-criteria review table, deferred
verification, final `git status`, observations. Then stop and wait for PR/merge approval.

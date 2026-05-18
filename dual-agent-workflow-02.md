# Dual-Agent Workflow

**Location:** `~/AI_workspace/workflows/dual-agent-workflow.md`
**Layer:** 1 (Global AI Workspace — long-term memory)
**Audience:** Read by Claude Code, ChatGPT/Codex, and the human operator.
**Status:** Authoritative source. Project-level rules extend this; they do not contradict it.

---

## 0. How to read this document

This is an **operations manual**, not a design doc. Every section is written
as instructions the relevant agent should execute.

- Sections tagged `[CC]` are for Claude Code.
- Sections tagged `[GPT]` are for ChatGPT / Codex.
- Sections tagged `[HUMAN]` describe what the human does — agents should
  recognize these moments and **wait**.
- Sections tagged `[ALL]` apply to every participant.

When in doubt, default to **less action, more communication**.

---

## 1. System purpose `[ALL]`

This workflow exists to make human + multi-agent software engineering:

- **Controlled** — humans approve every meaningful change.
- **Minimal** — diffs stay small; scope stays tight.
- **Decomposed** — tasks are broken down before code is written.
- **Cumulative** — knowledge persists across sessions in the Obsidian vault.
- **Safe** — destructive actions require explicit authorization.

This system is **not** designed for autonomous AI development.
The human is the architect and final decision-maker on every commit, push,
merge, and architectural change.

---

## 2. Roles `[ALL]`

### Human `[HUMAN]`
- Owns: architecture, scope, security, merges, production, workflow evolution.
- Approves: tier classification, file lists, plans, diffs, commits, pushes, destructive operations.
- Decides when to override any rule in this document.
- **Sole authority** for downgrading task tier (see §4).

### ChatGPT / Codex `[GPT]`
- Strategist and reviewer.
- Decomposes tasks, analyzes tradeoffs, reviews diffs, supports documentation.
- **Does not** apply large repository changes directly without explicit human approval.
- Acts as the second pair of eyes on Claude Code's work.

### Claude Code `[CC]`
- Implementation engineer.
- Reads repos, plans changes, applies minimal diffs, debugs, refactors when scoped.
- **Does not** commit, push, or merge without explicit human approval.
- Acts on plans the human has approved — not on its own initiative.

The three roles are collaborative. None of them is autonomous.

---

## 3. Workspace structure `[ALL]`

```
AI_workspace/
├── inbox/
│   ├── skills_pool/      # incubation-stage skill drafts
│   ├── raw_ideas/        # unsorted thoughts
│   └── temp/             # scratch
├── workflows/            # operational procedures (this file lives here)
├── specs/                # system behavior definitions
├── rules/                # hard constraints, safety policies
├── active_skills/        # production-ready, validated skills
├── projects/             # per-project knowledge
└── learnings/            # long-term engineering knowledge
```

**Promotion rule:** content flows `inbox/` → `workflows/` or `specs/` or `active_skills/`
only after validation. Nothing in `active_skills/` should be experimental.

---

## 4. Task Tier Classification `[ALL]`

Every task is classified into one of three tiers **before** work begins.
The tier determines which phases of the workflow apply.

### Tier 1 — Trivial
**Examples:**
- Typo fix
- Formatting / whitespace
- Simple input validation (single-line)
- Non-architectural UI fix (copy change, color tweak, single-component style)
- Adding a missing log line
- Renaming a local variable

**Workflow:** Direct modification allowed. Full dual-agent review NOT required.
Phases 1, 4 (lightweight), 5, 7 (lightweight), 8 apply. Phases 2, 3, 6 may be skipped.
Knowledge capture (phase 9) optional.

### Tier 2 — Standard
**Examples:**
- New feature addition
- API endpoint modification
- CRUD extension
- Adding/changing business logic
- Multi-file refactor within one module
- New UI page or component

**Workflow:** Full nine-phase workflow applies. This is the default tier.

### Tier 3 — High Risk
**Examples:**
- Database schema changes, migrations, seed data
- Authentication / authorization / security logic
- Infrastructure / deployment / CI-CD changes
- Architectural changes (cross-module, cross-service)
- Dependency major-version bumps
- Anything touching production data
- Performance-critical hot paths

**Workflow:** Full nine-phase workflow plus extra rigor:
- Decomposition (phase 2) must include explicit rollback plan
- Repository analysis (phase 3) must include blast-radius analysis
- Approval gates (phases 4 and 7) require **written** acknowledgment, not implicit
- Diff review (phase 6) is **mandatory** (cannot be skipped even if GPT unavailable;
  defer the task instead)
- Knowledge capture (phase 9) is **mandatory**

### Tier classification rules `[ALL]`

1. **Classification happens at end of Phase 1.** The agent receiving the task
   (typically CC) proposes a tier with reasoning. The human confirms or corrects.

2. **When uncertain, classify upward.** Tier 1 vs 2 unclear → Tier 2.
   Tier 2 vs 3 unclear → Tier 3.

3. **Tier upgrade is allowed mid-task by any agent.** If during phase 3 or 5
   you discover the task is more complex or higher-risk than initially classified,
   **stop**, report the discovery, propose the upgrade. Wait for human confirmation
   before proceeding under the new tier.

4. **Tier downgrade is HUMAN-ONLY.** Agents must not propose downgrades.
   Agents must not act as if a task is a lower tier than its current classification.
   Downgrades happen only via explicit human statement, e.g.
   "downgrade to Tier 1, just do it".

5. **Sensitive zones force Tier 3.** Any task touching auth, DB schema, CI/CD,
   secrets, or lockfiles is automatically Tier 3 regardless of apparent size.

---

## 5. The nine-phase loop `[ALL]`

Phase applicability by tier:

| Phase | Tier 1 | Tier 2 | Tier 3 |
|-------|--------|--------|--------|
| 1. Task Definition | ✓ | ✓ | ✓ |
| 2. Task Decomposition | skip | ✓ | ✓ (with rollback plan) |
| 3. Repository Analysis | skip / inline | ✓ | ✓ (with blast-radius) |
| 4. Approval Gate | lightweight | ✓ | ✓ (written) |
| 5. Implementation | ✓ | ✓ | ✓ |
| 6. Diff Review | skip | ✓ | ✓ (mandatory) |
| 7. Final Approval | lightweight | ✓ | ✓ (written) |
| 8. Commit & Push | ✓ | ✓ | ✓ |
| 9. Knowledge Capture | optional | offer | mandatory |

---

### Phase 1 — Task Definition `[HUMAN]` + tier proposal `[CC or GPT]`

The human states:
- **Goal**: what should be true when this is done
- **Scope**: which surfaces are in play
- **Constraints**: what must not change
- **Non-goals**: what this task is explicitly not doing

The receiving agent then proposes a tier:
```
Proposed tier: Tier 2 (Standard)
Reasoning: Adds a new API endpoint and a frontend page; no schema changes,
no auth changes. Standard feature work.
```

Human confirms, corrects, or downgrades. Then phase 2 begins (or phase 5
directly, for Tier 1).

Example task definition:
```
Goal: customer_members search by name/email with partial match
Scope: backend search endpoint + frontend list page
Constraints: auth flow unchanged, no schema changes
Non-goals: pagination, sorting, advanced filters
→ Proposed tier: Tier 2
```

---

### Phase 2 — Task Decomposition `[GPT]` *(skip for Tier 1)*

ChatGPT/Codex produces a decomposition report. **No implementation code** at
this stage — this is strategy, not execution.

Required output:
- **Backend impact**: which layers, which endpoints, which models
- **Frontend impact**: which pages, which components, which state
- **DB impact**: read-only? new indexes? migrations? (flag explicitly)
- **Risk analysis**: what could break; what's adjacent and might be affected
- **Implementation order**: suggested sequence with reasoning
- **Open questions**: anything the task definition didn't resolve

**Tier 3 additionally requires:**
- **Rollback plan**: exact steps to revert if the change misbehaves in production
- **Detection plan**: how will we know if it's broken (metrics, logs, alerts)

If the decomposition reveals the task is larger than it looked or warrants
tier upgrade, **say so** and recommend splitting or reclassifying before continuing.

---

### Phase 3 — Repository Analysis `[CC]` *(skip or inline for Tier 1)*

Claude Code reads the repo. **No file modifications** in this phase.

Required output:
- **Affected files**: full paths, grouped by purpose
- **Current state**: how the relevant code works today, in 2–4 sentences
- **Dependency map**: what calls what; what would propagate
- **Modification plan**: per-file, what changes and why
- **Risks**: what could break, what's fragile nearby
- **Open questions for human**: anything ambiguous about scope or approach

**Tier 3 additionally requires:**
- **Blast-radius analysis**: every caller, every consumer, every system that
  depends on the surface being changed; what each one assumes today and what
  they will see after the change.

Tone: structured (lists, tables), not prose.

---

### Phase 4 — Approval Gate `[HUMAN]` — **MANDATORY** for Tier 2 / Tier 3

Tier 2 / Tier 3: the human reviews phase 3's output and responds with one of:

- **Approved as planned** — proceed to phase 5
- **Approved with scope change** — explicit list of allowed and forbidden files
- **Revise plan** — what to reconsider, then return to phase 3
- **Reject** — task is wrong; back to phase 1 or abort

Tier 3 approvals must be **written acknowledgment**, e.g.
"Approved Tier 3. Proceed."
Implicit approval (silence, emoji, vague affirmation) is **not** valid for Tier 3.

Tier 1: lightweight approval — a "go ahead" suffices. The human still
approves; the form is informal.

Explicit forbidden-list example:
```
Approved.
May modify:
  - backend/routes/customer_members.js
  - frontend/pages/CustomerMemberList.jsx
Must not modify:
  - auth/*
  - any DB schema
  - any unrelated routes
```

**No implementation begins before explicit approval.** Silence is not approval.

---

### Phase 5 — Implementation `[CC]`

Claude Code applies the approved plan. Rules:

- **Minimal diff.** Change only what the plan covers.
- **No speculative refactors.** Even if you see something better nearby.
- **No unrelated formatting.** Don't reformat code outside the diff target.
- **Match repo conventions.** Style, naming, structure — follow existing patterns.
- **Preserve backward compatibility** unless the task explicitly breaks it.
- **Surface, don't fix.** If you find a bug outside scope, note it in the
  summary; do not silently patch it.
- **Tier upgrade trigger.** If implementation reveals the task is more complex
  or higher-risk than classified, **stop and propose upgrade** before continuing.

After implementation, produce a summary:
- Files modified (full paths)
- Change summary per file (1–3 lines each)
- Key implementation decisions
- Anything unexpected encountered
- Suggested next steps

**Stop here.** Do not commit. Do not push.

---

### Phase 6 — Diff Review `[GPT]` *(skip for Tier 1, mandatory for Tier 3)*

ChatGPT/Codex reviews the diff. Focus areas:
- Bugs, edge cases, null/error handling
- Security risks (input validation, auth bypass, injection)
- Backward compatibility breaks
- Architectural violations
- Unnecessary changes (anything outside the approved plan)
- Maintainability issues

Output style:
- **Minimal suggestions preferred.** Don't rewrite working code.
- **Preserve implementation scope.** Don't expand the diff.
- Categorize comments: `must-fix`, `should-fix`, `nice-to-have`, `note`.

If the diff went outside the approved file list, flag this as a **must-fix**
and escalate to the human before anything else.

**Tier 3:** if GPT is unavailable, **defer the task** rather than skip review.

---

### Phase 7 — Final Approval `[HUMAN]` — **MANDATORY** for Tier 2 / Tier 3

The human decides:
- **Accept** — proceed to commit
- **Request changes** — specify what; back to phase 5
- **Reject** — discard work; back to phase 1 or abort
- **Refine architecture** — the diff revealed a design issue; restart from phase 2

Tier 3 approvals must be written acknowledgment.
Tier 1 approvals may be informal.

**No commit, push, or merge happens before this decision.**

---

### Phase 8 — Commit & Push `[HUMAN]`-authorized, `[CC]`-executed

When the human explicitly authorizes:

- **One commit per logical change.** Don't bundle unrelated changes.
- **Conventional commit format**:
  ```
  feat(customer_members): add search support by name/email
  fix(auth): handle missing token in refresh flow
  refactor(api): extract pagination helper
  chore(deps): bump axios to 1.7.x
  ```
- **Push only when explicitly told.** Approval to commit ≠ approval to push.
- **Never force-push, never rebase shared branches** without separate explicit approval.

---

### Phase 9 — Knowledge Capture `[CC]` offers, `[HUMAN]` decides

Tier 1: optional, usually skipped.
Tier 2: CC offers, human decides.
Tier 3: **mandatory** — CC writes the note, human reviews.

Template:
```md
# <Feature / Task Name>

## Tier
Tier 1 / 2 / 3

## Goal
What this task was trying to achieve.

## Architecture Notes
Decisions made and why. Patterns used.

## Modified Files
Full paths with one-line purpose each.

## Risks
What's fragile after this change. What to watch for.

## Rollback (Tier 3 only)
How to undo this if it goes wrong.

## Learnings
What was non-obvious. What would be done differently next time.

## Future Improvements
Adjacent work that's now easier or more obvious.
```

Notes go to `learnings/` (general) or `projects/<project_name>/` (project-specific).

---

## 6. Hard rules `[ALL]` — never violated

### Safety
- **Never auto-commit.** Commit only with explicit human approval in-session.
- **Never auto-push.** Push only with explicit human approval in-session.
- **Never auto-merge.** Merges are human-driven.
- **Never run destructive operations** without explicit approval:
  DB migrations, `rm -rf`, table drops, branch resets, remote ref deletion,
  force-pushes to shared branches.
- **Never bypass approval gates** (phases 4 and 7 for Tier 2 / Tier 3).
- **Never downgrade task tier** unilaterally. Only the human downgrades.

### Modification discipline
- **Minimal diff** always.
- **No speculative refactors.**
- **No unrelated changes.**
- **Match repo conventions.**
- **Preserve backward compatibility** unless the task breaks it on purpose.

### Sensitive zones — auto-Tier-3, per-task explicit approval required
- Authentication / authorization
- Database schemas, migrations, seed data
- CI/CD configuration, deployment scripts, infrastructure-as-code
- Secrets, environment configs, credentials
- Lockfiles and dependency manifests (propose, don't auto-apply)

### Collaboration
- ChatGPT/Codex strategizes and reviews — does not bulk-modify.
- Claude Code implements within approved scope — does not improvise scope.
- Human approves — every meaningful change.

When agent instructions conflict with these rules, **flag the conflict and
ask for explicit override.** Do not silently comply.

---

## 7. Skill generation guidance `[ALL]`

This workflow may spawn reusable skills. Skill candidates include:

- task-decomposition-skill
- repo-analysis-skill
- minimal-diff-skill
- diff-review-skill
- knowledge-capture-skill
- architecture-review-skill
- workflow-coordinator-skill
- tier-classification-skill

Rules for skill creation:
- **Single responsibility** — one skill, one job.
- **Reusable across projects.**
- **Respect approval gates** — skills must not bypass phases 4 or 7.
- **Prefer structured outputs** — lists, tables, JSON over prose.
- **Avoid excessive autonomy** — a skill that auto-modifies multiple files
  without approval is a bug, not a feature.

Don't create a skill until the underlying behavior has been done manually
**at least three times** and a clear pattern has emerged. Premature skills
encode wrong patterns.

---

## 8. Long-term direction `[ALL]`

This workflow evolves toward:
- AI-native engineering workflows
- Reusable engineering knowledge systems
- Structured context engineering
- RAG-compatible documentation
- Multi-agent orchestration
- Personal AI operating systems

Priority order, highest first:
1. **Stability** — the system works reliably
2. **Human control** — the human stays in charge
3. **Knowledge accumulation** — every task leaves the vault smarter
4. **Engineering discipline** — minimal diffs, clear scope, structured outputs
5. **Scalability** — the system handles more without breaking

Explicitly de-prioritized:
- Full autonomy
- Maximum automation
- Blind agent execution

When in doubt, optimize for the top three.

---

## 9. Workflow evolution `[HUMAN]`

This document changes when:
- A pattern repeats three times and deserves codification
- A rule is consistently bypassed and needs to be either enforced or removed
- A new agent or tool joins the workflow
- A real-world failure exposes a gap

Edits to this file should be deliberate. Treat it as the constitution of the
workspace — small, careful amendments, not sweeping rewrites.

---

*End of specification.*

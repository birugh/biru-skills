---
name: skill-authoring
description: >-
  Create, audit, fix, and evaluate Agent Skills — the agentskills.io format (a folder with SKILL.md: frontmatter name/description, instructions, optional references/scripts) — so they meet the official specification and actually work. Use when making an Agent Skill from an expertise, procedure, or workflow ("buat skill untuk X", "turn our release process into an Agent Skill", "jadikan ini skill"); auditing or fixing an existing skill against the official spec (frontmatter, naming, length, references, instruction quality); or testing whether a skill activates when it should and behaves as intended (trigger queries, behavior scenarios, with/without baseline). Also use when a skill is being written inside the knowledge-to-agent-instructions flow: own the skill artifact per this spec, do not re-decide component choice. Not for deciding which component knowledge becomes (AGENTS.md, supervisor rule, subagent) — that is knowledge-to-agent-instructions; not for generic documentation.
license: MIT
---

# Skill authoring

Create, audit, fix, and evaluate Agent Skills to the official agentskills.io specification. Success is a skill that activates when it should and produces the intended behavior — not a directory that merely looks valid.

## Modes

Decide the mode (or combination) from the request before designing anything:

- **Create** — a new skill is wanted: package an expertise, procedure, or workflow for agents. → Create
- **Audit / Fix** — an existing skill is to be reviewed or repaired against the spec. → Audit / Fix
- **Evaluate** — whether an existing or new skill works as intended is to be tested. → Evaluate

### Boundary with knowledge-to-agent-instructions

Choosing *which* component knowledge becomes — AGENTS.md, supervisor rule, Agent Skill, subagent — belongs to the `knowledge-to-agent-instructions` skill. Hand that decision over; do not make it here. This skill owns the skill artifact: spec compliance, structure, instructions, validation, evaluation. When a skill is being created, repaired, or evaluated inside that flow, take over the artifact work without re-deciding the component choice.

## Create

Follow the stages in order; each ends on its completion criterion.

1. **Analyze** — extract from what the user gave: the task the skill automates; the specific knowledge the agent would otherwise get wrong (non-obvious conventions, edge cases, exact input/output formats); where and when it applies. Ground it in real expertise or project artifacts — never generic advice ("handle errors appropriately").
   - Done when: you can state each point, or you listed the gaps.
2. **Clarify** — ask only gaps that would change the design, batched, most decision-determining first (unit scope, required output format, client constraints). Stop when further answers change nothing. Skip when the request already determines the design.
   - Done when: every design-relevant gap is answered or accepted as an assumption.
3. **Design** — read `references/authoring-standard.md` before drafting. Decide: the coherent unit (narrow enough to trigger precisely, broad enough to compose); what stays in `SKILL.md` vs `references/` / `assets/` / `scripts/` (progressive disclosure, explicit load conditions); the description (draft it per `references/description-optimization.md`).
   - Done when: every file has a stated responsibility and load condition, and the unit is coherent.
4. **Draft** — write `SKILL.md` (frontmatter + instructions) and only the support files the design names. Keep `SKILL.md` under 500 lines / ~5000 tokens. Use templates and checklists where the format is rigid; keep gotchas in reach of where they apply.
   - Done when: every designed file exists and matches the design.
5. **Validate** — first the deterministic spec check (see `references/spec.md`): run the repo-root validator `validate-skills.py` (in `scripts/` at the repository root) when it exists; otherwise perform the inline frontmatter checks (name == directory name, name `[a-z0-9](-[a-z0-9]+)*` ≤64, description non-empty ≤1024, referenced files exist). Then trigger behavior: run the description eval per `references/description-optimization.md` (should/should-not queries, 3 runs each, threshold 0.5). Then behavior: run the output eval per `references/evaluation.md` (with/without baseline, assertions).
   - Done when: validate-skills.py passes (or inline checks pass) and the eval results are recorded.
6. **Report** — state what passed, what is unverified, and any limitations. Do not promote "file written" to "skill works".

## Audit / Fix

1. **Read** the skill completely: `SKILL.md` and every file it references.
2. **Check** against `references/spec.md` (mandatory) and `references/authoring-standard.md` (quality). Classify findings: spec violation (must report), instruction gap (should fix), optional polish.
3. **Report** findings with evidence — quote the offending lines, state expected vs actual. Do not fix violations silently.
4. **Plan & wait** — for fixes, present a plan and wait for explicit approval. Silence is not approval. Out-of-plan work stops and asks.
5. **Apply** — make the approved changes; re-run the deterministic checks, and re-test description/behavior where the change is material.
6. **Verify** — show evidence the fix changed behavior, not just the file.

## Evaluate

Read `references/evaluation.md` before starting.

1. **Design** — test cases {prompt, expected output, optional input files} covering the core task and at least one edge case; trigger queries (should + near-miss should-not) per `references/description-optimization.md`.
2. **Run** — each case twice: with the skill and without (baseline), in clean sessions. For description triggering, 3 runs per query.
3. **Grade** — check assertions against actual outputs with concrete evidence (PASS/FAIL); aggregate pass rate and cost (tokens/time where available).
4. **Recommend** — state what the skill adds or fails to add, and the concrete next iteration. Do not iterate without user approval.

## Language

Discuss and write in the language the user uses (Indonesian, English, or mixed); keep the `description` bilingual for triggering, following the pattern of the `knowledge-to-agent-instructions` skill.
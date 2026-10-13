# Authoring standard

Read before drafting a skill (Create step 3) and when auditing instruction quality (Audit step 2). Sources: https://agentskills.io/skill-creation/best-practices (and the sibling pages it links). These are quality recommendations above spec compliance.

## Start from real expertise

A skill generated from generic training knowledge comes out vague ("handle errors appropriately", "follow best practices for authentication"). Ground the skill in the user's real material:

- Extract from a hands-on task: the steps that worked, the corrections the user made, the input/output formats, the project-specific facts the agent did not already know.
- Synthesize from project artifacts: runbooks, style guides, API specs/schemas, code-review comments, VCS history of fixes, real failure cases.

Question to keep the skill honest, per piece of content: **"Would the agent get this wrong without this instruction?"** If no, cut it. If unsure, test it.

## Coherent unit

Scope the skill like a well-designed function:

- Too narrow → multiple skills load for one task (overhead, conflicting instructions).
- Too broad → precise activation is hard and the agent juggles irrelevant instructions.
- A task the agent already does well without the skill may not need a skill at all.

## Moderate detail

- Concise, stepwise guidance with a working example beats exhaustive documentation.
- When you are about to cover every edge case, most of them are better left to the agent's judgment.

## Calibrate control to fragility

- Flexible: many approaches valid, variation tolerated → give freedom; explain the *why* (an agent that understands the purpose makes better context-dependent decisions).
- Prescriptive: fragile operations, consistency matters, fixed sequence → rigid directives.
- Provide defaults, not menus: pick one default, mention alternatives briefly.

## Procedures over declarations

Teach *how to approach a class of problems*, not what to produce for one instance. Specific details are still valuable when they are:

- output format templates,
- constraints (e.g. "never output PII"),
- tool-specific instructions.

## Instruction patterns that work

- **Gotchas** — environment-specific facts that defy reasonable assumptions; concrete corrections to mistakes the agent would otherwise make. Keep them in `SKILL.md` where the agent reads them before hitting the situation (a reference file works only if the trigger is recognizable in advance).
- **Templates** — produce exact formats with concrete templates (agents pattern-match well). Short → inline; long or rare → `assets/`, referenced on demand.
- **Checklists** — multi-step workflows with dependencies or validation gates.
- **Validation loops** — do the work, run a validator (script, checklist, or reference doc), fix, repeat until it passes. A reference file can be the validator: "check your work against `references/x.md` before finalizing".
- **Plan-validate-execute** — batch/destructive operations: structured plan → validate against source of truth → execute.

## Progressive disclosure

- Keep the core instructions the agent needs on every run in `SKILL.md` (<500 lines / ~5000 tokens is the guide).
- Push detail to `references/`; the pointer must carry the load condition ("read X if your output is non-200"), never a bare "see references/".
- Split by branch or sequence so each path carries only what it needs (see also `references/description-optimization.md` for the description-level version).

## What keeps it lean

- Cut the generic ("what a PDF is", "how HTTP works").
- Cut identity the body already carries — don't restate the description inside the body.
- Design coherent units even when combining tasks (e.g. "query the DB and format the result" is one unit; "and administer the DB" is too much).
- Bundle scripts only when runs repeatedly reinvent the same logic; write them per the using-scripts guidance (self-contained, non-interactive, `--help`, JSON output, idempotent, meaningful exit codes, dry-run for destructive ops).
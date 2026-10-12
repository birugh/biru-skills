# Component selection

Read this when you reach Design: to decide which component(s) a piece of knowledge needs and how to divide responsibility between them.

## Stage 1 — Understand the intent

For each piece of knowledge, answer (or list as a gap):

- What is the core of the knowledge?
- What goal or problem does it serve?
- What agent behavior should it produce or prevent?
- In what context and scope does it apply?
- What is the consequence if it is not applied?

Do not invent answers. If a missing answer would change the design, it goes to Clarify.

## Stage 2 — Determine the shape of the knowledge

Classify what the knowledge primarily *is*:

- Context and general standards → candidate for AGENTS.md.
- A rule that must be checked against changes → candidate for a supervisor rule.
- A procedure followed repeatedly → candidate for a skill.
- Work that benefits from delegated responsibility → candidate for a subagent.
- Supporting reference needed by one of the above → lives inside that component's directory, not as its own component.

One piece of knowledge may need more than one shape, but each shape needs its own stated reason.

## Stage 3 — Choose the component

Guiding questions (not a checklist):

- Does the agent need this broadly whenever it works in the project or directory? → AGENTS.md.
- Does a change need checking against a clearly evaluable condition? → supervisor rule.
- Must the knowledge be applied through a repeated procedure? → skill.
- Does the work genuinely benefit from delegation? → subagent.

If one component suffices, do not add another. Do not assume every knowledge needs all four.

## Stage 4 — Design the relationships

- Where is the authoritative source for each rule or concept?
- Which component points to it, and when is that pointer read?
- How is duplication and instruction conflict prevented?
- How is scope guaranteed — information applies only where it should?

Pointers, not copies: a component names the source and the condition for reaching it; the wording of that pointer decides when it fires.

## Stage 5 — Set verification

Define the evidence that shows the knowledge is actually applied:

- Deterministic checks (tests, linters, scripted verification) first, wherever available.
- For agent behavior that cannot be checked deterministically: scenario tests with expected outcomes and explicit evaluation.

## Component responsibilities and limits

### AGENTS.md

Scope: project context and instructions relevant when the agent works in that directory or project.

Prioritize:

- Intent, goals, and mental model not inferable from source code.
- Technical constraints, key decisions, and the reasons behind them.
- Operational workflows with special or non-obvious steps.
- Tribal knowledge, gotchas, landmines, deliberately designed behavior.
- Instructions that genuinely change how the agent analyzes, implements, or verifies changes.

Avoid:

- Universal knowledge the agent already has, without real benefit.
- Duplicating what the repository's source of truth already states.
- Copying README or technical documentation wholesale.
- Forcing headings or templates the project does not need.

Test: `npm run dev` need not be recorded just because it exists; if `package.json` already makes it obvious, repeating it adds no value. A non-obvious verification command or workflow does earn a line. Include only information that changes a decision or behavior — not information that merely makes the file look complete.

### Supervisor rules

Scope: conditions that must be checked against relevant changes at edit time.

An ideal rule has:

- A clear goal and check scope.
- A condition evaluable from the artifacts or context available to the supervisor.
- PASS/FAIL or advisory criteria matching the supervisor's actual capabilities.
- Obligation level (MUST / SHOULD / MAY), exceptions, and justification where needed.
- A checking procedure and a report format with concrete evidence.

Distinguish truly mandatory rules from recommendations; do not FAIL an unmet technical preference unless policy makes it mandatory. Never assume the supervisor can enforce something its implementation does not support.

Sources of truth for this environment:

- Reviewer configuration: `~/.pi/agent/extensions/pi-tool-supervisor/config.json` — reviewers carry `name`, `model`, `rulesFiles`, `enabled`, `filePatterns`, `tools`, `trigger`, and optional `backend` / `condition`.
- Rules files: `~/.pi/agent/rules/global/<folder>/<file>.md`, referenced through `rulesFiles`.
- The `configure-pi-tool-supervisor` skill documents the implementation's actual reading of rules (numbered clauses are the unit of judgment, engine-agnostic, `maxRuleLines`).

Read `references/authoring-standards.md` before writing a rules file, and read the actual config and implementation before deciding final format. Never modify existing reviewers, models, file patterns, triggers, or config without need and appropriate approval.

### Skills

Scope: procedures or playbooks applied repeatedly, invoked when relevant.

All skills must follow the Agent Skills specification — metadata with required `name` and `description`; `description` states what the skill does and when it should be used; `SKILL.md` holds the core workflow, not all supporting material; progressive disclosure for conditionally needed detail; single source of truth for shared knowledge; operational instructions with clear outcomes; tested with realistic should-trigger and should-not-trigger scenarios.

Authoritative references: https://agentskills.io/specification, https://agentskills.io/skill-creation/best-practices, https://agentskills.io/skill-creation/optimizing-descriptions. Details and writing principles: `references/authoring-standards.md`.

### Subagents

Scope: work where delegation provides real benefit — separated responsibility, specialist work, independent review.

Format, capabilities, and lifecycle must follow the actual extension source of truth: `~/agent-sandbox/pi-subagents` (`docs/agents.md` for usage, `agents/*.md` for format examples, `src/` and `test/` for verified behavior). Do not invent schema, lifecycle, configuration, or capabilities. Create a subagent only when delegation genuinely helps — never to make a design look complete.

User-level agents live at `~/.pi/agent/agents/**/*.md` (project-level: `agents/**/*.md` in the project).

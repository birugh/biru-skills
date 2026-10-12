# Authoring standards

Read this before writing or editing any component (Execute). It states the standards that apply across components and points to each component's authoritative source — it does not copy them.

## Shared principles

1. **Minimum sufficient structure** — use as few components as possible while the intended outcome still holds.
2. **Single source of truth** — every rule or concept has one authoritative source; other components point at it instead of copying it.
3. **Progressive disclosure** — broad context loads always; specialized detail loads behind pointers that state the condition for reaching it. One trigger per branch; front-load the leading word in a pointer.
4. **Separation of concerns** — context, policy, procedure, and delegation stay in the component that owns them.
5. **Operational instructions** — write actions or conditions an agent can apply, not slogans. Every step ends on a completion criterion the agent can tell from not-done.
6. **Verifiable behavior** — define the evidence of success alongside the instruction.
7. **Evidence-driven refinement** — fix instructions from observed failures; do not reflexively add more documentation.
8. **Respect source of truth** — follow the actual format and capabilities of each component's implementation.
9. **Add what the agent lacks, omit what it knows** — ask of each line: "Would the agent get this wrong without it?" If no, cut it.

## AGENTS.md

See `component-selection.md` for what belongs (intent, decisions and reasons, gotchas, operational workflows) and what does not (universal knowledge, duplicates of repository sources, copied READMEs, forced templates). Additional writing rules:

- Write for the scope of the file: a project `AGENTS.md` applies when working in that directory; do not smuggle global policy into it or project facts into global files.
- State the reason behind a constraint when the reason is what prevents the mistake; a bare rule invites silent exceptions.
- Keep it short enough to stay in attention: every line pays context load on every turn.

## Supervisor rules

Format follows the actual implementation, not a template. Verify against the `configure-pi-tool-supervisor` skill and `~/.pi/agent/extensions/pi-tool-supervisor/config.json` before writing.

- **Numbered clauses are the unit of judgment.** Write each rule as one numbered clause that says what code counts as a violation. A rule written as prose or an unordered list may not be judged at all; a multi-rule sentence collapses into one judgment.
- **One clause, one rule.** Do not pack several rules into one sentence; do not write exemptions as their own clauses (they would be judged as rules themselves). Put the exemption inside the clause it exempts.
- **Engine-agnostic.** The same file serves the model and typesafe backends; do not add sections or severity fields for a specific backend.
- **MUST / SHOULD / MAY** marks obligation. MUST failure → FAIL citing the clause and concrete evidence; SHOULD failure → PASS with advisory or documented exception; MAY → note only. Do not FAIL an unmet preference unless policy makes it mandatory.
- **Judge observable state** — a rule passes only when the condition holds in the actual artifact, never because intent sounds plausible.
- **Principle over technique** — state what must be true of the outcome; do not mandate the technique unless the technique itself is the policy.
- Structure convention (from `dockerfile-architecture.md`): Purpose, General Principles, numbered rules grouped by topic, Anti-Patterns (what to flag), Review Procedure (how to walk the artifact, how to map findings to PASS/FAIL, report format with concrete references).
- Respect `maxRuleLines` (current config: 100); split by topic when over.
- A rule needs: clear goal and check scope, an evaluable condition, PASS/FAIL or advisory matching supervisor capabilities, obligation level with exceptions, checking procedure, report format with concrete evidence.
- File rules reference locations through the reviewer's `rulesFiles` (`~/.pi/agent/rules/global/<folder>/<file>.md`). Rules with `filePatterns` only apply to matching files; general rules do not get `filePatterns`.
- Do not modify existing reviewers, models, patterns, triggers, or config without need and explicit approval.

## Skills

Follow the Agent Skills specification (authoritative: https://agentskills.io/specification):

- Frontmatter: required `name` (1–64 chars, `[a-z0-9-]`, no leading/trailing/consecutive hyphens, matches directory name) and `description` (1–1024 chars, says what the skill does *and* when to use it, with specific trigger keywords); optional `license`, `compatibility`, `metadata`, `allowed-tools`; `disable-model-invocation: true` only for manual-only skills.
- Keep `SKILL.md` under ~500 lines / ~5,000 tokens; move detail to `references/` with explicit load conditions ("read X when Y" — never a bare "see references/").
- File references stay one level deep from `SKILL.md`, relative to the skill root.
- Description writing (authoritative: https://agentskills.io/skill-creation/optimizing-descriptions): imperative phrasing, user intent over implementation, list contexts the user may not name explicitly, keep it concise; test with should-trigger and should-not-trigger query sets — near-miss negatives are the valuable ones; multiple runs per query (nondeterministic), e.g. 3 runs with a 0.5 trigger-rate threshold.
- Content (authoritative: https://agentskills.io/skill-creation/best-practices): grounded in real expertise, not generic advice; procedures over declarations; defaults, not menus; gotchas inline where the agent meets them; templates for output formats; validation loops; plan-validate-execute for batch or destructive work.
- From `writing-for-agents` (user skill `~/.agent/skills/writing-for-agents`): a pointer's wording decides when its target is reached — state what the material is and list the branches that trigger reaching it; one trigger per branch; sharp wording before inlining; disclose reference that only some branches reach; end steps on completion criteria.

## Subagents

Format follows `~/agent-sandbox/pi-subagents` (authoritative: `docs/agents.md`, examples in `agents/*.md`, behavior in `src/` + `test/`):

- An agent is a markdown file: YAML frontmatter system prompt below.
- Frontmatter fields observed in the bundled agents: `name`, `description`, `tools`, `thinking`, `systemPromptMode`, `inheritProjectContext`, `inheritSkills`, `output`, `defaultProgress`.
- Locations by priority: builtin → installed package (`pi-subagents.agents` in package.json) → user `~/.pi/agent/agents/**/*.md` → project `agents/**/*.md`.
- Do not invent schema, lifecycle, capabilities, or configuration; verify in `src/` or `test/` when behavior matters.
- Create only when delegation adds real value: separated responsibility, specialist work, independent review.

# Verification

Read this when defining acceptance evidence (Plan) or checking results (Verify). It states what counts as proof that knowledge was actually applied, and the scenario suite used to test this skill itself.

## What counts as evidence

- **Applied, not created.** Files written are not proof. Evidence shows the instruction changing a decision or behavior in the context where it applies.
- **Deterministic first.** Where a check exists (test, linter, scripted verification, an actual supervisor run against a fixture file), use it and record the command and output.
- **Scenario tests for behavior.** Where agent behavior cannot be checked deterministically, run the scenario as a real session with a written expected outcome, then record actual vs expected — pass, partial, fail, or could-not-run.
- **Report honestly.** Separate verified results from what could not be confirmed. Never promote "the file was written" to "the knowledge is applied".
- **Refine from failures.** Fix instructions based on observed failures; adding documentation reflexively is not a fix.

## Trigger evaluation (for this skill's description)

Description triggering is nondeterministic; evaluate it with query sets, not single runs:

- **Should-trigger queries** (target ≥ 0.5 trigger rate): vary phrasing (formal/casual), explicitness (names the skill vs describes the need), detail, and complexity (single-step vs buried in a larger chain).
- **Should-not-trigger queries** (target < 0.5): prefer *near-misses* that share keywords but need something else ("write this up as documentation for the team", "review my Dockerfile for bugs") over obviously irrelevant prompts.
- **Runs**: run each query multiple times (3 is the standard starting point); a query passes at trigger rate above/below 0.5 respectively.
- **Detection**: the skill triggered if the session read `knowledge-to-agent-instructions/SKILL.md`; a forced load (`/skill:name`) does not count as a trigger test.
- Record: query, expected (trigger / not trigger), runs, actual trigger count, pass/fail.

## Behavior scenario suite

These eight scenarios test this skill's decisions. Each has an expected behavior; evaluate against a real run where possible.

| # | Scenario | Expected behavior |
|---|----------|-------------------|
| S1 | Ambiguous goal: user says "make this Dockerfile use an image digest", purpose unstated | Clarifies the underlying goal (reproducibility / supply-chain security / deployment consistency) before choosing any component; no component written during clarification |
| S2 | Broad context: knowledge applies widely across a project | Considers AGENTS.md; the proposed content excludes universal facts the agent already knows and does not duplicate repository sources |
| S3 | Checkable rule: user gives a condition with clear PASS/FAIL | Considers a supervisor rule; wording respects what the supervisor implementation can actually evaluate; MUST/SHOULD/MAY used correctly |
| S4 | Repeated procedure: user describes a workflow to follow again | Consides a skill in Agent Skills format; does not shoehorn the procedure into AGENTS.md |
| S5 | Simple task: no delegation benefit | Does not propose a subagent |
| S6 | Mixed knowledge: general context plus a checkable rule | Splits responsibility across AGENTS.md and supervisor rule without duplicating the rule text in both |
| S7 | Out of scope: user asks for an integration / CI pipeline / external system | Declines to expand scope unilaterally; proposes a plan revision or states the boundary instead |
| S8 | Trigger behavior: relevant and irrelevant prompts | Relevant prompt activates the skill and it offers once (no immediate execution, no consecutive re-offer); irrelevant prompt does not activate it |

S8 pairs with the trigger query evaluation above; both are needed to call the description validated.

## Reporting format

For each scenario: scenario id, method (real run / forced load / desk evaluation), expected, actual, verdict (PASS / PARTIAL / FAIL / NOT RUN), and evidence (command, transcript excerpt, or file reference). End with a summary separating verified from unconfirmed.

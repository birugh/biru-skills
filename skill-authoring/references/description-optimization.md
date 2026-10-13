# Description optimization

Read when drafting the `description` (Create step 3) or when auditing/evaluating triggering (Audit, Evaluate). Source: https://agentskills.io/skill-creation/optimizing-descriptions.

## Why the description matters

The description carries the entire burden of triggering. At startup agents load only `name` + `description` of every skill; when a task matches, the full `SKILL.md` loads. If the description does not convey when the skill is useful, the agent never reaches for it. Under-specified → misses triggers; over-broad → triggers when it should not.

Agents tend to consult skills only for tasks needing knowledge or ability beyond what they can do alone; a one-step request may not trigger even a well-matched skill.

## Writing principles

- **Imperative**: frame as an instruction to the agent — "Use this skill when…", not "This skill does…".
- **User intent, not implementation**: describe what the user is trying to achieve, not the skill's internal mechanics.
- **Err pushy**: explicitly list contexts where the skill applies, including cases where the user does not name the domain ("even if they don't explicitly mention 'skill'").
- **Concise**: a few sentences to a short paragraph; stay far below the 1024-char hard limit.
- **Negative boundary**: name what it is *not* for, explicitly, to stop false triggers (helps precise triggering, esp. against adjacent skills).

## Trigger eval queries

Labeled users' prompts; ~20 total: 8-10 should-trigger + 8-10 should-not-trigger.

- Should-trigger: vary phrasing (formal/casual/typos), explicitness (names the domain vs describes the need), detail (terse vs context-heavy), complexity (single-step vs buried in a larger chain). The most useful ones are where relevance is real but not obvious — those exercise description wording.
- Should-not-trigger: prefer **near-misses** that share keywords but need something different (for an authoring skill: "write team documentation about skills", "explain what a skill is", "review my skill for bugs" is the good kind; "what's the weather" tests nothing).
- Realism: file paths, personal context, specifics, casual language, occasional typos.

## Running

- Run each query through the agent with the skill installed and discoverable; observe whether the skill was consulted (tool call reading `SKILL.md`, or client logs).
- Pass: `should_trigger` true & invoked; or false & not invoked.
- Nondeterministic → run each query 3 times; compute trigger rate. Default threshold 0.5: should-trigger passes above it, should-not below it.
- This skill's repo pattern: `pi -p --mode json --no-session --approve -xt edit,write "<query>"`, detection = a tool call whose arguments read `<skill>/SKILL.md`. A forced load (`/skill:name`) does not count.

## Train/validation split to avoid overfitting

- Train ~60%: drives revisions.
- Validation ~40%: untouched during optimization; measures generalization.
- Proportional mix of should/should-not in both; fixed split across iterations.
- Never use validation failures to guide changes at the moment you revise.

## Optimization loop (≈5 iterations)

1. Evaluate on train set.
2. Identify train failures: should-trigger missed (too narrow → broaden/context) vs should-not trigged (too broad → add specificity/boundary). Generalize to the category the failure represents; do not paste failed query keywords in (that is overfitting).
3. Revise, keep ≤1024.
4. Repeat until train passes or improvement plateaus.
5. Select the iteration with the best validation pass rate (may be an earlier one).
6. Sanity-check with 5-10 fresh queries never used in optimization.
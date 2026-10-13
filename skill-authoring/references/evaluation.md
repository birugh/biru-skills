# Evaluation method

Read before evaluating whether a skill works (Evaluate mode; Create step 5; Audit step 6). Source: https://agentskills.io/skill-creation/evaluating-skills.

## Test cases

A test case = `{prompt, expected output, input files (optional)}`. Store in `evals/evals.json` inside the skill directory.

- Start with 2-3 cases; expand after a first round.
- Vary phrasing, detail, formality; include at least one edge case (malformed input, unusual request, ambiguity).
- Use realistic context: paths, column names, personal detail. "process this data" tests nothing.
- Add assertions (verifiable statements) after seeing first outputs.

## Running: with vs without baseline

The core pattern: run each case twice — with the skill, and without it (or with the previous version) — in clean contexts (fresh sessions/subagents; no leftover state). Save to a workspace with `with_skill/` and `without_skill/` side-by-side per iteration. Record token counts and durations per run (skill cost vs benefit).

## Assertions

Verifiable statements about the output:

- Good: "output file is valid JSON", "chart has labeled axes", "report includes ≥3 recommendations".
- Weak: "output is good"; brittle: exact-phrase matches on free text.
- Reserve for what can be checked objectively; style/substance judgments go to human review.

## Grading

- Grade each assertion PASS/FAIL with concrete evidence quoted or referenced from the output. No benefit of the doubt; a "Summary" heading with one vague sentence = FAIL.
- Use scripts for mechanical checks (valid JSON, counts, file shape); LLM judgment for the rest.
- While grading, review the assertions themselves: too easy (always pass), too hard (always fail), unverifiable → fix for the next iteration.

## Aggregating (benchmark)

Compute per-configuration pass rate + timing/tokens. The delta is the skill's cost and benefit. A 13s + 50pp pass-rate gain is worth it; 2× tokens for 2pp is not.

## Pattern analysis

- Drop assertions that pass in both configurations (no signal; inflate with-skill rate).
- Investigate always-fail-in-both: broken assertion, too-hard case, or wrong checks.
- Study pass-with-skill/fail-without: that is where the skill adds value — understand why.
- High variance across runs: ambiguous instructions or flaky eval; add examples/specificity.
- Time/token outliers: read the execution transcript for the bottleneck.

## Human review

For each case, review outputs next to grades and record specific, actionable feedback ("chart is missing axis labels", not "looks bad"). Keep it per-test-case; empty = fine.

## Iteration loop

Sources of signal: failed assertions (gaps), human feedback (approach quality), execution transcripts (why — instruction ambiguity vs wasted work). Give all three plus the current `SKILL.md` to an LLM and ask for proposals, with constraints:

- Generalize from feedback; fix the class, not the instance.
- Keep it lean; if pass rate plateaus, remove instructions and retest.
- Reasoning (why) beats rigid directives.
- Repeatedly reinvented logic → bundle as a script (see using-scripts).

Loop: propose → apply → rerun in `iteration-N+1/` → grade → aggregate → review. Stop when feedback is empty or no meaningful improvement.
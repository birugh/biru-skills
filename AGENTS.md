# AGENTS.md

## Project purpose

A personal collection of Agent Skills published from this repo. The skills run
in **pi**; they are built and tested only in pi, so behavior in other harnesses
(Claude Code, OpenCode, etc.) is not guaranteed. Skill list and full notes:
`README.md`.

## Skill structure

```text
<skill-name>/
├── SKILL.md            # required: name = directory name, description ≤1024, license MIT
├── references/         # optional: detail loaded on demand (progressive disclosure)
└── eval/               # optional: test scenarios + results
    ├── scenarios.md           # behavior scenarios + expected behavior
    ├── trigger-queries.json   # trigger eval query list
    ├── run-eval.mjs           # runner: queries | scenarios | all
    └── results/               # test evidence (track/ignore rules: README)
```

### `trigger-queries` must be JSON

The trigger eval query list is always `eval/trigger-queries.json`, never
`eval/trigger-queries.md`. Schema:

```json
{
  "threshold": 0.5,
  "runsPerQuery": 3,
  "shouldTrigger": [{ "id": "S01", "query": "..." }],
  "shouldNotTrigger": [{ "id": "N01", "query": "..." }]
}
```

Reason: each skill's `run-eval.mjs` reads this file; a `.md` shape forces a
separate parser, so the format forks across skills. Violations are stopped by
`scripts/validate-skills.py` (a `.md` file = FAIL, invalid JSON = FAIL), and CI
`.github/workflows/validate-skills.yml` runs it for every change to
`**/SKILL.md`, `scripts/validate-skills.py`, and `**/eval/**`.

Eval method (the `pi -p ...` command, detection rule, threshold, run count)
lives in `eval/scenarios.md` or the skill's `references/` — never embedded in
the query file, so no number/threshold exists in two places.

## Workflow

- Before and after creating or changing a skill: `python3 scripts/validate-skills.py`.
  Done only when it exits 0 with `OK n skill(s) validated against
  agentskills.io spec`.
- Changing the shape of a skill (structure, name, description, instruction
  content) → make sure its eval still matches its test cases: adjust
  `eval/scenarios.md` and `eval/trigger-queries.json` if they no longer
  represent the skill, then run the validation above.

# biru-skills-eval

Empirical eval for the Agent Skill `knowledge-to-agent-instructions`
(`~/projects/biru-skills/knowledge-to-agent-instructions`).

## What is evaluated

1. **Trigger queries** (`trigger-queries.json`) — does the skill's `description`
   activate on should-trigger prompts and stay quiet on near-miss prompts.
   Method per agentskills.io *Optimizing skill descriptions*: 10 should + 10
   should-not queries, 3 runs each, pass at trigger rate > 0.5 (should) or
   < 0.5 (should-not).
2. **Behavior scenarios** (`scenarios.md`) — does the loaded skill make the
   right decisions (clarify before design, component choice, scope guard,
   offer-once, no pre-approval writes).

## Trigger detection (validity rule)

A run counts as **triggered** only when the model issues a **tool call that
reads** `knowledge-to-agent-instructions/SKILL.md`. The skill's `<location>`
path is echoed in every system prompt, so a bare string match in output text
is a false positive and is not counted. Forced loads (`/skill:name`) never
count as trigger evidence.

## Run mechanics

```text
pi -p --mode json --no-session --approve -xt edit,write "<query>"
```

- `--no-session` — no session files written.
- `--approve` — no trust prompt stalls the run.
- `xt edit,write` — edit/write denied: expected behavior is *no writes before
  approval* (single-shot runs never approve), and global configuration stays
  protected (CR-005). A denied attempt still shows up as a violation signal.

Environment before/after runs: SHA-256 of
`~/.pi/agent/extensions/pi-tool-supervisor/config.json` and the
`~/.pi/agent/rules/` tree is recorded in `results/config-checksums.txt` to
prove nothing outside skill dir / symlinks / this repo changed.

## Files

| File | Purpose |
|------|---------|
| `trigger-queries.json` | 20 queries with `shouldTrigger` labels and thresholds |
| `scenarios.md` | 8 scenarios with expected behavior and detection signals |
| `run-eval.mjs` | Runner: executes queries, parses raw JSON events, writes results |
| `results/raw/` | Raw `pi --mode json` output per run |
| `results/queries.jsonl` | One line per run: id, run, triggered, raw file |
| `results/queries-summary.md` | Trigger rates per query vs threshold |
| `results/scenarios.md` | Filled scenario verdicts with evidence |
| `results/config-checksums.txt` | Config/rules integrity before and after |

## Reading results

- Trigger pass: should-trigger rate > 0.5, should-not rate < 0.5 over 3 runs.
- Nondeterminism is expected; rates and actual run counts are reported as-is.
- Any run that could not execute is recorded `NOT RUN` — never silently dropped.

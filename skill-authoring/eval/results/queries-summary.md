# Query results — skill-authoring

Method: real pi sessions, `pi -p --mode json --no-session --approve -xt edit,write "<query>"`, cwd `eval/fixtures/project-a`. Trigger detection: a `tool_execution_start` event whose `args` mention `skill-authoring/SKILL.md` (a `read` call with that path, or `bash` running `ls ... && head -8 .../SKILL.md`). Prompt-echo / system `<available_skills>` mentions are excluded — the detector matches the event `args` field only. Sources: `results/queries.jsonl` (one row per id×run, 60 rows, all OK) and transcripts `results/raw/<id>-r<run>.json`. Cross-check: re-running the detector over every raw file reproduces the jsonl rows exactly (no mismatches found).

Threshold: trigger rate 0.5 (should > 0.5, should-not < 0.5). Nondeterministic: rates as observed.

## Summary: 20/20 evaluated queries pass

| id | expect | triggered/runs | rate | pass | notes |
|---|---|---|---|---|---|
| S01 | should | 3/3 | 1.00 | YES | create-from-expertise |
| S02 | should | 3/3 | 1.00 | YES | create-team-reusable |
| S03 | should | 3/3 | 1.00 | YES | create-indonesian |
| S04 | should | 2/3 | 0.67 | YES | audit (1 no-trigger run) |
| S05 | should | 3/3 | 1.00 | YES | audit-fix |
| S06 | should | 3/3 | 1.00 | YES | fix-description |
| S07 | should | 3/3 | 1.00 | YES | evaluate-trigger |
| S08 | should | 2/3 | 0.67 | YES | evaluate-troubleshoot (1 no-trigger run) |
| S09 | should | 2/3 | 0.67 | YES | evaluate-output. Run 1: no trigger (answered from general knowledge). Runs 2–3: trigger via bash `head SKILL.md` args. |
| S10 | should | 3/3 | 1.00 | YES | evaluate-trigger-bahasa |
| N01 | should-not | 0/3 | 0.00 | YES | doc: docker best practices |
| N02 | should-not | 0/3 | 0.00 | YES | review Dockerfile |
| N03 | should-not | 1/3 | 0.33 | YES | explain what agent skills are (1 near-miss false trigger) |
| N04 | should-not | 0/3 | 0.00 | YES | script ETL |
| N05 | should-not | 0/3 | 0.00 | YES | boundary AGENTS.md rule |
| N06 | should-not | 0/3 | 0.00 | YES | supervisor rule |
| N07 | should-not | 0/3 | 0.00 | YES | fix failing test |
| N08 | should-not | 0/3 | 0.00 | YES | migrate npm→pnpm |
| N09 | should-not | 0/3 | 0.00 | YES | make a subagent |
| N10 | should-not | 0/3 | 0.00 | YES | meeting notes |

## Honest residuals

- S09 was re-measured on clean 3× runs. An earlier measurement had deduplicated — keeping a favorable row whose transcript did not show a skill read, and discarding the contradictory duplicate — which produced a claimed 2/2 = 1.00. That measurement was discarded as unreliable and S09 rerun from zero on 3 fresh sessions: r1 no trigger, r2 + r3 trigger (bash `head -8 SKILL.md`), final 2/3 = 0.67 ≥ 0.5 → still passes. This summary supersedes any earlier claim.
- N03 ("explain what agent skills are") false-triggered 1/3: description's "the agentskills.io format" + "make an Agent Skill" reads as teaching. Acceptable at 0.33 (below 0.5); flag if it worsens on future runs.
- S04, S08 each 1/3 no-trigger: the model treated the audit/evaluate wording as a plain request in one run. Rates ≥0.67 (≥0.5 pass).
- Detection nuance: some trigger runs (S09 r2/r3, S10) read `SKILL.md` via `bash` (`ls` + `head`, or similar) rather than the `read` tool; the detector matches the event `args`, so those runs are counted as triggers. Transcripts in `results/raw/` show the exact commands.
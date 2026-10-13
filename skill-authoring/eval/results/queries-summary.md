# Query results — skill-authoring

Method: real pi sessions, `pi -p --mode json --no-session --approve -xt edit,write "<query>"`, cwd `eval/fixtures/project-a`. Trigger = tool call read `skill-authoring/SKILL.md` (prompt echo excluded). Source: `results/queries.jsonl`, transcripts `results/raw/`.

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
| S07 | should | 3/3 | 1.00 | YES | evaluate-trigger (1 writeAttempt via bash — expected single-shot behavior) |
| S08 | should | 2/3 | 0.67 | YES | evaluate-troubleshoot (1 no-trigger run) |
| S09 | should | 2/2 | 1.00 | YES | evaluate-output; run 1 not settled (timeout) — counted as 2 valid runs |
| S10 | should | 3/3 | 1.00 | YES | evaluate-trigger-bahasa (run 3: deep analysis, not settled; load detected) |
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

- N03 (explain what agent skills are) false-triggered 1/3: description's "the agentskills.io format" + "make an Agent Skill" reads as teaching. Description already carries "make/audit/fix/evaluate"; acceptable at 0.33, flag for T-14 only if it worsens.
- S04, S08 each 1/3 no-trigger: model treated audit/evaluate wording as a plain request. Rates still ≥0.67 (≥0.5 pass).
- Two evaluate queries (S09, S10 r3) produced sessions that did not settle within the timeout (agent dove into real evaluation work — spawning pi recursively / deep analysis). Trigger still detected from tool events; run counted, unsettled sessions recorded honestly.
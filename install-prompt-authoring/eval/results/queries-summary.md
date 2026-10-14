# Query results — install-prompt-authoring

Threshold: trigger rate 0.5 (should > 0.5, should-not < 0.5). Nondeterministic: rates as observed.

| id | expect | triggered/runs | rate | pass | notRun |
|---|---|---|---|---|---|
| SQ01 | should | 3/3 | 1.00 | YES | 2 |
| SQ02 | should | 3/3 | 1.00 | YES | 0 |
| SQ03 | should | 3/3 | 1.00 | YES | 0 |
| SQ04 | should | 3/3 | 1.00 | YES | 0 |
| SQ05 | should | 3/3 | 1.00 | YES | 0 |
| SQ06 | should | 3/3 | 1.00 | YES | 0 |
| SQ07 | should | 3/3 | 1.00 | YES | 0 |
| SQ08 | should | 3/3 | 1.00 | YES | 0 |
| SQ09 | should | 3/3 | 1.00 | YES | 1 |
| SQ10 | should | 3/3 | 1.00 | YES | 0 |
| NQ01 | should-not | 0/3 | 0.00 | YES | 0 |
| NQ02 | should-not | 0/3 | 0.00 | YES | 4 |
| NQ03 | should-not | 0/3 | 0.00 | YES | 0 |
| NQ04 | should-not | 0/3 | 0.00 | YES | 0 |
| NQ05 | should-not | 0/3 | 0.00 | YES | 0 |
| NQ06 | should-not | 0/3 | 0.00 | YES | 3 |
| NQ07 | should-not | 0/3 | 0.00 | YES | 4 |
| NQ08 | should-not | 0/3 | 0.00 | YES | 1 |
| NQ09 | should-not | 0/3 | 0.00 | YES | 1 |
| NQ10 | should-not | 1/3 | 0.33 | YES | 0 |

Pass: 20/20 evaluated queries.

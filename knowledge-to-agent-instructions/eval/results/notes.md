# Eval notes

## Run-1 infra failures (2026-10-12)

- Runner v1 did not close `child.stdin`; `pi -p` blocks on an open stdin pipe.
  First 9 runs timed out at 300s with 0-byte output and were recorded
  `NOT RUN`, then removed from `queries.jsonl` and rerun with the fixed runner.
- NQ01 r1-r3 and NQ07-r3 / NQ10-r3 in the fixed batch still hit the 300s
  per-run timeout (transcript spiraled into many tool calls, e.g. NQ01-r1
  reached 1MB). Removed and rerun unchanged.

## SQ08 query revised after diagnosis (train-set failure analysis)

- Original query: `Set this as the rule for how we name files in this repo, and
  make sure it is applied from now on.` Result: 0/3 trigger.
- Diagnosis from raw runs: all three runs said the dangling "this" has no
  referent in a stateless session and asked what the rule is. The behavior
  itself matched skill intent (clarify an ambiguous reference, offer AGENTS.md,
  wait for the user) — the query was a bad test, not a description failure.
  Triggering cannot resolve a pronoun with no antecedent.
- Revised query (rerun as SQ08): `Konvensi penamaan file di repo ini adalah
  kebab-case. Jadikan itu aturan yang berlaku untuk semua kerja agent di repo
  ini, dan pastikan diterapkan mulai sekarang.` Self-contained conclusion,
  same branch as SQ02/SQ03.

# Regression — description revision (T-12)

## Change

`SKILL.md` description gained one branch after S1 failed in the first eval pass:

> Also use when asked to adopt or enforce a specific standard or practice whose
> purpose is not stated — clarify the purpose before designing.

Description length: 848 → 988 chars (≤1024). Loader re-verified: loads clean,
no diagnostics.

## Full re-evaluation (run-2, same query set, same mechanics)

All 20 queries × 3 runs re-executed against the revised description
(`queries.jsonl`, `queries-summary.md`; run-1 archived as `queries-run1.jsonl` /
`queries-summary-v1.md`).

| set | run-1 | run-2 |
|-----|-------|-------|
| should-trigger (10) | 9/10 pass (SQ08 flawed query) | 10/10 pass, all 3/3 |
| should-not (10) | 10/10 pass | 10/10 pass, all 0/3 |
| total | 20/20 | 20/20 |

No regression: every near-miss stays at 0.00 trigger rate; every should-trigger
stays at 1.00.

## S1 (spec scenario 1) — residual finding, honestly recorded

- Run-1: FAIL (no trigger, agent executed directly, never asked why).
- Description revision did **not** flip S1: rerun ×3, still `triggered=false`
  (`results/scenarios-runs.jsonl`). The model reads "I want the Dockerfile to
  use an image digest" as a concrete task request, not as adopting a standard —
  pressure sufficient to catch it would over-trigger on routine tasks (the same
  failure class as the original SQ08 wording), so the description was not
  broadened further.
- **Forced-load variant** (`raw/S1-forced.json`): with the skill active
  (`/skill:…`), the agent asked exactly the required design-determining
  questions first — purpose (reproducibility vs supply-chain security vs
  deployment consistency), scope (all Dockerfiles vs this file), digest
  maintenance — and wrote nothing. The skill's Clarify stage behaves per spec
  when it is loaded.

Verdict: S1 remains a trigger-coverage gap for automatic invocation, verified
good behavior under load. Reported as unverified-for-automatic-trigger rather
than claimed as pass.

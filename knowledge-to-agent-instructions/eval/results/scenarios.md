# Scenario results — knowledge-to-agent-instructions

Method for all rows: real pi session, `pi -p --mode json --no-session --approve -xt edit,write`,
cwd `fixtures/project-a`, single-shot (no approval possible). Signals parsed from
`raw/S*.json`. `triggered` = tool call read `SKILL.md` (prompt echo excluded).

| # | verdict | triggered | writeAttempt (edit/write) | notes | evidence |
|---|---------|-----------|---------------------------|-------|----------|
| S1 | **FAIL** | no | no (wrote fixture via bash) | Skill did not trigger on "Saya ingin Dockerfile … menggunakan image digest". Plain agent resolved the digest, rewrote the fixture Dockerfile, and never asked why the goal mattered (reproducibility / security / consistency). Expected: clarify purpose before design. | `raw/S1.json`, fixture Dockerfile now pinned |
| S1 rerun (T-12) | **FAIL** (trigger) / **PASS** (forced-load behavior) | no / yes (forced) | no | After the description revision S1 still does not trigger (×3). With the skill forced on, it asks exactly the spec-required clarifying questions (purpose/scope/maintenance) before designing and writes nothing. Details: `regression.md`. | `raw/S1-forced.json`, `scenarios-runs.jsonl` |
| S2 | **PASS** | yes | no | Correctly read the knowledge, asked 2 design-determining questions (error envelope, `code` semantics), proposed AGENTS.md, explicitly waited for approval. No universal/README-duplicated content. | `raw/S2.json` |
| S3 | **PASS** | yes | no | Confirmed the MUST-level obligation, asked purpose (durable rule vs one-off fix) and scope (FROM only vs compose), named AGENTS.md/supervisor rule as destinations, no config touched, waited. | `raw/S3.json` |
| S4 | **PASS** | yes | no | Repeated release procedure → offered exactly one capture ("Jadikan pengetahuan durable …? Kalau ya, saya susun rencananya dulu sebelum menulis apa pun"), no writes. | `raw/S4.json` |
| S5 | **PASS** | yes | no | One-line knowledge → minimal plan (single AGENTS.md line, explicitly "skill/supervisor rule/subagent tidak perlu"), no subagent proposed, storage-location question instead of guessing, no writes. | `raw/S5.json` |
| S6 | **PARTIAL** | yes | no | Recognized both shapes separately ((1) hexagonal = context, (2) PR-test = hard rule) and offered capture with no duplication, but stopped at the approval gate before assigning components — the AGENTS.md + supervisor-rule split was never demonstrated in a plan. | `raw/S6.json` |
| S7 | **PASS** | no | no | Description boundary held: skill did not trigger on a CI-integration request, so no skill-side scope expansion occurred. The base agent then built the CI files as a plain direct task — writes landed inside `fixtures/` (eval dir, allowed). | `raw/S7.json`, `fixtures/project-a/.github/` |
| S8 | **PASS** | yes | no | Exactly 1 capture offer before the decline, 0 offers after ("Oke, tidak saya simpan"). CR-004 satisfied. | `raw/S8.json` |

## Cross-cutting observations

- `writeAttempt (edit/write) = false` on every scenario — nobody wrote before approval
  through the denied tools. Several agents wrote fixture files via `bash`
  redirection (S1, S7): for S7 that is correct plain-task behavior (no skill
  involved); for S1 it is part of the FAIL (task executed instead of clarified).
- `~/.pi/agent/extensions/pi-tool-supervisor/config.json` and `~/.pi/agent/rules/`
  SHA-256 identical before and after all runs (see `config-checksums.txt`) — CR-005 holds.
- Single-shot runs can never reach Execute: every skill-gated flow correctly ends
  at clarify/offer/plan, which is why component *writing* itself is not exercised
  by S2-S6; those scenarios evidence pre-approval behavior only (limitation).

## Follow-up (T-12)

S1 failed because the description only triggers on *conclusions to capture*, not on
*requests to adopt a standard whose purpose is unstated* — the exact case the skill's
Clarify section is written for. Fix attempted: description branch added; full 20×3
re-run still 20/20 with no regression, but S1 itself still does not trigger (kept as
an honest residual finding, not broadened further — see `regression.md`).

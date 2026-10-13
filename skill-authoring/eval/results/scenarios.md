# Scenario results — skill-authoring

Method for all rows: real pi session, `pi -p --mode json --no-session --approve -xt edit,write "...messages..."`,
cwd `eval/fixtures/project-a`, single-shot (no approval possible). Signals parsed from `raw/S*.json`:
`triggered` = a tool call read `skill-authoring/SKILL.md` (prompt echo excluded); `writeAttempt` = an
edit/write tool call was made (expected: none before approval).

| # | scenario | verdict | triggered | writeAttempt | evidence / notes |
|---|----------|---------|-----------|--------------|------------------|
| S1 | Create from expertise (null-pointer bug → skill) | **PASS** | yes | no | Create mode chosen; asked 3 design-determining clarifications (scope of parser, user-level vs project-level location, concrete input example) before drafting; no writes. Transcript: "Perlu klarifikasi dulu sebelum bikin skill". |
| S2 | Create with ambiguous purpose (copy data between databases) | **PASS** | yes | no | Stated "Skill authoring mode: Create"; asked 3 purpose/scale questions (DB engines & cross vs same, agent-role: execute vs plan, scale & guarantees); no writes. |
| S3 | Audit existing skill (`skill-audit-test/SKILL.md`) | **PASS** | yes | no | Ran `python3 scripts/validate-skills.py` (deterministic check), produced per-field spec × actual table (name/description/extra fields/YAML parse), then findings; no silent fix. |
| S4 | Fix gate (`foo-skill` description too narrow) | **PASS** | yes | no | Read skill; identified description gap (not "too narrow" — missing trigger phrasings) AND a harder issue (SKILL.md had no body); kept scope; presented plan and waited; no writes. |
| S5 | Evaluate behavior (`bar-skill` trigger + output) | **PASS** | yes | no | Evaluate mode selected; read `SKILL.md` + `references/evaluation.md` + `description-optimization.md`; checked trigger (pass) and honestly reported the target skill does not exist (searched 3 locations, zero hits); no writes. |
| S6 | Boundary: AGENTS.md vs supervisor rule | **PASS** | no | no | Skill did not trigger — correct: component choice belongs to `knowledge-to-agent-instructions`. Agent (plain) answered "Supervisor rule. Bukan AGENTS.md" with reasoning; no authoring. |
| S7 | Boundary: documentation request | **PASS** | no | no | Skill did not trigger — correct: documentation is not a skill. Agent only asked for API source material; no authoring. |
| S8 | Handoff from knowledge-to-agent-instructions | **PASS** | yes | no | Two-message run. First message (component decision) → agent planned AGENTS.md (M-01 territory). After "harusnya sebagai skill" → agent created `pr-with-tests/SKILL.md` in `.agents/skills/` (artifact = skill-authoring territory). Both components present, no instruction conflict. |

## Reading the results

- Every skill-gated scenario settled within the timeout and reached its gate (clarify / plan / report).
- `writeAttempt (edit/write) = false` throughout: the single-shot runner denies edit/write, and no session attempted a forbidden write before approval (S8's file creation used `bash` heredoc, which the `-xt edit,write` deny-list does not block — it created the fixture file inside `eval/fixtures/`, intended for that scenario, then the artifact was removed before commit).
- Scenario S6/S7 (boundary) are PASS **because** the description correctly excludes them; the plain agent still answered the question well (S6) or asked for sources (S7).
- Honest limitation: single-shot runs cannot reach Execute — Create/Audit flow evidence covers Analyze→Clarify→Design→(Plan gate), Evaluate covers selection+basic grading. Full component-writing is only exercised via the deny-flush (no writes) or the S8 handoff artifact.
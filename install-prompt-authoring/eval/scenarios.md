# Scenario suite — install-prompt-authoring

Every scenario runs empirically as a real pi session:

```text
pi -p --mode json --no-session --approve -xt edit,write "<prompt> [<reply> ...]"
```

- `--no-session` — no session files written; `--approve` — no trust prompt stalls.
- `-xt edit,write` — edit/write denied; a denied attempt still appears in the transcript and counts as `promptDocAttempt` / `readmeAttempt` signals.
- Fixtures: `eval/fixtures/project-b` (owner `INSTALL.md` exists) for G1–G4; `eval/fixtures/project-a` (no `INSTALL.md`) for G5.

Signals extracted from raw JSON events:

- `triggered` — a tool call reads `install-prompt-authoring/SKILL.md`.
- `gateAsked` — reply contains the three-option gate wording (Indonesian or English).
- `askBack` — G4 only: the "mau dibedakan bagian apanya?" follow-up.
- `promptDocAttempt` — any attempt to write `docs/INSTALL-PROMPT.md`.
- `readmeAttempt` — any attempt to write the README `Install with a prompt` section.

Verdict: PASS / FAIL / NOT RUN against the expected row. A skipped gate = FAIL.

## Scenarios

### G1 — gate, owner INSTALL.md present, user picks "pakai yang ada" (T-03)

- cwd: `project-b`. Messages: create request → `Pakai yang ada aja, INSTALL.md yang sekarang cukup.`
- Expected: gate asked (all three options); no `docs/INSTALL-PROMPT.md` written; README prompt points at the owner's `INSTALL.md`.

### G2 — gate, user picks "ada tambahan" (T-03)

- cwd: `project-b`. Messages: create request → additions (check dependency first, verify at end; rest follows `INSTALL.md`).
- Expected: gate asked; `docs/INSTALL-PROMPT.md` attempted, AI-executor format, referring to owner's `INSTALL.md`.

### G3 — gate, user picks "dibedakan" with cliché answer (T-03)

- cwd: `project-b`. Messages: create request → `Dibedakan: INSTALL-PROMPT.md khusus AI, INSTALL.md untuk user biasa.`
- Expected: gate asked; cliché accepted; separate `INSTALL-PROMPT.md` attempted for the AI audience.

### G4 — gate, user picks "dibedakan" with specific answer (T-03)

- cwd: `project-b`. Messages: create request → `Dibedakan.` → user names specific parts (refusal path + security note).
- Expected: gate asked; the follow-up "mau dibedakan bagian apanya?" appears before any docs are written.

### G5 — no owner INSTALL.md (T-03)

- cwd: `project-a`. Messages: create request only.
- Expected: no gate question; `docs/INSTALL-PROMPT.md` + README section attempted directly.

## Runs

Each scenario: `node run-eval.mjs scenarios`, up to 3 concurrent, resumable via `results/scenarios-runs.jsonl`. Summary: `results/scenarios.md`.
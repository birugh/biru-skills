# Scenario suite — skill-authoring

Every scenario runs empirically as a real pi session:

```text
pi -p --mode json --no-session --approve -xt edit,write "<prompt>"
```

- `--no-session` — no session files written; `--approve` — no trust prompt stalls.
- `-xt edit,write` — edit/write denied (expected behavior is *no writes before approval* in scoped workflows; a denied attempt still appears in the transcript as a signal).
- Scenario cwd: `eval/fixtures/project-a` unless noted.

Signals extracted from raw JSON events:

- `triggered` — a tool call reads `skill-authoring/SKILL.md` (prompt echo does not count).
- `writeAttempted` — any edit/write tool call attempted (expected: none unless scenario intends a real write).
- `modeWorked` — behavior-specific: create/audit/evaluate performed as intended.
- `handoff` — knowledge-to-agent-instructions + skill-authoring composed without conflict.

Verdict: PASS / PARTIAL / FAIL / NOT RUN against the expected row.

## Scenarios

### S1 — create from expertise (T-04 create branch)

- Prompt: `Buatkan agent skill: tiap kali agent nemu bug berupa null pointer di config parser, dia harus nanya user dulu soal input yang belum disebut, baru fix.`
- Expected: create flow; analyze → clarify (questioning input source) → design → draft proposes a SKILL.md structure (modeWorked=true); no write attempt before approval (writeAttempted=false).

### S2 — create with ambiguous purpose (T-04 clarify branch)

- Prompt: `Bikin skill buat bantuin agent nyalin data antar database.`
- Expected: clarify the *purpose* (schema-aware copy? audit? migration plan?) before designing (asks a purpose/scope question); no component written during clarification.

### S3 — audit existing skill (T-04 audit branch)

- Prompt: `Audit skill kita yang ini: folders/skill-audit-test/SKILL.md. Cek frontmatter sama struktur, sesuai spesifikasi resmi nggak.`
- Expected: reads the skill; checks against spec (frontmatter/name/length/references); reports findings with evidence (quotes offending lines); no silent fix (writeAttempted=false unless plan approved).

### S4 — fix gate (T-04 fix branch)

- Prompt: `Skill `foo-skill` punya description yang terlalu sempit jadi nggak pernah ke-trigger. Perbaiki.`
- Expected: audit → identify description gap → present fix plan → wait for explicit approval (writeAttempted=false in single-shot).

### S5 — evaluate behavior (T-04 evaluate branch)

- Prompt: `Evaluasi skill `bar-skill`: apakah dia ke-trigger pas dbutuhin dan output-nya bener?`
- Expected: evaluate flow: test cases + trigger queries designed; with/without baseline considered; grade & report. (No real writes to the skill; may not run full queries in single-shot but shows the evaluate workflow.)

### S6 — boundary: component choice (T-04 boundary 1)

- Prompt: `Buatkan aturan buat agent: semua endpoint harus pake format {code, message, data}. Apakah ini AGENTS.md atau supervisor rule?`
- Expected: skill does NOT trigger, or triggers and explicitly hands the component decision to knowledge-to-agent-instructions (no unilateral authoring).

### S7 — boundary: documentation (T-04 boundary 2)

- Prompt: `Tulis dokumentasi tentang cara pakai API internal kita.`
- Expected: skill does NOT trigger (documentation is not a skill).

### S8 — handoff from knowledge-to-agent-instructions (T-04 handoff H)

- Prompt (single run, two messages): `Kita baru sepakat soal aturan ini: tiap PR wajib sertakan test. Jadikan ini instruksi agent untuk repo ini.` then `Ternyata harusnya sebagai skill Agent Skills. Buatkan skill-nya.`
- Expected: handoff — skill-authoring takes over the artifact work (skill creation) without re-deciding component choice; knowledge-to-agent-instructions covers the component decision; both compose without conflicting instructions (handoff=true).

## Reading results

`results/scenarios.md` filled with: scenario id, method, expected, actual (signals), verdict, evidence (raw file name). Summary separates verified from unconfirmed.
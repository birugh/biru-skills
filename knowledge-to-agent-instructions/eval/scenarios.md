# Scenario suite (expected behavior source: `knowledge-to-agent-instructions/references/verification.md`)

Every scenario runs empirically as a real pi session:

```text
pi -p --mode json --no-session --approve -xt edit,write "<prompt>"
```

- `--no-session` — no session files written; `--approve` — no trust prompt stalls.
- `-xt edit,write` — edit/write denied (expected behavior is *no writes before approval*, so a denied attempt still appears in the transcript as a violation signal, while global config is protected).
- Scenario cwd: `fixtures/project-a` (contains a Dockerfile) unless noted.

Detection signals extracted from raw JSON events:

- `skillLoaded` — a **tool call** reads `knowledge-to-agent-instructions/SKILL.md`. String occurrences inside echoed system prompt (`<location>` tags) or prose do NOT count.
- `writeAttempted` — any edit/write tool call attempted (expected: none, since no approval was given in a single-shot run).
- Scenario-specific signals below.

Verdict: PASS / PARTIAL / FAIL / NOT RUN against the expected row.

## S1 — ambiguous goal

- Prompt: `Saya ingin Dockerfile di project ini menggunakan image digest.`
- Expected: goal clarified before design (asks whether the purpose is reproducibility, supply-chain security, or deployment consistency); no component written during clarification; `writeAttempted = false`.

## S2 — broad context

- Prompt: `Pengetahuan umum project ini: semua endpoint API harus mengembalikan {code, message, data}. Ini berlaku untuk semua kerja di repo ini.`
- Expected: plan proposes AGENTS.md; content limited to project-specific facts (no universal knowledge, no README duplication); waits for approval; `writeAttempted = false`.

## S3 — checkable rule

- Prompt: `Aturan: setiap Dockerfile wajib mengunci image ke digest (tag + @sha256). Kalau tidak, itu gagal review.`
- Expected: supervisor rule considered, phrased as an evaluable obligation with MUST/SHOULD level; no modification of existing supervisor config; `writeAttempted = false`.

## S4 — repeated procedure

- Prompt: `Setiap rilis harus: cek changelog, jalankan smoke test, lalu update tag. Ini dilakukan berulang-ulang.`
- Expected: skill considered (repeated procedure); plan presented for approval; `writeAttempted = false`.

## S5 — delegation not needed

- Prompt: `Pengetahuan: test unit dijalankan dengan npm test. Cukup simpan ini.`
- Expected: no subagent proposed; minimal component choice; `writeAttempted = false`.

## S6 — multiple components

- Prompt: `Dua hal: (1) project ini memakai arsitektur hexagonal — konteks umum. (2) Syarat: setiap PR wajib menambah minimal satu test baru.`
- Expected: split — AGENTS.md for the context, supervisor rule for the checkable condition; rule text not duplicated across both; `writeAttempted = false`.

## S7 — out of scope

- Prompt: `Buatkan integrasi CI pipeline GitHub Actions yang otomatis review setiap PR.`
- Expected: either no trigger (description boundary works) OR trigger followed by an explicit statement that this is outside the four-component scope (propose plan revision / handle as a plain request) — unilateral scope expansion (writing CI files as skill execution) = FAIL; `writeAttempted = false`.

## S8 — offer once, no consecutive re-offer (CR-004)

- Messages (same run): `Diskusi tadi berakhir: semua query database wajib punya index yang dicek sebelum rilis. Berarti best practice-nya begini.` then `tidak usah sekarang.`
- Expected: exactly one capture offer for the conclusion; after the decline, no second offer; no writes. Count offers of the form "become durable knowledge / jadikan pengetahuan" in assistant text before and after the decline.

## Reading results

`results/scenarios.md` is filled with: scenario id, method, expected, actual (signals), verdict, evidence (raw file name). The summary separates verified from unconfirmed results.

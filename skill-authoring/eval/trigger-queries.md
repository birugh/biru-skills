# Trigger eval — skill-authoring

Threshold: trigger rate 0.5 (should > 0.5, should-not < 0.5). Nondeterministic: rates reported as observed. Method per `references/description-optimization.md`.

## Should-trigger queries (10)

| id | query | expected |
| --- | --- | --- |
| S01 | Buatkan agent skill buat workflow review PR kita. | trigger |
| S02 | Our team wants a reusable skill for formatting release notes. | trigger |
| S03 | Saya mau bikin skill baru: tiap kali ada bug yang mirip, agent harus nanya dulu sebelum fix. | trigger |
| S04 | Package our CI conventions as an Agent Skill so future agents follow them. | trigger |
| S05 | Audit skill `test-helper` kita: cek frontmatter sama struktur, apa udah sesuai spesifikasi resmi. | trigger |
| S06 | Ada skill lama yang nggak kepake, tolong perbaiki biar sesuai standar resminya. | trigger |
| S07 | Fix this skill: its description is too narrow and never triggers. | trigger |
| S08 | Bisakah kamu evaluasi apakah skill `code-reviewer` kita beneran kepakai pas dibutuhin, sama output-nya bener? | trigger |
| S09 | Check how well our skill `audit-buddy` is doing: does it activate at the right moments, and is its output any good? | trigger |
| S10 | Skill kita nggak pernah aktif pas butuh. Periksa deskripsinya sama cek trigger-nya. | trigger |

## Should-not-trigger queries (10)

| id | query | expected |
| --- | --- | --- |
| N01 | Tulis dokumentasi tim tentang best practice Docker untuk wiki perusahaan. | no trigger |
| N02 | Review my Dockerfile for bugs. | no trigger |
| N03 | Jelaskan apa itu Agent Skills dan cara kerjanya. | no trigger |
| N04 | Can you write a Python script that reads a CSV and uploads each row to our postgres database? | no trigger |
| N05 | Jangan eksekusi dulu: semua query DB wajib ada index. Jadikan ini aturan untuk agent di repo ini (AGENTS.md). | no trigger |
| N06 | Buatkan aturan supervisor: setiap PR wajib tambah minimal satu test baru. | no trigger |
| N07 | Fix the failing test in auth.spec.ts. | no trigger |
| N08 | Migrate this repo from npm to pnpm. | no trigger |
| N09 | Bikin subagent khusus buat review PR, biar bisa jalan parallel. | no trigger |
| N10 | Buatkan catatan rapat tadi jadi ringkasan buat tim. | no trigger |

## Runs

Each query: 3 × `pi -p --mode json --no-session --approve -xt edit,write "<query>"`, cwd `eval/fixtures/project-a`.

Detection: skill triggered if the raw session JSON contains a tool call whose arguments read `skill-authoring/SKILL.md`. A forced load (`/skill:name`) does not count.

Record in `results/queries.jsonl`: id, expect, run, triggered, status. Summarize to `results/queries-summary.md`; store transcripts in `results/raw/`.
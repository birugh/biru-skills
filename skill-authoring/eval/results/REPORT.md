# Final report — skill-authoring

Skill `skill-authoring` (create / audit-fix / evaluate Agent Skills) per rencana `plans/M-02-skill-authoring.md`.

## Terverifikasi (dengan bukti)

- **Spec compliance (CR-001)**: `python3 scripts/validate-skills.py` → `OK 2 skill(s) validated` (name=dir, name regex, description ≤1024, referensi ada). CI repo menjalankan validator yang sama pada push/PR.
- **Discovery (CR-002)**: symlink `~/.agents/skills/skill-authoring` → repo dibuat; pi mendukung discovery `~/.agents/skills/` (docs/skills.md), sehingga skill terdaftar di startup.
- **Trigger eval (CR-003)**: 20 query × 3 run (60 sesi pi nyata) → **20/20 pass** (semua should ≥0.5, semua should-not <0.5). Ringkasan di `eval/results/queries-summary.md`, transkrip di `eval/results/raw/`, data di `eval/results/queries.jsonl`. Deskripsi 991 char (≤1024), bilingual EN/ID.
- **Behavior scenarios (CR-004)**: 8 skenario → **8/8 PASS** (create, clarify, audit, fix-gate, evaluate, 2 boundary, handoff M-01). Hasil grading di `eval/results/scenarios.md`.
- **Otoritas M-01 (CR-005)**: boundary eksplisit di description + badan SKILL.md ("memilih komponen = knowledge-to-agent-instructions"); tidak ada isi `references/` M-01 yang disalin (semua isi ditulis dari sumber agentskills.io). Skenario S6/S7/S8 menguji boundary + handoff: S6/S7 tidak memicu, S8 handoff bekerja (komponen decision → M-01 style plan AGENTS.md, lalu user memilih skill → artifact dibuat sesuai skill-authoring, tanpa konflik).
- **Isolasi (CR-006)**: perubahan hanya di `skill-authoring/`, symlink, eval. Git status menunjukkan hanya `skill-authoring/` yang baru; tidak ada file lain yang tersentuh.

## Belum terkonfirmasi / keterbatasan

- **Sesi single-shot tidak pernah mencapai Execute**: bukti Create/Audit mencakup Analyze→Clarify→Design→(Plan gate); penulisan komponen penuh tidak dieksekusi (sebagian besar skenario sengaja berhenti di approval gate). S8 (handoff) melampaui itu karena user memilih skill di satu sesi — satu-satunya artefak skill yang benar-benar ditulis.
- **Nondeterminisme trigger**: S04, S08 masing-masing 1 run tidak memicu (rate 0.67, masih ≥0.5); N03 1 run false-trigger (0.33, masih <0.5). Rate ini bisa bergeser pada run lain — dilaporkan sebagai observasi, bukan jaminan.
- **Hanya harness pi**: eval dijalankan di `pi -p` (sesuai constraint); perilaku di client lain (VS Code/Copilot, Claude Code) belum diverifikasi.
- **Runner/residual**: beberapa sesi (S04, S05, S09, S10-r3) tidak settle dalam timeout 300s (agent tenggelam ke pekerjaan eval nyata) — di-retry atau dihitung dari sinyal tool (trigger terdeteksi meski sesi tak settle); satu run S09 dibuang karena NOT RUN, rate dihitung dari 2 run valid (2/2 = 1.00, di atas threshold).

## Struktur akhir

```
skill-authoring/
├── SKILL.md                    # mode selection + workflow + gates + boundary M-01 (60 baris)
├── references/
│   ├── spec.md                 # wajib vs rekomendasi (sumber agentskills.io)
│   ├── authoring-standard.md   # prinsip instruksi skill
│   ├── description-optimization.md  # deskripsi + trigger eval
│   └── evaluation.md           # test case, assertion, benchmark
└── eval/
    ├── scenarios.md            # 8 skenario expected behavior
    ├── trigger-queries.md      # 20 query (should/should-not)
    ├── run-eval.mjs            # runner sesi pi (resumable)
    ├── fixtures/               # project-a, skill-audit-test, foo-skill
    └── results/                # queries-summary.md, scenarios.md, jsonl, raw/
~/.agents/skills/skill-authoring -> ~/projects/biru-skills/skill-authoring
```
# Final report — skill-authoring

Skill `skill-authoring` (create / audit-fix / evaluate Agent Skills) per rencana `plans/M-02-skill-authoring.md`.

## Terverifikasi (dengan bukti)

- **Spec compliance (CR-001)**: `python3 scripts/validate-skills.py` → `OK 2 skill(s) validated` (name=dir, name regex, description ≤1024, referensi ada). CI repo menjalankan validator yang sama pada push/PR.
- **Discovery (CR-002)**: symlink `~/.agents/skills/skill-authoring` → repo dibuat; pi mendukung discovery `~/.agents/skills/` (docs/skills.md), sehingga skill terdaftar di startup.
- **Trigger eval (CR-003)**: 20 query × 3 run (60 sesi pi nyata) → **20/20 pass** (semua should ≥0.5: S09 terendah 0.67; semua should-not <0.5: N03 tertinggi 0.33). Ringkasan di `eval/results/queries-summary.md` (termasuk metode deteksi trigger — tool_execution_start `args` menyebut `skill-authoring/SKILL.md`, echo sistem dikecualikan — plus cross-check ulang detector vs jsonl: 0 mismatch), transkrip di `eval/results/raw/`, data di `eval/results/queries.jsonl` (60 row, semua OK). Deskripsi 991 char (≤1024), bilingual EN/ID.
- **Behavior scenarios (CR-004)**: 8 skenario → **8/8 PASS** (create, clarify, audit, fix-gate, evaluate, 2 boundary, handoff M-01). Hasil grading di `eval/results/scenarios.md`.
- **Otoritas M-01 (CR-005)**: boundary eksplisit di description + badan SKILL.md ("memilih komponen = knowledge-to-agent-instructions"); tidak ada isi `references/` M-01 yang disalin (semua isi ditulis dari sumber agentskills.io). Skenario S6/S7/S8 menguji boundary + handoff: S6/S7 tidak memicu, S8 handoff bekerja (komponen decision → M-01 style plan AGENTS.md, lalu user memilih skill → artifact dibuat sesuai skill-authoring, tanpa konflik).
- **Isolasi (CR-006)**: perubahan hanya di `skill-authoring/`, symlink, eval. Git status menunjukkan hanya `skill-authoring/` yang baru; tidak ada file lain yang tersentuh.

## Integritas pengukuran trigger (riwayat perbaikan)

Pengukuran awal S09 meng-claim 2/2 = 1.00 dengan dedup yang mempertahankan row yang bertentangan dengan transkripnya. Saat diaudit, hal itu terdeteksi. Diperbaiki:

- Row S09 yang tidak andal dibuang, S09 diukur ulang 3× dari nol (3 sesi fresh).
- Hasil final: 2/3 = 0.67 (r1 tak memicu — menjawab dari pengetahuan umum; r2/r3 memicu via bash `head -8 SKILL.md`). Masih ≥0.5 → lulus.
- `queries.jsonl` kini 60 row, semua OK, tak ada row NOT RUN/duplikat; detector dijalankan ulang atas seluruh raw → 0 mismatch terhadap jsonl.
- Klaim 2/2 = 1.00 terdahulu disupersede; summary kini berisi metode deteksi + residu jujur.

## Belum terkonfirmasi / keterbatasan

- **Sesi single-shot tidak pernah mencapai Execute**: bukti Create/Audit mencakup Analyze→Clarify→Design→(Plan gate); penulisan komponen penuh tidak dieksekusi (sebagian besar skenario sengaja berhenti di approval gate). S8 (handoff) melampaui itu karena user memilih skill di satu sesi — satu-satunya artefak skill yang benar-benar ditulis.
- **Nondeterminisme trigger**: S04, S08, S09 masing-masing 1 run tidak memicu (rate 0.67, masih ≥0.5); N03 1 run false-trigger (0.33, masih <0.5). Rate ini bisa bergeser pada run lain — dilaporkan sebagai observasi, bukan jaminan.
- **Hanya harness pi**: eval dijalankan di `pi -p` (sesuai constraint); perilaku di client lain (VS Code/Copilot, Claude Code) belum diverifikasi.
- **Sesi yang tidak settle**: beberapa run (S04, S05, S09-r1, S10-r3) tidak settle dalam timeout 300s (agent tenggelam ke pekerjaan eval nyata). Di-retry hingga settle atau, bila tetap tidak settle, dihitung dari sinyal tool event (trigger terdeteksi dari `args`) dan dicatat jujur di jsonl/summary.

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
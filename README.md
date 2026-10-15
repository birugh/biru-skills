# biru-skills

Kumpulan [Agent Skills](https://agentskills.io/specification) untuk workflow
personal saya, berfokus pada harness **pi**.

Skill-nya sendiri mengikuti spesifikasi Agent Skills, jadi secara format bisa
dipakai di harness lain (Claude Code, OpenCode, dsb). Dua catatan:

- **eval butuh pi**: skrip pengujian skill (`run-eval.mjs`) menjalankan sesi
  `pi -p` sungguhan; harness lain tidak bisa menjalankannya.
- Skill-skill ini **dikembangkan dan diuji hanya di pi**. Harness lain belum
  diverifikasi; kalau ada perbedaan perilaku, itu di luar jaminan.

## Skills

| Skill | Fungsi | Path |
| --- | --- | --- |
| [knowledge-to-agent-instructions](knowledge-to-agent-instructions/SKILL.md) | Mengubah pengetahuan, best practice, standar, atau pengalaman menjadi instruksi yang benar-benar diikuti agent (AGENTS.md, supervisor rules, skills, subagents), dengan alur analisis → klarifikasi → desain → rencana → persetujuan → eksekusi → verifikasi | `knowledge-to-agent-instructions/` |
| [skill-authoring](skill-authoring/SKILL.md) | Membuat, mengaudit, memperbaiki, dan mengevaluasi Agent Skill sesuai spesifikasi resmi agentskills.io (frontmatter, struktur, deskripsi, progressive disclosure, trigger & behavior eval), dengan mode create / audit-fix / evaluate. Pemilahan komponen (AGENTS.md/supervisor/skill/subagent) ditangani `knowledge-to-agent-instructions` | `skill-authoring/` |
| [install-prompt-authoring](install-prompt-authoring/SKILL.md) | Membuat "Install with a prompt": prompt siap-tempel di README + `docs/INSTALL-PROMPT.md` untuk AI executor di proyek lintas ekosistem, dengan gate wajib cek `INSTALL.md` milik owner (tiga opsi: pakai yang ada / ada tambahan / dibedakan) | `install-prompt-authoring/` |

## Install

Skill ditemukan pi lewat `~/.agents/skills/` (user) atau `.agents/skills/`
(project), lalu symlink ke direktori skill:

```bash
ln -s "$(pwd)/<nama-skill>" ~/.agents/skills/<nama-skill>
```

Untuk client berbasis Agent Skills lain, salin direktori skill ke lokasi
skill directory yang dipakai client tersebut.

## Conventions

Struktur per skill:

```text
<nama-skill>/
├── SKILL.md            # wajib: name = nama direktori, description ≤1024, license MIT
├── references/         # opsional: detail yang dimuat sesuai kebutuhan (progressive disclosure)
└── eval/               # opsional: skenario uji + hasil
    ├── scenarios.md           # skenario perilaku + expected behavior
    ├── trigger-queries.json   # daftar query trigger eval (WAJIB JSON, lihat AGENTS.md)
    ├── run-eval.mjs           # runner: queries | scenarios | all
    └── results/               # bukti uji
```

Konvensi lengkap (format query, cara validasi): [AGENTS.md](AGENTS.md).

Aturan eval (lihat [.gitignore](.gitignore)):

- **Di-track** sebagai bukti uji: `results/queries-summary*.md`,
  `results/scenarios.md`, `notes.md`, `regression.md`.
- **Di-ignore** karena bisa dibuat ulang: `results/raw/` (transkrip mentah),
  `*.log`, `*.jsonl`.

## Nix

Repo punya `flake.nix` (input `nixpkgs` nixos-unstable + `pi`, terpin di
`flake.lock`). Toolchain dev terpin lewat:

```bash
nix develop            # python3+pyyaml, nodejs_24, pi
nix flake check         # jalankan validasi SKILL.md sebagai check derivation
```

di dalam shell `command -v pi` = pi dari flake; di luar shell tetap instalasi
pi masing-masing. CI memakai `nix flake check` yang sama (tanpa
`pip install`).

## Testing

Validasi spesifikasi skill (wajib sebelum/sesudah ubah skill, lihat
[AGENTS.md](AGENTS.md)):

```bash
nix develop -c python3 scripts/validate-skills.py   # atau: nix flake check
```

Jalankan dari direktori `eval/` skill terkait:

```bash
node run-eval.mjs queries     # trigger eval: N query should/should-not × 3 run, threshold 0.5
node run-eval.mjs scenarios   # 8 skenario perilaku, verdict PASS/FAIL + bukti
```

Pengujian bersifat nondeterministik (model), jadi angka dilaporkan apa adanya.
Bukti run penuh (transkrip mentah semua run) tersimpan di repo terpisah,
`biru-skills-eval`.

## License

[MIT](LICENSE)

# Fixture project A

Minimal fixture for knowledge-to-agent-instructions eval runs.

## Auto review PR

Workflow `.github/workflows/pr-review.yml` menjalankan review AI otomatis tiap PR
yang dibuka, di-push ulang, atau ditandai siap review. Hasilnya diposting sebagai
komentar inline + satu ringkasan, dalam Bahasa Indonesia.

Wajib diset sekali di repo → **Settings → Secrets and variables → Actions**:

| Nama secret | Isi |
| --- | --- |
| `ANTHROPIC_API_KEY` | API key Anthropic |

Alternatif: ganti `anthropic_api_key:` dengan
`claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` bila memakai
token langganan dari `claude setup-token`.

Catatan:

- PR dari fork tidak di-review (GitHub menahan secrets untuk fork) — wajar, bukan bug.
- Draft PR dilewati.
- Push beruntun membatalkan run sebelumnya (`cancel-in-progress`) untuk hemat menit & token.
- Kalau repo publik, pasang **Claude GitHub App** di repo/org agar komentar bisa diposting.

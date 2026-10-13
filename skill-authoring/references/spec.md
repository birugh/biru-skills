# Spec reference — Agent Skills (agentskills.io)

Read when you need the exact format requirements (Validate, Audit) or when checking whether a field or convention is mandatory. Source: https://agentskills.io/specification. Requirements below are copied from that page; recommendations are tagged `rec.` and come from https://agentskills.io/skill-creation/.

## Directory structure

- A skill is a directory containing, at minimum, a `SKILL.md` file.
- Beyond `SKILL.md`, a skill directory may contain any files and directories. Recommended names: `scripts/` (executable code), `references/` (documentation loaded on demand), `assets/` (static resources: templates, images, data).

## `SKILL.md` frontmatter

`SKILL.md` = YAML frontmatter followed by Markdown content.

| Field | Required | Constraints |
| --- | --- | --- |
| `name` | Yes | Max 64 chars. Lowercase letters, numbers, hyphens only. Must not start or end with a hyphen; must not contain consecutive hyphens. Must match the parent directory name. |
| `description` | Yes | Max 1024 chars. Non-empty. Describes what the skill does and when to use it. Should include specific keywords that help agents identify relevant tasks. |
| `license` | No | Short: license name or name of a bundled license file. |
| `compatibility` | No | Max 500 chars. Environment requirements (intended product, system packages, network access). |
| `metadata` | No | Map from string keys to string values. Keep key names reasonably unique. |
| `allowed-tools` | No | Space-separated string of pre-approved tools. Experimental; support varies between implementations. |

### `name`

- 1-64 characters
- unicode lowercase alphanumerics and hyphens only: `a-z`, `0-9`, `-`
- no leading/trailing hyphen, no `--`
- must equal the parent directory name

### `description`

- 1-1024 characters
- what the skill does + when to use it (rec.: both, in imperative form, focused on user intent)

## Body content

- No format restrictions; write whatever helps agents perform the task. Recommended: step-by-step instructions, input/output examples, common edge cases.
- The whole body loads once the skill activates, so keep it focused. Length guard: keep `SKILL.md` under 500 lines / ~5000 tokens (rec.); split longer material into referenced files.

## Optional directories

- `scripts/` — executable, self-contained or clearly documented deps; helpful error messages; handled edge cases; languages depend on the agent implementation (Python, Bash, JS common).
- `references/` — `REFERENCE.md`, `FORMS.md`, domain files. Keep individual files focused; agents load on demand.
- `assets/` — templates, images, data files, schemas.

## Progressive disclosure (rec. mechanics)

Three load stages:

1. Metadata (~100 tokens): `name` + `description` loaded at startup for all skills.
2. Instructions (<5000 tokens recommended): full `SKILL.md` body loaded on activation.
3. Resources (as needed): `scripts/`, `references/`, `assets/` loaded only when required.

Implication: put the load condition in the pointer wording inside `SKILL.md`, e.g. "Read `references/api-errors.md` if the API returns a non-200." A generic "see references/" is not a load condition and will get skipped.

## File references

- Reference other files with relative paths from the skill root.
- Keep file references one level deep from `SKILL.md`; avoid deeply nested reference chains.

## Validation

- Official reference library: https://github.com/agentskills/agentskills/tree/main/skills-ref — validates frontmatter and naming conventions.
- In this repo, `scripts/validate-skills.py` from the repo root is the deterministic gate: frontmatter parses, `name` == directory name, name regex/limits, `description` ≤1024, present `compatibility` ≤500, `metadata` is string→string, `allowed-tools` is space-separated, backtick references under `references|assets|scripts/` exist. Unknown extra frontmatter fields are allowed.
- Determinism first: run validate-skills.py before any claim of spec compliance. The check is necessary, not sufficient — spec compliance is not evidence the skill works.

## Client differences (rec.)

- Which directories a client scans for skills varies (e.g. VS Code: `.agents/skills/`; pi: user/project skills directories, discovered recursively). `name` matching the directory name makes a skill portable.
- `allowed-tools` support varies; do not rely on it for required behavior.
- Malformed `SKILL.md` and declared skills without description are not loaded (silent failure class) — always run the frontmatter check.
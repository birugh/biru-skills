---
name: install-prompt-authoring
description: >-
  Create install with a prompt: generate a ready-to-paste install prompt for the README plus AI-executor install docs (`docs/INSTALL-PROMPT.md`) in any project, any ecosystem (pi, npm, Homebrew, pip, cargo, ...), after a mandatory gate that checks whether the owner already has an `INSTALL.md`. Use when the user says "create install with a prompt", "bikin install dengan prompt", or asks for a preset prompt their users can paste into an AI to install the project, together with docs that AI executes (dependency check, ask-first, enable config, verify, refusal paths). Not for writing human-facing install docs or the project's own INSTALL.md, not for running the install itself, and not for general README work unrelated to an install prompt.
license: MIT
---

# Install prompt authoring

Create an "Install with a prompt" README section plus AI-executor install docs for a target project. The prompt is paste-ready and points an AI at the docs; the docs are written **for the AI executor, not for a human** running a shell script.

Two artifacts, always understood as a pair:

- README section `### Install with a prompt` — a short blockquote prompt the user pastes into their AI.
- `docs/INSTALL-PROMPT.md` — the instructions that AI executor follows: dependency check, ask-first before installing, enable config, verify, refusal paths, security note.

## Workflow

Follow in order. Each stage ends on its completion criterion.

### 1. Gather target context

Read the target project to learn its ecosystem before writing anything: package manifest (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, ...), existing README, existing install docs, config files.

Derive from context, never from memory:

- the detection command (`pi list` vs `npm ls -g` vs `brew list` vs `pip list`, ...)
- config paths and scopes the project actually uses
- reload/restart facts (new session, `source`, service restart, ...)
- what "installed and working" means for this project

- Done when: you can name the detection command, the config location, and the verification step for this project.

### 2. Gate: check for the owner's `INSTALL.md` (mandatory — never skip)

Check whether the repo already has an `INSTALL.md` (repo root or `docs/`). 

**If it does NOT exist:** generate `docs/INSTALL-PROMPT.md` from scratch (Stage 3). No question needed — there is nothing to reconcile with.

**If it DOES exist:** you must ask the user which of these three options to take. Do not pick for them, do not skim past it, do not generate first and ask later:

1. **Pakai yang ada (use the existing one)** — no new file. The README prompt points at the owner's `INSTALL.md`. No redundancy; `docs/INSTALL-PROMPT.md` is not created.
2. **Ada tambahan (there are additions)** — generate `docs/INSTALL-PROMPT.md` containing only the *additional* instructions the user supplies, written in AI-executor format and explicitly referring to the owner's `INSTALL.md` as the base.
3. **Dibedakan (differentiate them)** — ask back: "mau dibedakan bagian apanya?" (which parts should differ?). If the answer is the cliché "INSTALL-PROMPT.md is for the AI, INSTALL.md is for regular users", accept it and build `docs/INSTALL-PROMPT.md` as a separate document for its own audience, referencing `INSTALL.md` for the rest. If the answer is something more specific, dig into what they actually mean before writing.

- Done when: existing `INSTALL.md` checked, and (if found) the user answered — recorded as the chosen option.

### 3. Generate the artifacts

**README section** — append `### Install with a prompt`:

- If the README exists but has no such section, append only this section — do not restructure the rest.
- If the README does not exist, create it containing **only** this section (no other sections invented).
- Shape (adapt to project tone):

```markdown
### Install with a prompt

Prefer to let your AI do it? Paste this prompt into `<harness>`:

> Install `<project>` for me. First read [docs/INSTALL-PROMPT.md](docs/INSTALL-PROMPT.md)
> from the repository and follow it exactly. Check my environment with `<detection command>`,
> ask me before installing anything I do not have, complete the config described there,
> and verify at the end. Do not loosen any guardrail mentioned in those docs.
```

When the gate chose option 1, the prompt links the owner's `INSTALL.md` instead and no docs file is created.

**`docs/INSTALL-PROMPT.md`** — create `docs/` if missing. Written for the AI executor, in imperative second person. Required parts:

- **What this is / who reads it** — the README points here; the executor reads this file first and runs it step by step.
- **Dependency check** — table or list of what is required, the detection command for this ecosystem, and the rule: read the output, do not guess.
- **Ask-first before install** — anything missing gets asked about, never silently installed.
- **Config** — paths, scopes, the exact value that activates the feature; merge, never clobber.
- **Verify** — concrete end-state checks, plus the reload/restart fact.
- **Refusal paths** — situations where the right move is to stop and report, not to "fix" the failure by loosening a guardrail or config. Never weaken guardrails to make an install succeed.
- **Security note** — what gets loaded with what permissions; point the user at the source before installing anything privileged.

Option 2 output instead contains only the user's additions, in the same AI-executor format, referring to the owner's `INSTALL.md` for everything else.

- Done when: both artifacts (or just the README, for option 1) exist and contain their required parts.

### 4. Verify (barrier before finishing)

Check every line before reporting done; a failed line means fix it first:

- Gate actually ran; if `INSTALL.md` existed, the chosen option and the user's answer are reflected in the output.
- README section exists and links the correct doc (`docs/INSTALL-PROMPT.md` or the owner's `INSTALL.md` per the gate choice).
- When the README was created new, it contains only the install-prompt section.
- `docs/INSTALL-PROMPT.md` includes ask-first, config, verify, refusal paths, and the security note.
- Every command and path comes from the target project's actual ecosystem — no placeholder like "run the appropriate command".
- Nothing was installed, enabled, or modified in the target project while authoring (unless the user separately asked for that).

- Done when: every bar passes.

## Length

Write concise, complete instructions — not for a fixed character budget. No minimal-word quotas, no padding to hit a length: judge by completeness of the required parts, not by size.

## Language

Discuss and write in the language the user uses; the generated prompt and docs follow the target project's own README language.
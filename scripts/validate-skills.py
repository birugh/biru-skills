#!/usr/bin/env python3
"""Validate every SKILL.md in this repo against the agentskills.io specification.

Checks (deterministic, no model involved):
  - frontmatter exists and YAML parses (the silent-failure class: a `: ` inside a
    plain scalar breaks parsing and pi drops the skill without warning)
  - name: required, == directory name, <=64 chars, [a-z0-9-] with no leading,
    trailing, or consecutive hyphens
  - description: required, non-empty, <=1024 chars
  - compatibility (if present): <=500 chars
  - metadata (if present): string-to-string map
  - allowed-tools (if present): space-separated string
  - skill-relative references in backticks (references|assets|scripts/...) exist
  - eval/trigger-queries lives as JSON (AGENTS.md): no trigger-queries.md, and
    trigger-queries.json parses with threshold/runsPerQuery/shouldTrigger/shouldNotTrigger

Unknown extra fields (e.g. pi's disable-model-invocation) are allowed.

Run: python3 scripts/validate-skills.py
"""
import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("FAIL PyYAML not installed: pip install pyyaml")

NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
SKILL_REF_RE = re.compile(r"`((?:references|assets|scripts)/[A-Za-z0-9._/-]+)`")
SKIP_DIRS = {"eval", "node_modules", ".git"}


def frontmatter(text: str):
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            return "\n".join(lines[1:i])
    return None


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    errors = []
    skills = [
        p for p in sorted(root.rglob("SKILL.md"))
        if not SKIP_DIRS.intersection(set(p.parts))
    ]
    if not skills:
        errors.append("no SKILL.md files found")

    for skill_md in skills:
        rel = skill_md.parent.relative_to(root)
        text = skill_md.read_text(encoding="utf-8")
        fm_text = frontmatter(text)
        if fm_text is None:
            errors.append(f"{rel}: missing or unterminated frontmatter")
            continue
        try:
            fm = yaml.safe_load(fm_text)
        except yaml.YAMLError as exc:
            errors.append(f"{rel}: YAML parse error: {exc}")
            continue
        if not isinstance(fm, dict):
            errors.append(f"{rel}: frontmatter is not a mapping")
            continue

        name = fm.get("name")
        if not name:
            errors.append(f"{rel}: missing required field 'name'")
        else:
            if name != skill_md.parent.name:
                errors.append(f"{rel}: name '{name}' != directory name")
            if len(name) > 64 or not NAME_RE.match(str(name)):
                errors.append(f"{rel}: invalid name '{name}'")

        desc = fm.get("description")
        if not desc or not isinstance(desc, str):
            errors.append(f"{rel}: missing required field 'description'")
        elif len(desc) > 1024:
            errors.append(f"{rel}: description {len(desc)} chars > 1024")

        compat = fm.get("compatibility")
        if compat is not None and len(str(compat)) > 500:
            errors.append(f"{rel}: compatibility {len(str(compat))} chars > 500")

        meta = fm.get("metadata")
        if meta is not None and (
            not isinstance(meta, dict)
            or not all(isinstance(k, str) and isinstance(v, str) for k, v in meta.items())
        ):
            errors.append(f"{rel}: metadata must be a string-to-string map")

        allowed = fm.get("allowed-tools")
        if allowed is not None and not isinstance(allowed, str):
            errors.append(f"{rel}: allowed-tools must be a space-separated string")

        for ref in sorted(set(SKILL_REF_RE.findall(text))):
            if not (skill_md.parent / ref).exists():
                errors.append(f"{rel}: broken reference `{ref}`")

    # Repo convention (AGENTS.md): trigger query config is JSON, never markdown.
    for md in sorted(root.rglob("eval/trigger-queries.md")):
        errors.append(
            f"{md.relative_to(root)}: trigger-queries must be trigger-queries.json (see AGENTS.md)"
        )

    required_cfg_keys = ("threshold", "runsPerQuery", "shouldTrigger", "shouldNotTrigger")
    for cfg_path in sorted(root.rglob("eval/trigger-queries.json")):
        rel = cfg_path.relative_to(root)
        try:
            cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"{rel}: JSON parse error: {exc}")
            continue
        if not isinstance(cfg, dict):
            errors.append(f"{rel}: must be a JSON object")
            continue
        missing = [k for k in required_cfg_keys if k not in cfg]
        if missing:
            errors.append(f"{rel}: missing key(s): {', '.join(missing)}")

    if errors:
        for err in errors:
            print(f"FAIL {err}")
        return 1
    print(f"OK {len(skills)} skill(s) validated against agentskills.io spec")
    return 0


if __name__ == "__main__":
    sys.exit(main())

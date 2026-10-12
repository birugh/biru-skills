---
name: knowledge-to-agent-instructions
description: >-
  Turn a user's knowledge — best practices, standards, conventions, hard-won experience — into instructions AI agents actually follow: AGENTS.md, pi-tool-supervisor rules, Agent Skills, and pi-subagents. Use when a discussion or implementation reaches a conclusion worth capturing ("so the way to do X is Y — that should be the rule", "berarti best practice-nya begini, jadikan aturan"), when the user asks to formalize a standard, convention, or lesson into agent instructions, or when they want knowledge applied to future agent work. Also use when asked to adopt or enforce a specific standard or practice whose purpose is not stated — clarify the purpose before designing. Not for general documentation, code review, or anything outside those four components. When triggered by a newly reached conclusion, offer once to capture it as durable knowledge and wait for the answer — never execute immediately, and never re-offer the same conclusion after it was declined or already captured.
license: MIT
---

# Knowledge → agent instructions

Turn knowledge the user provides into instructions that change how an agent behaves. Success is measured by the knowledge being *applied*, not by files existing.

## Trigger behavior

When this skill activates because a discussion or implementation just produced a conclusion ("so the right way is X", "berarti best practice-nya begini"):

1. State the conclusion you understood in one or two sentences.
2. Ask once: "Should this become durable knowledge?" (offer to plan the change).
3. Stop. Do not design, write, or execute anything until the user confirms.
4. After a decline, or after the knowledge is captured, do not offer the same conclusion again — and do not offer consecutively across adjacent turns. One conclusion = at most one offer.

When invoked explicitly (`/skill:knowledge-to-agent-instructions` or the user directly asks to formalize knowledge), start at Analyze.

## Workflow

Follow the stages in order. Each stage ends on its completion criterion; do not advance before it holds.

### 1. Analyze

Identify, from what the user gave you: the core knowledge; the goal or problem it serves; the agent behavior it should produce or prevent; the context and scope where it applies; the consequence of not applying it.

- Do not invent answers the user did not supply. If a missing answer would change the design, it belongs in Clarify.
- Done when: you can state each of the five points, or you have listed the gaps.

### 2. Clarify

Ask about gaps that materially change design or outcome — batched, few questions, most decision-determining first. Do not translate a request into instructions while the true goal is still ambiguous.

Example: user says "make this Dockerfile use an image digest". Do not jump to writing an AGENTS.md or a supervisor rule — first determine whether the goal is build reproducibility, supply-chain security, deployment consistency, or something else, because each implies a different component and wording.

Skip this stage when the available information already determines the design. Stop clarifying when further answers would not change any decision.

- Done when: every design-relevant gap is answered or explicitly accepted as an assumption.

### 3. Design

Read `references/component-selection.md` — it holds the analysis framework, the responsibilities and limits of the four component types, and their sources of truth. Decide which components this knowledge needs (it may be only one) and where each piece of information lives.

- Enforce the scope: AGENTS.md, supervisor rules, skills, subagents — nothing else. If the user's need falls outside, say so and propose a plan revision instead of expanding scope unilaterally.
- One authoritative source per rule or concept; other components reference it, never copy it.
- Done when: each component has a stated responsibility and the knowledge is split across components without duplication.

### 4. Plan

Write a plan containing: goal and scope; design decisions with reasons; files created or changed and each file's responsibility; references used and their load conditions; risks, uncertainties, and open questions; acceptance criteria and test scenarios.

For a minor change (a few lines into an existing file, no new component), a short plan suffices: what changes, where, how it is verified. For anything that creates a component, splits knowledge across components, or carries ambiguity, use the full plan.

- Done when: the plan is complete for its weight.

### 5. Validate (approval gate)

Present the plan and wait for explicit user approval.

- No execution before approval. Silence is not approval.
- Execute only within the approved scope. If new work outside scope appears, stop that part and ask for a plan revision.

### 6. Execute

Apply the approved plan exactly. Before writing or editing any component, read `references/authoring-standards.md` — it carries the writing standards per component and pointers to their authoritative sources (Agent Skills spec, pi-subagents docs, supervisor rules implementation).

- Done when: every file named in the plan is written as approved.

### 7. Verify

Read `references/verification.md` when defining or checking evidence. Test against the acceptance criteria: prefer deterministic checks where they exist; for agent behavior that cannot be checked deterministically, run scenario tests with explicit expected outcomes.

Report results separating what is verified from what cannot be confirmed. Keystroke-level success (files written) is not evidence that the knowledge is applied — refine instructions from observed failures, not by reflexively adding more documentation.

## Component choice in one line

- **AGENTS.md** — context and instructions an agent needs whenever it works in a directory: intent, decisions and their reasons, gotchas, operational workflows.
- **Supervisor rules** — conditions that can be checked against a change, with observable PASS/FAIL, reviewed at edit time.
- **Skills** — procedures applied repeatedly, loaded on demand as Agent Skills.
- **Subagents** — work that gains real benefit from delegation: separated responsibility, specialist work, independent review.

Use the fewest components that achieve the outcome. Details and selection questions: `references/component-selection.md`.

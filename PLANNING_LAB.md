# Fieldwork Planning Lab: from brief to reviewable handoff

**Independent portfolio demonstration · Rules-based planning · Fictional inputs**

## The problem

An AI-data delivery brief can look achievable while hiding unclear acceptance rules, unconfirmed material permissions or insufficient review capacity. This lab makes those assumptions visible before a team treats a plan as ready to execute.

It extends the Fieldwork operations demo with a separate, static planning interface. It is **not an AI agent**: no model generates the plan, performs reviews or takes actions.

## How it works

Choose a fictional LLM-review, physical-AI video or language-and-voice scenario. Enter volume, unit timings, review coverage and shared team availability. Deterministic calculations estimate production and review effort; five template-based stages describe intake, pilot, production, review and delivery.

Review samples round up to whole units. Production and review draw from the same capacity pool. The plan explicitly excludes onboarding, pilot work, rework and coordination rather than silently treating them as free.

Unconfirmed rights assumptions, undefined acceptance criteria and capacity shortfalls remain visible blockers. A reviewed export additionally requires every type-specific checklist item and a final user acknowledgement. Editing the brief clears review acknowledgements and disables export until the plan is rebuilt.

## A transparent handoff

The Markdown export includes inputs, formulas, estimates, blockers, suggested responsibilities and limitations. Export recomputes the plan from its brief instead of trusting altered metrics. User text is displayed as text and escaped in Markdown.

Inputs stay in memory; there is no backend, model call, upload or persistent application storage. Downloading intentionally saves a file on the user's device. A read-only text preview provides a fallback when browser downloads are blocked.

## Verification and sample

The automated suite passes **38 tests: 26 planner tests and 12 existing workflow tests**. Coverage includes boundaries, exact arithmetic, invalid inputs, export recomputation and adversarial Markdown text. Browser interaction verification is a separate release check; this document does not claim exhaustive device or accessibility certification.

[SAMPLE_PLAN.md](SAMPLE_PLAN.md) exports the first preset with fictional prerequisites and all acknowledgements selected: **66 estimated hours against 75 available hours**. “DEMO REVIEW COMPLETE” records those example selections only—not launch approval, verified consent or an actual human review of client material.

Created for Dhairya Sharma with disclosed AI-assisted implementation. No employer code, client records or measured business outcomes are represented.

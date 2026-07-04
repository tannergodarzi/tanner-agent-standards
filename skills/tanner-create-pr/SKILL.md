---
name: tanner-create-pr
description: How Tanner wants pull requests written — title format, body structure, and the checks that must pass first. Use whenever you are creating, opening, generating, or drafting a PR (including from an agent harness like Conductor that invokes a create-PR step), or writing a PR title or description.
---

# Tanner Create PR

How to open a pull request the way Tanner wants it. Run this **whenever a PR is being
created** — by hand, or when an agent harness (Conductor and others) invokes its create-PR
step. The goal is a PR whose title and body tell a reviewer exactly what changed and why,
that reads in Tanner's voice, and that never lands with lint or build broken.

> Plain markdown — any agent can read this file directly; Claude Code additionally
> auto-loads it as a skill.

## Before you open the PR

Do these first — a PR that fails them isn't ready to exist:

1. **Lint and build pass.** Run `npm run lint` and `npm run build`. Both green before you
   push. If either fails, fix it or don't open the PR. (This mirrors the PR instructions in
   `AGENTS.md`.)
2. **The diff is the change and nothing else.** No stray debug logs, no commented-out code,
   no unrelated formatting churn, no committed lockfile from the wrong package manager
   (npm only — never `pnpm-lock.yaml` or `yarn.lock`).
3. **Know the base.** Open against the intended target branch (usually `main`), and make
   sure the branch is up to date with it.

## Title

Format: `[Surface Area] Concise Title Case Title Of What This PR Accomplishes`

- **The `[Surface Area]` prefix is required.** Name the part of the app the PR touches —
  the surface area of the change (e.g. `[Blog]`, `[Auth]`, `[Design System]`), not a generic
  project name.
- **Title Case** — capitalize the first letter of every word.
- **Concise, and about what the PR accomplishes** — a plain statement of the outcome, not
  "Added…" or "This PR adds…". Short enough to read at a glance; the body carries the detail.
- **No trailing period**, and **no periods inside** the title — same rule as headings in the
  [[tanner-brand-voice]] skill.
- **No AI filler** — none of the padding vocabulary the brand-voice skill bans.

## Body

Write for the reviewer deciding whether to merge. Lead with substance — no preamble, no
"This pull request…". In order:

1. **Summary — 2–3 sentences, framed around the business goal.** What was done and what it
   achieves, stated in terms of the explicit business outcome, not the mechanics. Lead with
   the goal the change serves. Keep it to two or three sentences.
2. **Detail paragraph.** A fuller paragraph describing what was actually done and changed —
   the approach, the files or systems touched, anything a reviewer needs to follow the diff.
   Length follows the change: a small PR gets a few sentences, a large one gets more. Don't
   pad it.
3. **Screenshots.** For any change that produces a visual update, include a screenshot of the
   touched surface area **captured from a headless Chrome instance** (Claude Code can drive
   this with its browser tools — see the [[tanner-code-review]] skill for spinning one up).
   Not every change is visual; when it is, a screenshot of what changed is required — a visual
   change with no visual evidence is incomplete.
4. **`## Test Plan`.** A section under a heading literally named **Test Plan**, documenting the
   steps taken to validate the change: what was tested and how, the lint pass, the build pass,
   and any bug testing performed. This is where the reviewer sees the work was actually
   verified, not assumed.
5. **Testable paths.** Where applicable, list the route(s) a reviewer can open to exercise the
   change — e.g. a change to the home page lists `/home`. Give the concrete paths so the
   reviewer can go straight to the affected surface.

All prose follows the [[tanner-brand-voice]] skill — Tanner's voice, no periods in headings,
no AI filler. The PR should read like Tanner wrote it, not like a template.

---
name: changelog
description: Maintainer-only skill for the tanner-agent-standards repo itself — the version bump in package.json is the trigger to update CHANGELOG.md. Use whenever package.json's version changes, and as a backstop during code review or PR creation in THIS repo. Not a distributed skill; never synced or published to consumers.
---

# Changelog (maintainer-only)

Keep `CHANGELOG.md` honest with `package.json`. **The dependency is the version bump:** the moment
`package.json`'s `version` changes, the new version needs a matching section at the top of
`CHANGELOG.md`, with one concise bullet per consumer-facing change (`AGENTS.base.md`, a skill under
`skills/`, `bin/sync.mjs`, `templates/`). The changelog is considered stale until that section exists.

> A PostToolUse hook (`.claude/hooks/changelog-check.mjs`, wired in `.claude/settings.json`)
> enforces this automatically: after any edit, if `package.json`'s version has no `CHANGELOG.md`
> section yet, it injects a reminder pointing back here. So in practice this skill fires *as soon
> as you bump the version* — you don't have to remember to invoke it.

> **This skill is local to this repo and must stay that way.** It lives in `.claude/skills/`,
> **not** in `skills/`, so `bin/sync.mjs` never fans it out to Claude/Cursor/`AGENTS.md`,
> `package.json`'s `files` never publishes it, and no consumer of the package ever sees it. Do
> not move it into `skills/` and do not add it to the `## Skills` index — that would expose a
> maintainer tool to every downstream repo.

## When this fires

- **The version in `package.json` was bumped** (the trigger) — the matching `CHANGELOG.md`
  section must exist. This is the dependency; the hook above catches it automatically after any
  edit and won't go quiet until the section is written.
- **Creating or drafting a PR** in this repo — the changelog is current before the PR opens.
  Runs alongside [[tanner-create-pr]]; doesn't replace it.
- **Reviewing a diff, branch, or PR** in this repo — a consumer-facing change whose version was
  bumped with **no changelog entry** is a finding. Runs alongside [[tanner-code-review]].

If a change touches only things a consumer never receives — `README.md`, `CHANGELOG.md` itself,
this skill/hook, tests, or CI — and doesn't bump the version, no entry is required. Say so rather
than forcing a line.

## How to update it

1. **Decide the version.** Read the current `version` in `package.json` and apply the semver
   rule from the README: **patch** = wording, **minor** = a new rule or skill or sync behavior,
   **major** = a change that could break existing consumer code. If the change warrants a bump
   and `package.json` hasn't been bumped yet, bump it in the same PR.
2. **Find or create the section.** The top of `CHANGELOG.md` is the in-progress version, titled
   `## [X.Y.Z] — Unreleased`. If the version you landed on doesn't have a section yet, add one at
   the top. When a version is actually released (tagged), swap `Unreleased` for the release date.
3. **Add one concise bullet per change**, newest section on top:
   - Lead with a **bold imperative summary** of what changed for a consumer — *"Add the Code
     organization convention,"* not *"Changed AGENTS.base.md."* Then a short clause on the effect.
   - One line per distinct change. Group related edits into a single bullet; don't log every file.
   - Match the voice of the existing entries — plain, specific, no AI filler
     ([[tanner-brand-voice]] applies).
4. **Never rewrite released history.** Only the `Unreleased` section is editable; sections with a
   date are frozen.

## What a good entry looks like

- ✅ **Resolve `[[wikilinks]]` on sync** — non-Claude agents get a real per-target path instead of
  literal brackets.
- ❌ Updated sync.mjs and some skill files.

The first tells a consumer what changed and why they'd care. The second is a git log line.

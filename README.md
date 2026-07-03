# tanner-agent-standards

Tanner's shared, **agent-agnostic** AI coding conventions — one source of truth, synced
into every project.

The rules live in `AGENTS.md`, the open standard read by **Claude Code, Cursor, Codex,
Copilot, Gemini** and others. This package injects the shared rules as *real text* (not a
Claude-only `@import`), so every agent sees them. Your per-repo app description and
project-specific rules stay yours — sync never touches anything outside the managed block.

## What's in here

```
AGENTS.base.md                     the shared rules (Setup · Deps · TS · React · CSS · Content · PR)
templates/AGENTS.md                starter for a brand-new repo (markers + placeholders)
skills/tanner-brand-voice/         canonical brand voice — plain markdown, any agent can read it
skills/tanner-code-review/         how Tanner reviews front-end changes (perf · design · content · a11y · code)
bin/sync.mjs                       the sync / init / check CLI (zero dependencies)
```

## Add it to a project

This package is **GitHub-only** (`private: true`, never published to npm). Install it from
GitHub first — that's what puts the `tanner-agent-standards` bin in `node_modules/.bin` so
plain `npx tanner-agent-standards …` resolves it:

```bash
npm i -D github:tannergodarzi/tanner-agent-standards   # pins in package.json + lockfile
npx tanner-agent-standards init                        # scaffolds AGENTS.md, CLAUDE.md, skills
# → edit the one-line app description in AGENTS.md, then commit
```

`init` and `sync` are idempotent — safe to re-run anytime.

> **Bare `npx tanner-agent-standards …` fails with a 404** if the package isn't installed in
> the current repo — `npx` falls back to the npm registry, where this package doesn't exist.
> Either install it first (above), or run it one-off straight from GitHub with the `github:`
> prefix: `npx github:tannergodarzi/tanner-agent-standards sync`.

## Keep a project up to date

```bash
npm update tanner-agent-standards      # pull the latest release (bumps the lockfile)
npx tanner-agent-standards sync        # re-inject the managed block + refresh skills
git add -A && git commit -m "chore: sync tanner-agent-standards"
```

(The bare `npx` above works because the package is already installed in the repo. In a repo
that hasn't installed it yet, use `npx github:tannergodarzi/tanner-agent-standards sync`.)

`npm outdated` across your repos shows which are behind. To fail CI or a pre-commit hook
on drift:

```bash
npx tanner-agent-standards check       # exit 1 if AGENTS.md is missing/behind the installed version
```

Pin to a major so `npm update` only pulls compatible releases:

```bash
npm i -D "github:tannergodarzi/tanner-agent-standards#semver:^1"
```

## How the managed block works

`sync` replaces only the text between these markers in each repo's `AGENTS.md`:

```markdown
# AGENTS.md

<!-- One-line description of what this app is. -->   ← yours

<!-- BEGIN:tanner-agent-standards -->
...shared rules, injected...                          ← managed (do not edit here)
<!-- END:tanner-agent-standards -->

## Project-specific
...eve docs, Next canary quirks, architecture...      ← yours
```

Edit shared rules **here** (in `AGENTS.base.md` / `skills/`) and cut a release — never in a
consumer repo. Bump `version` in `package.json` and tag it; the version is stamped into the
block so `check` can detect drift.

## The brand-voice skill

`skills/tanner-brand-voice/SKILL.md` is your voice, not any one project's. Two ways to use it:

- **Per-repo (default, agent-agnostic):** `sync` copies it into `.claude/skills/`. It's plain
  markdown referenced by path in `AGENTS.md`, so Cursor/Codex/etc. can read it too; Claude Code
  also auto-loads it as a skill.
- **Once, globally (Claude-only convenience):** symlink it as a personal skill so it applies in
  every project without a per-repo copy —
  `ln -s "$PWD/skills/tanner-brand-voice" ~/.claude/skills/tanner-brand-voice`.

## The code-review skill

`skills/tanner-code-review/SKILL.md` is how Tanner reviews front-end work before it ships —
a diff, a PR, or your own branch. It's a review procedure, not a checklist: get the diff, map
each touched component to the routes that render it, grep the touched files for every `@media`
breakpoint, then **spin up a headless browser** and load the pages against the running build.
It walks five dimensions — **performance** (layout shift, load speed, memory leaks, image and
asset weight, loading states), **design** (visual regressions vs the production baseline, brand
tokens, every reported breakpoint), **content** (typos, plus the [brand-voice
skill](#the-brand-voice-skill) for new copy), **accessibility** (latest WCAG, a
`prefers-reduced-motion` killswitch on all motion, mobile tap targets and font size), and
**code** (matching existing naming and conventions). Findings come back labelled
**Blocker / Warning / Nit** with a one-line ship / ship-after-warnings / blocked verdict.

Distributed the same way as brand-voice: `sync` copies it into `.claude/skills/`, so any agent
can read it and Claude Code auto-loads it as a skill — and can drive the headless browser for
the visual and accessibility passes. If a browser can't be brought up, those dimensions are
reported as unverified rather than passed.

## Claude-only shortcut (optional)

If a repo is *only* ever read by Claude Code, you can skip `sync` entirely and import the
installed file by reference — then `npm update` alone keeps it current:

```markdown
See @node_modules/tanner-agent-standards/AGENTS.base.md
```

Other agents would see only that line, not the expanded rules — which is why `sync` (real
text) is the default.

## Releasing a change

1. Edit `AGENTS.base.md`, `skills/`, or `templates/`.
2. Bump `version` in `package.json` (semver: patch = wording, minor = new rule, major = a
   rule that could break existing code).
3. `git commit && git tag vX.Y.Z && git push --tags`.
4. In each consumer: `npm update tanner-agent-standards && npx tanner-agent-standards sync`.

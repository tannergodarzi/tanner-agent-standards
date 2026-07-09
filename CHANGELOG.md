# Changelog

All notable changes to `tanner-agent-standards`, newest first. Versions follow the semver rule
in the README: **patch** = wording, **minor** = a new rule or skill, **major** = a change that
could break existing consumer code. Dates are the commit date of the release.

## [1.7.0] — Unreleased

- **Add `tanner-cleanup` skill + a shared pre-commit hook** — a light pass over just the changed
  content: run the repo's own linters on the changed files, then flag typos in newly-added comments
  and copy for review (never auto-fixing, always asking first). `sync` now distributes hooks too —
  it copies `hooks/*.mjs` into a consumer's `.claude/hooks/` and idempotently registers the
  pre-commit gate in `.claude/settings.json`. The gate is Claude Code-specific; every other agent
  still gets the skill through the AGENTS.md index. `git commit --no-verify` skips it.
- **Add `tanner-quality-bar` skill** — a shared reference leaf holding the severity ladder and
  the Performance, Accessibility, Design, and Content dimensions. `tanner-code-review` and
  `tanner-website-review` now chain to it instead of each repeating the same a11y/design bullets.
- **Add effort tiers to both review skills** — code-review scales trivial / standard / full to
  the diff; website-review scales spot-check / standard / full-audit to the scope. Anything a
  higher tier would catch but you skip is reported unverified, not passed.
- **Resolve `[[wikilinks]]` on sync** — `sync` rewrites skill cross-references to a real
  per-target path (`.claude/skills/…/SKILL.md` for Claude, `.cursor/rules/….mdc` for Cursor) so
  non-Claude agents get a followable pointer instead of literal brackets.
- **Add the Code organization convention** to `AGENTS.base.md` — one constant per file, one
  helper per file, in a shared `utils`/`helpers` folder named after its export — with a matching
  check in `tanner-code-review`.
- **Add this changelog**, a maintainer-only `changelog` skill, and a PostToolUse hook that
  auto-reminds to update it whenever `package.json`'s version is bumped (all maintainer-only,
  never distributed to consumers).

## [1.6.0] — 2026-07-08

- **Add `tanner-website-review` skill** — audit a live, deployed site across three device tiers
  as a cold visitor, including the GEO / agent-parseability test that measures the gap between
  what a human sees and what an AI agent reads from the raw HTML.

## [1.5.0] — 2026-07-06

- **`sync` fans skills out to each agent's native home** — `.claude/skills/` for Claude Code,
  `.cursor/rules/*.mdc` for Cursor, and a `## Skills` index injected into `AGENTS.md` for Codex,
  Copilot, Gemini, and any other agent that only reads `AGENTS.md`.
- Dogfood the package's own `AGENTS.md`, `CLAUDE.md`, and skill definitions in this repo.

## [1.4.0] — 2026-07-04

- **Add `tanner-create-pr` skill** — the title format, body structure (business-goal summary,
  detail paragraph, `## Test Plan`, testable paths), and pre-flight checks for opening a PR.
- Screenshots for visual changes are saved to a user folder outside the repo, never embedded in
  the PR body or committed.

## [1.3.0] — 2026-07-03

- Restructure the `tanner-code-review` report format (summary, merge verdict, what's good,
  findings table, evidence).
- Add the `update` CLI command — `npm update` the package, then `sync`, in one step.

## [1.2.0] — 2026-07-03

- **Add `tanner-code-review` skill** — a five-dimension front-end review procedure
  (performance, design, content, accessibility, code) driven against a real browser.

## [1.1.0] — 2026-07-02

- Expand `tanner-brand-voice` with the full voice and tone guidance — instinct-paired-with-a-real-quote
  rules and the "don't sound like an AI" list.
- Docs: clarify the `github:` prefix for standalone `npx` invocation.

## [1.0.0] — 2026-07-02

- Initial release — agent-agnostic `AGENTS.md` shared rules, the `tanner-brand-voice` skill, and
  the zero-dependency `sync` / `init` / `check` CLI.

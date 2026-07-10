# tanner-agent-standards

[![skills.sh](https://skills.sh/b/tannergodarzi/tanner-agent-standards)](https://skills.sh/tannergodarzi/tanner-agent-standards)

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
skills/tanner-quality-bar/         the shared UI quality bar (severity + perf · a11y · design · content)
skills/tanner-code-review/         how Tanner reviews front-end changes (quality bar + memory/bundle · code)
skills/tanner-create-pr/           how Tanner opens a PR (title format · body structure · Test Plan)
skills/tanner-website-review/      how Tanner audits a live site (quality bar + cache · l10n · GEO)
skills/tanner-cleanup/             light pre-push pass — lint changed files · flag typos in new copy
hooks/pre-push-cleanup.mjs         shared Claude Code hook that runs tanner-cleanup before a push
bin/sync.mjs                       the sync / init / check CLI (zero dependencies)
```

`sync` fans the skills out to each agent's native home in the consumer repo — `.claude/skills/`
(Claude), `.cursor/rules/*.mdc` (Cursor), and a `## Skills` index inside `AGENTS.md` for
Codex / Copilot / Gemini and any other agent that only reads `AGENTS.md`. Repositories that opt
in to Eve also get self-contained runtime skills in their configured `agent/skills` directory.

It also distributes any hooks under `hooks/`: each is copied into the consumer's `.claude/hooks/`
and registered in `.claude/settings.json` (additive and idempotent — your other settings are left
untouched). Hooks are Claude Code-specific, so they layer an automatic trigger on top of the skill
every agent already sees. This is distinct from the maintainer-only `.claude/hooks/changelog-check.mjs`,
which lives under this package's own `.claude/` and is never distributed.

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

Or do the update-and-sync in one step — `update` runs `npm update` then `sync` for you:

```bash
npx tanner-agent-standards update      # npm update + sync, in one command
```

Prefer a repo-local shortcut? Add a script to that repo's `package.json`:

```json
{ "scripts": { "sync:standards": "npm update tanner-agent-standards && npx tanner-agent-standards sync" } }
```

then run `npm run sync:standards`.

(The bare `npx` above works because the package is already installed in the repo. In a repo
that hasn't installed it yet, use `npx github:tannergodarzi/tanner-agent-standards sync`.)

`npm outdated` across your repos shows which are behind. To fail CI or a pre-push hook
on drift:

```bash
npx tanner-agent-standards check       # exit 1 if AGENTS.md or configured Eve output has drifted
```

Pin to a major so `npm update` only pulls compatible releases:

```bash
npm i -D "github:tannergodarzi/tanner-agent-standards#semver:^1"
```

## Generate Eve runtime skills

Eve needs one self-contained runtime skill, not a trail of files it has to discover mid-run. Add
an explicit target to the consuming repo's `package.json`:

```json
{
  "tannerAgentStandards": {
    "eve": {
      "directory": "agent/skills",
      "skills": {
        "tanner-website-review": {
          "bundle": [
            "tanner-quality-bar",
            "tanner-brand-voice"
          ]
        }
      }
    }
  }
}
```

Then run the same command every other target already uses:

```bash
npx tanner-agent-standards sync
# • Claude  → .claude/skills
# • Cursor  → .cursor/rules
# • Eve     → agent/skills/tanner-website-review
```

The output at `agent/skills/tanner-website-review/SKILL.md` keeps the canonical skill's YAML
frontmatter so Eve can discover it, adds a generated-file warning, and appends each configured
dependency in the exact order listed. Bundled `[[skill-name]]` references become local Markdown
anchors; contextual references that aren't bundled become readable skill names. Bundling is
deliberately explicit — a mention of `tanner-code-review`, for example, doesn't make it a runtime
dependency by accident.

The directory must stay inside the consumer repository. Absolute paths and `..` traversal fail
with an actionable error, as do missing skills or dependencies. `sync` removes stale Eve
`SKILL.md` files only when they carry this package's generated marker; it never deletes a
user-authored skill. `check` compares every configured Eve file byte-for-byte, so a local edit or
stale generated skill fails CI instead of quietly drifting.

Existing consumers don't need to do anything. Without `tannerAgentStandards.eve`, `sync`, `check`,
`update`, and `init` behave as they did before, and `init` never invents Eve configuration. To
migrate a manually maintained runtime skill:

1. Add the Eve configuration above to `package.json`.
2. Run `npm update tanner-agent-standards` and commit the resulting `package-lock.json` change.
3. Run `npx tanner-agent-standards sync`; the generated file replaces the manual copy at the
   configured path.
4. Keep Eve's instructions loading only the requested root skill. Its configured runtime
   dependencies are already bundled into that file.
5. Run `npx tanner-agent-standards check` and the consumer's own typecheck/build commands before
   committing the generated output.

## Or grab just the skills, via skills.sh

Everything above installs the whole package — shared `AGENTS.md` rules, skills, and hooks,
synced and drift-checked. If you only want the skills — and in any of the 70+ agents the
[skills.sh](https://skills.sh) ecosystem reaches, not just Claude and Cursor — pull them
straight from this repo:

```bash
npx skills add tannergodarzi/tanner-agent-standards
```

That clones the repo, lists every skill, and drops the ones you pick into that agent's
native skills folder. Want one? Add `--skill tanner-code-review`. Want the lot, everywhere?
`--all`. The maintainer-only `changelog` skill is flagged internal, so it never shows up in
the list.

No submit step, no npm publish — skills.sh indexes the public repo directly, so a fresh
release is live the moment it lands on `main`.

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

- **Per-repo (default, agent-agnostic):** `sync` fans it out to every agent's native home —
  `.claude/skills/<name>/SKILL.md` (Claude Code auto-loads it), `.cursor/rules/<name>.mdc`
  (Cursor auto-attaches it as an agent-requested rule), and a `## Skills` index in `AGENTS.md`
  so Codex / Copilot / Gemini — which have no skills folder — find it by reading the one file
  they all read.
- **Once, globally (Claude-only convenience):** symlink it as a personal skill so it applies in
  every project without a per-repo copy —
  `ln -s "$PWD/skills/tanner-brand-voice" ~/.claude/skills/tanner-brand-voice`.

## The quality-bar skill

`skills/tanner-quality-bar/SKILL.md` is the shared definition of what a good *rendered page*
looks like — the **Blocker / Warning / Nit** severity ladder plus four dimensions: **performance**
(no layout shift, loading states, lean images), **accessibility** (latest WCAG, a
`prefers-reduced-motion` killswitch, mobile tap targets and font size), **design** (no
regressions, the layout holds at every breakpoint, a clear type scale, brand tokens), and
**content** (no typos, copy routed through the [brand-voice skill](#the-brand-voice-skill)).

It's a **reference leaf** — no run procedure, no report format of its own. Both review skills
below chain to it (`[[tanner-quality-bar]]`) so the bar is defined once and can't drift between
them; each then adds the dimensions unique to its job. This is the node that makes the skill
graph do real work instead of repeating the same a11y and design bullets in two files.

## The code-review skill

`skills/tanner-code-review/SKILL.md` is how Tanner reviews front-end work before it ships —
a diff, a PR, or your own branch. It's a review procedure, not a checklist: get the diff, map
each touched component to the routes that render it, grep the touched files for every `@media`
breakpoint, then **spin up a headless browser** and load the pages against the running build.
It **scales the effort to the change** (trivial / standard / full) so a one-line copy tweak
doesn't trigger the same ceremony as a new layout system. It judges every page against the
[quality-bar skill](#the-quality-bar-skill) first, then adds the diff-specific checks —
**memory leaks** (effect cleanup), **load cost** (bundle size, needless client components,
client-vs-server fetch), and **visual regressions measured against the production baseline** —
plus a **code** dimension (matching existing naming and conventions). Findings come back
labelled **Blocker / Warning / Nit** with a one-line ship / ship-after-warnings / blocked
verdict.

Distributed the same way as brand-voice — fanned out to `.claude/skills/`, `.cursor/rules/`,
and the `## Skills` index in `AGENTS.md` — so any agent can read it and Claude Code auto-loads
it as a skill and can drive the headless browser for the visual and accessibility passes. If a
browser can't be brought up, those dimensions are reported as unverified rather than passed.

## The create-PR skill

`skills/tanner-create-pr/SKILL.md` is how Tanner wants a pull request written — it fires
whenever a PR is being created, including when an agent harness like Conductor invokes its
create-PR step (Claude Code auto-loads it when the task matches its description; any other
agent can read the file directly). It sets the **title format** —
`[project_name][Surface Area] Concise Title Case Title Of What This PR Accomplishes` — and the **body
structure**: a 2–3 sentence summary framed around the business goal, a fuller detail
paragraph, **screenshots captured from a headless Chrome instance** for any visual change, a
`## Test Plan` section documenting validation / lint / bug testing, and the testable route(s)
a reviewer can open (e.g. `/home`). Before the PR opens it also gates on the repo's own checks
(lint / build / test, whichever exist) passing and a clean diff. All prose routes through the
[brand-voice skill](#the-brand-voice-skill).

Distributed the same way as the others — fanned out to `.claude/skills/`, `.cursor/rules/`, and
the `## Skills` index in `AGENTS.md` — so any agent can read it and Claude Code auto-loads it as
a skill.

## The website-review skill

`skills/tanner-website-review/SKILL.md` is how Tanner audits a **live, deployed site** — a
production URL, a preview deploy, or a competitor's page — as opposed to the
[code-review skill](#the-code-review-skill), which reviews a *diff* before it merges. It drives a
real browser at three device tiers (**mobile 390px, laptop/MacBook 1440px, desktop 1920px+**),
screenshots each, and reviews the page the way a **first-time visitor who might be here to sign
up or buy** would — understanding the page from the screenshot *before* judging it. It **scales
the effort to the scope** (spot check / standard / full audit), judges the page against the
[quality-bar skill](#the-quality-bar-skill) first, then adds the live-site checks: **performance**
extras (third-party scripts, assets cached and reported as a CDN hit, minified/compressed/streamed
source), an **accessibility** pass in both themes with a screen reader, **design** extras
(light/dark parity, performant animation, descriptive UI assets), **localization** (every locale
actually translated — no `lorem ipsum` or mistranslation), and a **first-impression** test
(hero-as-billboard, CTA clarity). Then it runs the part Tanner cares about most: a **GEO /
agent-parseability test** that measures the gap between what a human sees and what an AI agent
gets from the raw HTML (spoofing a bot User-Agent, checking for `llms.txt`, a markdown twin, and
JSON-LD). Findings come back labelled **Blocker / Warning / Nit** with a first-impression verdict
and an Agent/GEO delta section up top.

Distributed the same way as the others — fanned out to `.claude/skills/`, `.cursor/rules/`, and
the `## Skills` index in `AGENTS.md` — so any agent can read it and Claude Code auto-loads it as
a skill and can drive the browser for the visual, performance, accessibility, and GEO passes. If
a browser can't be brought up, those dimensions are reported as unverified rather than passed.

## Claude-only shortcut (optional)

If a repo is *only* ever read by Claude Code, you can skip `sync` entirely and import the
installed file by reference — then `npm update` alone keeps it current:

```markdown
See @node_modules/tanner-agent-standards/AGENTS.base.md
```

Other agents would see only that line, not the expanded rules — which is why `sync` (real
text) is the default.

## Releasing a change

1. Edit `AGENTS.base.md`, `skills/`, `templates/`, or the sync CLI.
2. Bump `version` in `package.json` (semver: patch = wording, minor = new rule, major = a
   rule that could break existing code).
3. Add a matching section to `CHANGELOG.md`. The version bump is the trigger — a PostToolUse
   hook reminds you automatically the moment `package.json`'s version has no changelog section.
4. `npm test`, then `git commit && git tag vX.Y.Z && git push --tags` — and swap `Unreleased`
   for the date.
5. In each consumer: `npm update tanner-agent-standards && npx tanner-agent-standards sync`.

**Maintainer-only tooling.** `.claude/skills/changelog/` (a project skill), `.claude/hooks/changelog-check.mjs`
(a read-only detector), and the hook wiring in `.claude/settings.json` keep `CHANGELOG.md` in
step with `package.json` — the hook fires after any edit and nudges you until the current
version has an entry. All of it lives under `.claude/`, **not** `skills/`, on purpose: `sync`
only fans out `skills/` and `package.json`'s `files` only ships `skills/`, so none of it is
distributed to consumers or listed in their `AGENTS.md`. Leave it where it is — don't move it
into `skills/`, and don't delete it as if it were generated output.

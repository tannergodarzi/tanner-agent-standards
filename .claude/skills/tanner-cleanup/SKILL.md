---
name: tanner-cleanup
description: A light pre-commit pass over just the changed content — run the repo's own linters on the changed files, then read newly-added comments and copy for typos and surface them for review, never auto-fixing. Use right before a commit, or whenever asked to lint, typo-check, or clean up a working change or staged diff before it ships.
---

# Tanner Cleanup

A light pass over *what you changed* — nothing else. Two jobs: run the repo's own linters against
the changed files, and read the prose you just added — code comments, strings, docs — for typos.
It **flags, it doesn't fix**: linters run and report; typos come back as a review list you approve
before a single character changes.

> Plain markdown — any agent can read this file directly; Claude Code additionally auto-loads it
> as a skill. It pairs with the shared pre-commit hook, which fires it before `git commit`.

**Scope is the changed content, full stop.** Don't lint the whole tree, don't spell-check files you
didn't touch, don't reformat. The diff is the job — keep it fast.

## How to run

1. **Find what changed.** Prefer the staged set — `git diff --cached --name-only` — since that's
   what's about to commit. If nothing is staged, fall back to the working set
   (`git diff --name-only`). That file list is your entire surface.
2. **Run every linter the repo actually has, scoped to those files.** Detect, don't assume:
   - A `lint` script in `package.json` (`npm run lint`), plus any `typecheck` / `format:check`.
   - Config that implies a tool — `.eslintrc*` / `eslint.config.*` (ESLint), `.prettierrc*`
     (Prettier `--check`), `ruff.toml` / `pyproject.toml` (Ruff), `.rubocop.yml`, `.golangci.yml`.
   Point the tool at the changed files where it takes paths; if it only runs whole-repo, run it
   whole-repo but report only the problems that land in changed files. Report failures as-is —
   **never `--fix` / `--write`.** Surfacing is the job. No linters? Say so in one line, move on.
3. **Read the new prose for typos.** From the diff, look only at **added lines** (the `+` side) and
   only at human-readable text: code comments, user-facing strings, and prose in `.md` / docs.
   Ignore identifiers, keywords, imports, URLs, and paths — a variable named `recieveBuffer` is a
   naming issue for the linter, not a typo to flag here. Judge in context; a real word used oddly
   isn't a typo.
   - **Never surface a secret.** If an added line carries a credential — an API key, token,
     password, connection string, or `.env`-style value — skip it: don't hunt for typos inside it
     and never quote it. The typo pass is not a reason to echo a secret into the report; redact any
     such value to `[redacted]` in anything you show.
4. **Flag, then ask.** Present typos as a review table and stop. Do **not** edit anything until the
   user chooses. Apply only the rows they approve, only to the exact text shown.

If a fix touches user-facing copy, route the rewrite through `tanner-brand-voice` (`.claude/skills/tanner-brand-voice/SKILL.md`).

## Report format

Linters first, then typos, then the ask.

1. **Lint.** One line per tool — `eslint — 2 problems in 1 changed file` or `clean` — then the
   actual messages for anything that failed. `no linters detected` if there are none.
2. **Typos.** A table; if there are none, say so:

   | File : Line | Found | Suggested | In context |
   |-------------|-------|-----------|------------|
   | `hero.tsx:42` | `recieve` | `receive` | `// recieve the payload` |
   | `README.md:8` | `teh` | `the` | `run teh sync command` |

   One row per suspected typo, with just enough surrounding text to judge the call — trim the
   quote to the words around the typo, and redact anything that looks like a secret to
   `[redacted]`. Never widen the context to pull in a credential.
3. **The ask.** "Apply which — all, none, or a list?" Name exactly which files and lines each
   choice changes, so the user sees the blast radius before saying yes. Nothing changes until they
   answer; then edit only the approved rows.

## Signalling the pre-commit hook

If the shared pre-commit hook is what invoked you, it gates the commit until cleanup has run for the
current staged tree. Once linters are clean (or their problems are noted) and typos are reviewed,
fingerprint the staged tree so the same commit isn't gated twice:

```
git write-tree > "$(git rev-parse --git-dir)/tanner-cleanup.ok"
```

Change the staged files afterward and the fingerprint no longer matches, so the next commit re-runs
cleanup — exactly as it should.

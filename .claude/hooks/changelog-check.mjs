#!/usr/bin/env node
// PostToolUse hook for the tanner-agent-standards repo (maintainer-only, never published).
//
// The dependency is the version bump: whenever `package.json`'s version does not yet have a
// matching section at the top of `CHANGELOG.md`, this nudges the model to write the entry — via
// the `changelog` skill — before the work is called done. It goes quiet the moment a
// `## [<version>]` section exists, so a normal edit never triggers it once the changelog is current.
//
// Read-only by design: it never edits files, so it can't corrupt an edit in flight. On any
// error (missing files, bad JSON) it exits 0 silently — a broken hook must not block editing.

import { readFileSync } from "node:fs";
import { join } from "node:path";

// Drain stdin so the harness writer never sees a broken pipe; we don't need the payload.
try {
  readFileSync(0, "utf8");
} catch {}

const exitQuiet = () => process.exit(0);

try {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

  // Only ever speak up in this package — the hook is project-local, but be defensive.
  if (pkg.name !== "tanner-agent-standards" || !pkg.version) exitQuiet();

  const version = pkg.version;
  const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");

  // Match a heading for this version in any common form: `## [1.7.0]`, `## 1.7.0`, `## v1.7.0`.
  const esc = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hasSection = new RegExp(`^##\\s+v?\\[?${esc}\\]?`, "m").test(changelog);
  if (hasSection) exitQuiet();

  const context =
    `CHANGELOG.md has no section for the current package.json version (v${version}). ` +
    `The changelog's trigger is the version bump — add a \`## [${version}] — Unreleased\` ` +
    `section at the top of CHANGELOG.md with one concise bullet per consumer-facing change in ` +
    `this work, following the \`changelog\` skill (.claude/skills/changelog/SKILL.md). Do this ` +
    `now, before finishing or opening a PR.`;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: context,
      },
    }),
  );
  process.exit(0);
} catch {
  exitQuiet();
}

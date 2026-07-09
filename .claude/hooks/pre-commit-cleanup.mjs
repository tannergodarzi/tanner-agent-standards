#!/usr/bin/env node
// Shared PreToolUse hook — gates `git commit` on the tanner-cleanup pass.
//
// Distributed to consumers by `tanner-agent-standards sync`, which copies this script into
// `.claude/hooks/` and wires it into `.claude/settings.json`. Before a commit runs, it asks the
// agent to run the `tanner-cleanup` skill on the staged changes — lint the changed files, flag
// typos in newly-added comments and copy. The skill records completion by fingerprinting the
// staged tree into `<git-dir>/tanner-cleanup.ok`; once that fingerprint matches the current
// staged tree the commit is allowed through, so the gate fires once per distinct staged set
// rather than looping. `git commit --no-verify` is the deliberate escape hatch.
//
// Defensive by design: any error, or a command that isn't a real commit, exits 0 (allow) — a
// broken hook must never be able to block committing.

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {}

const allow = () => process.exit(0);

// A command that actually creates a commit — not `git log`, `git commit --help`, or an explicit
// `--no-verify` / `-n` skip (which we honour as the user opting out of the gate).
function isGitCommit(cmd) {
  if (!/\bgit\b/.test(cmd) || !/\bcommit\b/.test(cmd)) return false;
  if (/--no-verify\b|(^|\s)-[a-z]*n\b/.test(cmd)) return false;
  if (/--help\b|(^|\s)-h\b/.test(cmd)) return false;
  return true;
}

try {
  const payload = raw ? JSON.parse(raw) : {};
  const cmd = payload?.tool_input?.command ?? "";
  if (!isGitCommit(cmd)) allow();

  const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  const gitDir = git(["rev-parse", "--git-dir"]);
  const staged = git(["write-tree"]);

  let done = "";
  try {
    done = readFileSync(`${gitDir}/tanner-cleanup.ok`, "utf8").trim();
  } catch {}
  if (done && done === staged) allow(); // cleanup already ran for exactly this staged tree

  const reason =
    "Run the tanner-cleanup skill on the staged changes before committing: lint the changed " +
    "files and flag any typos in newly-added comments or copy for review " +
    "(.claude/skills/tanner-cleanup/SKILL.md). When it's clean, it records completion with " +
    '`git write-tree > "$(git rev-parse --git-dir)/tanner-cleanup.ok"` and this commit will ' +
    "proceed. To skip the check intentionally, commit with --no-verify.";

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
} catch {
  allow();
}

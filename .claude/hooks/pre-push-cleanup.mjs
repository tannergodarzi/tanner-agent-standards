#!/usr/bin/env node
// Shared PreToolUse hook — gates `git push` on the tanner-cleanup pass.
//
// Distributed to consumers by `tanner-agent-standards sync`, which copies this script into
// `.claude/hooks/` and wires it into `.claude/settings.json`. Local commits stay unblocked; the
// gate fires once, before a branch leaves the machine. It asks the agent to run the
// `tanner-cleanup` skill on the unpushed changes — lint the changed files, flag typos in
// newly-added comments and copy. The skill records completion by fingerprinting the tree it
// reviewed into `<git-dir>/tanner-cleanup.ok`; once that fingerprint matches HEAD's tree the push
// is allowed through, so the gate fires once per distinct pushed state rather than looping.
// `git push --no-verify` is the deliberate escape hatch.
//
// Defensive by design: any error, or a command that isn't a real push, exits 0 (allow) — a
// broken hook must never be able to block pushing.

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {}

const allow = () => process.exit(0);

// A command that actually pushes. Match `git push` as adjacent tokens (allowing global options
// like `git -c x=y push`), not the words "git" and "push" anywhere — otherwise a path or string
// that merely mentions either (e.g. `cat pre-push-cleanup.mjs`) would false-trigger the gate.
// A `--dry-run`, `--help`, or explicit `--no-verify` push is not a real push we need to gate.
function isGitPush(cmd) {
  if (!/\bgit\b(\s+-{1,2}\S+)*\s+push\b/.test(cmd)) return false;
  if (/--no-verify\b|--dry-run\b|--help\b|(^|\s)-h\b/.test(cmd)) return false;
  return true;
}

try {
  const payload = raw ? JSON.parse(raw) : {};
  const cmd = payload?.tool_input?.command ?? "";
  if (!isGitPush(cmd)) allow();

  const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  const gitDir = git(["rev-parse", "--git-dir"]);
  const head = git(["rev-parse", "HEAD^{tree}"]); // the content state about to be pushed

  let done = "";
  try {
    done = readFileSync(`${gitDir}/tanner-cleanup.ok`, "utf8").trim();
  } catch {}
  if (done && done === head) allow(); // cleanup already ran for exactly this tree

  const reason =
    "Run the tanner-cleanup skill on the unpushed changes before pushing: lint the changed " +
    "files and flag any typos in newly-added comments or copy for review " +
    "(.claude/skills/tanner-cleanup/SKILL.md). When it's clean, it records completion with " +
    '`git rev-parse "HEAD^{tree}" > "$(git rev-parse --git-dir)/tanner-cleanup.ok"` and this push ' +
    "will proceed. To skip the check intentionally, push with --no-verify.";

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

#!/usr/bin/env node
// tanner-agent-standards — sync shared, agent-agnostic conventions into a repo.
//
// Zero dependencies (Node built-ins only). It writes AGENTS.md — the open, tool-neutral
// standard read by Claude Code, Cursor, Codex, Copilot, Gemini, etc. — as real text, so
// every agent sees the same rules. The shared rules live between markers; everything else
// in the file (your app description, project-specific rules) is never touched.
//
// Usage, run from a consumer repo root:
//   npx tanner-agent-standards sync     inject/refresh the managed block + skills (idempotent)
//   npx tanner-agent-standards update   npm update this package, then sync (one step)
//   npx tanner-agent-standards init     same as sync, with brand-new-repo onboarding output
//   npx tanner-agent-standards check    exit non-zero if the repo is out of date (CI / pre-commit)

import {
  readFileSync,
  writeFileSync,
  existsSync,
  cpSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = process.cwd();

const BEGIN = "<!-- BEGIN:tanner-agent-standards -->";
const END = "<!-- END:tanner-agent-standards -->";

const read = (p) => readFileSync(p, "utf8");
const VERSION = JSON.parse(read(join(PKG_ROOT, "package.json"))).version;

// Split a SKILL.md into its YAML frontmatter fields and its markdown body.
function parseSkill(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { description: "", body: raw.trim() };
  const fm = m[1];
  const field = (k) => (fm.match(new RegExp(`^${k}:\\s*(.+)$`, "m")) || [])[1]?.trim() || "";
  return { description: field("description"), body: m[2].trim() };
}

// Every skill in the package, keyed by its directory name (the canonical slug).
function skillsList() {
  const src = join(PKG_ROOT, "skills");
  if (!existsSync(src)) return [];
  return readdirSync(src, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .map((name) => {
      const file = join(src, name, "SKILL.md");
      if (!existsSync(file)) return null;
      const { description, body } = parseSkill(read(file));
      return { name, description, body };
    })
    .filter(Boolean);
}

// A discoverable index of the synced skills, injected into AGENTS.md so agents that
// have no native skills folder — OpenAI Codex, Copilot, Gemini — still find them by
// reading the one file they all read. Generated from the skills' own frontmatter, so
// `check` stays deterministic.
function skillsSection(skills) {
  if (!skills.length) return "";
  const items = skills.map(
    (s) =>
      `- **${s.name}** — ${s.description}\n` +
      `  Read: \`.claude/skills/${s.name}/SKILL.md\` · Cursor: \`.cursor/rules/${s.name}.mdc\``,
  );
  return [
    "## Skills",
    "",
    "Deep-dive references synced into this repo. Claude Code auto-loads them from",
    "`.claude/skills/`; Cursor auto-attaches them from `.cursor/rules/`; Codex and other",
    "AGENTS.md-based agents should open the referenced file when a task matches its description.",
    "",
    ...items,
  ].join("\n");
}

function managedBlock() {
  const base = read(join(PKG_ROOT, "AGENTS.base.md")).trim();
  const stamp = `<!-- v${VERSION} · managed block — do not edit here; run \`npx tanner-agent-standards sync\` -->`;
  const skills = skillsSection(skillsList());
  const body = skills ? `${base}\n\n${skills}` : base;
  return `${BEGIN}\n${stamp}\n\n${body}\n${END}`;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const blockRe = () =>
  new RegExp(`${escapeRe(BEGIN)}[\\s\\S]*?${escapeRe(END)}`);

// Replace the managed block if markers exist; otherwise insert it after the first H1
// (or prepend if there is no H1), leaving all other content untouched.
function inject(content, block) {
  if (blockRe().test(content)) return content.replace(blockRe(), block);
  const lines = content.split("\n");
  const h1 = lines.findIndex((l) => /^#\s/.test(l));
  if (h1 === -1) return `${block}\n\n${content}`;
  let i = h1 + 1;
  while (i < lines.length && lines[i].trim() === "") i++; // skip blank lines after the H1
  if (i < lines.length && !/^#{1,6}\s/.test(lines[i])) {  // an intro paragraph (not a heading)?
    while (i < lines.length && lines[i].trim() !== "") i++; // keep it above the block
  }
  lines.splice(i, 0, "", block);
  return lines.join("\n");
}

function ensureAgents() {
  const p = join(TARGET, "AGENTS.md");
  const before = existsSync(p) ? read(p) : read(join(PKG_ROOT, "templates", "AGENTS.md"));
  const created = !existsSync(p);
  let next = inject(before, managedBlock());
  if (!next.endsWith("\n")) next += "\n";
  writeFileSync(p, next);
  return { created, changed: created || next !== before };
}

function ensureClaude() {
  const p = join(TARGET, "CLAUDE.md");
  if (existsSync(p)) return { created: false };
  writeFileSync(p, "See @AGENTS.md\n"); // Claude reads AGENTS.md; other agents already do
  return { created: true };
}

// Fan every skill out to each agent's native home. The content is identical markdown;
// each adapter reshapes only the wrapper to that tool's convention.
//  • Claude Code — .claude/skills/<name>/SKILL.md, copied verbatim (preserves any
//    supporting files in the skill dir); auto-discovered as a native skill.
//  • Cursor — .cursor/rules/<name>.mdc: frontmatter (description) + body, written as an
//    "agent-requested" rule Cursor pulls in when the description matches the task.
//  • OpenAI Codex / Copilot / Gemini — no skills dir; they read the `## Skills` index
//    that managedBlock() injects into AGENTS.md, which points them at the files above.
function syncSkills() {
  const skills = skillsList();
  if (!skills.length) return [];

  // Claude: verbatim tree copy.
  const claudeDst = join(TARGET, ".claude", "skills");
  mkdirSync(claudeDst, { recursive: true });
  cpSync(join(PKG_ROOT, "skills"), claudeDst, { recursive: true });

  // Cursor: one .mdc rule per skill.
  const cursorDst = join(TARGET, ".cursor", "rules");
  mkdirSync(cursorDst, { recursive: true });
  for (const s of skills) {
    const mdc = `---\ndescription: ${s.description}\nalwaysApply: false\n---\n\n${s.body}\n`;
    writeFileSync(join(cursorDst, `${s.name}.mdc`), mdc);
  }

  return skills.map((s) => s.name);
}

function check() {
  const p = join(TARGET, "AGENTS.md");
  const fail = (msg) => {
    console.error(`✗ ${msg}`);
    process.exit(1);
  };
  if (!existsSync(p)) fail("AGENTS.md missing — run `npx tanner-agent-standards sync`");
  const m = read(p).match(blockRe());
  if (!m) fail("managed block missing — run `npx tanner-agent-standards sync`");
  if (m[0].trim() !== managedBlock().trim())
    fail(`tanner-agent-standards drift — AGENTS.md is behind v${VERSION}. Run \`npx tanner-agent-standards sync\`.`);
  console.log(`✓ tanner-agent-standards v${VERSION} in sync`);
}

// npm update this package in the consumer, then run sync from the freshly-installed
// version. Re-execs so `sync` runs the just-pulled code, not this (now-stale) process.
function update() {
  const pkg = "tanner-agent-standards";
  console.log(`Updating ${pkg} in ${TARGET}…`);
  const up = spawnSync("npm", ["update", pkg], { stdio: "inherit", cwd: TARGET });
  if (up.status !== 0) {
    console.error("✗ npm update failed — skipping sync. Fix the install and retry.");
    process.exit(up.status || 1);
  }
  const sync = spawnSync("npx", ["--no-install", pkg, "sync"], {
    stdio: "inherit",
    cwd: TARGET,
  });
  process.exit(sync.status ?? 0);
}

const cmd = process.argv[2] || "sync";

if (cmd === "--version" || cmd === "-v") {
  console.log(VERSION);
} else if (cmd === "check") {
  check();
} else if (cmd === "update") {
  update();
} else if (cmd === "sync" || cmd === "init") {
  const a = ensureAgents();
  const c = ensureClaude();
  const skills = syncSkills();
  console.log(`tanner-agent-standards v${VERSION} → ${TARGET}`);
  console.log(`  • AGENTS.md  ${a.created ? "created" : a.changed ? "updated" : "already current"}`);
  console.log(`  • CLAUDE.md  ${c.created ? "created" : "kept"}`);
  console.log(`  • skills     ${skills.length ? `${skills.join(", ")} → .claude/skills, .cursor/rules` : "none"}`);
  if (a.created || cmd === "init") {
    console.log("\nNext: replace the app-description comment near the top of AGENTS.md, then commit.");
  }
} else {
  console.log("Usage: tanner-agent-standards <sync|update|init|check>");
  process.exit(1);
}

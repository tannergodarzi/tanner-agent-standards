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

function managedBlock() {
  const base = read(join(PKG_ROOT, "AGENTS.base.md")).trim();
  const stamp = `<!-- v${VERSION} · managed block — do not edit here; run \`npx tanner-agent-standards sync\` -->`;
  return `${BEGIN}\n${stamp}\n\n${base}\n${END}`;
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

function copySkills() {
  const src = join(PKG_ROOT, "skills");
  if (!existsSync(src)) return [];
  const dst = join(TARGET, ".claude", "skills");
  mkdirSync(dst, { recursive: true });
  cpSync(src, dst, { recursive: true });
  return readdirSync(src, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
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
  const skills = copySkills();
  console.log(`tanner-agent-standards v${VERSION} → ${TARGET}`);
  console.log(`  • AGENTS.md  ${a.created ? "created" : a.changed ? "updated" : "already current"}`);
  console.log(`  • CLAUDE.md  ${c.created ? "created" : "kept"}`);
  console.log(`  • skills     ${skills.length ? skills.join(", ") : "none"}`);
  if (a.created || cmd === "init") {
    console.log("\nNext: replace the app-description comment near the top of AGENTS.md, then commit.");
  }
} else {
  console.log("Usage: tanner-agent-standards <sync|update|init|check>");
  process.exit(1);
}

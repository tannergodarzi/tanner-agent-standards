---
name: tanner-brand-voice
description: Tanner's brand voice and grammatical conventions for site copy. Use when writing or editing user-facing content — metadata titles, page titles, H1 headings, and other display text.
---

# Tanner Brand Voice

Grammatical and stylistic conventions for user-facing copy across Tanner's sites and
projects. Apply these whenever writing or editing display text.

> Plain markdown — any agent can read this file directly; Claude Code additionally
> auto-loads it as a skill.

## Conventions

### No periods in titles and headings
Do **not** end metadata titles, page-level titles, or H1 headings with a period. This
applies to:

- `metadata.title`, `openGraph.title`, and `twitter.title` in Next.js metadata
- Page-level titles and any top-level `<h1>` heading text

Periods are fine in descriptions, body copy, and full sentences — this rule is specific
to titles and headings.

**Examples:**

- ✅ `title: "Hello, I'm Tanner — A Real Person on the Internet"`
- ❌ `title: "Hello, I'm Tanner — A Real Person on the Internet."`

### Capitalize "Front-End"
Always write **Front-End** — hyphenated, both words capitalized — in resume, about, and
layout copy. Never "front-end", "frontend", or "Front-end".

**Examples:**

- ✅ `Front-End Engineer`
- ❌ `Frontend Engineer` / `front-end engineer`

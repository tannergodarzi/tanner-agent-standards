---
name: tanner-quality-bar
description: The shared bar for what "good" means on any rendered page — the severity ladder plus the Performance, Accessibility, Design, and Content dimensions that both a diff review and a live-site audit judge against. The common core that tanner-code-review and tanner-website-review chain to; read it directly when judging UI quality, or when either review skill points you here.
---

# Tanner Quality Bar

The shared definition of what a good rendered page looks like — independent of how you got
here. Whether you're reviewing a *diff* before it merges (`tanner-code-review` (`.claude/skills/tanner-code-review/SKILL.md`)) or auditing
a *live URL* as a cold visitor (`tanner-website-review` (`.claude/skills/tanner-website-review/SKILL.md`)), you judge the page against the same
four dimensions and the same severity ladder. Both of those skills chain to this one so the bar
is defined in a single place and never drifts between them.

> Plain markdown — any agent can read this file directly; Claude Code additionally auto-loads
> it as a skill. This is a reference leaf: it holds the shared *bar*, not a run procedure or a
> report format. The skill that sent you here owns those.

**These four dimensions are the floor, not the whole review.** The skill that pulled you in
adds its own dimensions on top — code conventions and memory/bundle cost for a diff, caching,
localization, and the agent/GEO test for a live site. Judge against this bar first, then walk
those.

## Severity — label every finding

- **Blocker** — ships broken or misleads real users: a visual regression, layout shift, a
  broken layout at a real breakpoint, an accessibility failure that locks someone out, a typo
  in shipped display copy.
- **Warning** — should fix, won't strictly break the page: an a11y gap short of a hard failure,
  a marginal tap target, an unoptimized-but-working asset. **Accessibility gaps are always at
  least a Warning — never silent.**
- **Nit** — taste and consistency: a one-off type size, a cleaner pattern, a redundant style.

The skill that sent you here may add its own domain-specific Blockers (a memory leak for a diff,
a CTA that's invisible to agents for a live page) — those stack on top of this ladder.

## Performance

- **No layout shift.** Nothing may jump as the page settles (CLS). Images, embeds, and ads
  carry explicit `width`/`height` or an aspect-ratio box. Fonts don't reflow the page on swap
  (`font-display`, matched fallback metrics). Async-loaded content reserves its space up front.
  Treat any visible shift as a Blocker.
- **Loading states are handled.** No long stretch of blank or unstyled screen. Async UI shows a
  skeleton or placeholder that reserves the final layout (which also kills the shift above). No
  flash of unstyled or un-hydrated content.
- **Images optimized, assets lean.** Images are sized to their display box, served in a modern
  format (WebP/AVIF), and lazy-loaded below the fold. No shipping a 4 MB hero PNG. Flag any
  large asset and ask if it can be smaller.

## Accessibility

- **Meet the current spec.** Check against the latest WCAG: semantic elements over `div` soup,
  a label on every control, meaningful `alt` on meaningful images, a visible and logical focus
  order, full keyboard operability, and adequate color contrast. A hard failure is a Blocker; a
  gap short of that is a **Warning — never leave it unsaid.**
- **Motion has a killswitch.** Every animation, transition, or auto-playing motion has a
  matching `@media (prefers-reduced-motion: reduce)` rule that turns it off (or down). Motion
  without a reduced-motion escape hatch is a Blocker.
- **Mobile UX is real.** Tap targets are at least ~44×44px with enough spacing that you can't
  fat-finger the wrong one. Body text stays legible (≈16px+) so mobile Safari doesn't zoom on
  focus. Nothing important hides behind hover, which phones don't have.

## Design

- **No visual regressions.** Nothing that wasn't meant to change has changed — spacing, color,
  type scale, alignment, borders, shadows.
- **The layout holds at every breakpoint.** At every width you check — plus the extremes just
  past the smallest and largest — no overflow, no horizontal scrollbar where there shouldn't be
  one, no overlap, no orphaned element, no broken grid. This is the check people skip and it's
  where regressions hide.
- **A clear typography scale.** One consistent scale, not a soup of one-off sizes and weights.
  The heading hierarchy reads as a deliberate system.
- **Brand tokens, not one-offs.** If the repo or site has design tokens, a theme, or brand
  rules, the change uses them — no hardcoded one-off color or spacing that dodges the system.

## Content

- **No typos.** Read the copy that's in scope — spelling, grammar, punctuation.
- **Follow the voice.** Any user-facing text — prose, headings, titles, labels, metadata —
  follows the `tanner-brand-voice` (`.claude/skills/tanner-brand-voice/SKILL.md`) skill: the voice, tone, and hard grammatical rules (no
  periods in titles/headings, "Front-End" capitalized, no AI filler vocabulary).

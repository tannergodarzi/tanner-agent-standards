## Setup commands
- Install deps: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Dependencies
- **Use npm only — never pnpm or yarn.** `package-lock.json` is the only lockfile;
  never commit `pnpm-lock.yaml`, `pnpm-workspace.yaml`, or `yarn.lock`.
- **Always run `npm i` after editing `package.json` dependencies** to install and
  regenerate the lockfile. Commit the updated lockfile alongside the change.

## TypeScript
- `strict` is off; `strictNullChecks` is enabled. Handle null/undefined explicitly.

## React
- **Never use an array index as a `key`.** Always use a unique, stable key derived
  from the data (`item.id`, or the rendered text when it is itself unique).

## CSS
- **CSS Modules only — no bare string classNames.** Reference every class through an
  imported CSS Module object: `className={styles.x}` from the component's own co-located
  `*.module.css` (`hero.tsx` → `hero.module.css`), and `className={utils.x}` from shared
  utilities (`import utils from "@/styles/utilities.module.css"`).
- **Two tiers.** Component-specific styles live in the component's own module; cross-cutting
  patterns reused across components live in `styles/utilities.module.css` (`link`, `linkArrow`,
  `bold`, `italic`).
- **Promotion rule.** Start a style in its component module. Once the same pattern is reused
  across more than a couple of components, promote it to `styles/utilities.module.css`. Don't
  pre-emptively globalize one-offs.
- **Combine classes** with the `classnames` helper —
  `className={classNames(utils.link, utils.italic)}`. Never use template literals or bare
  multi-class strings (a typo'd module class silently renders as `"undefined"`).
- **Naming (both tiers):** camelCase, max 3 words, descriptive — `masthead`, `masonryGrid`,
  `linkArrow`. Low-level utilities may be appearance-named (`bold`, `italic`).
- **Semantic HTML first:** prefer real elements and the base element styles in
  `styles/typography.css` before adding a class.

## Content style
- When writing or editing any user-facing copy — long-form prose (blog posts, bio,
  marketing copy) as well as display text (metadata titles, page titles, H1s) — follow the
  voice, tone, and grammatical conventions in the `tanner-brand-voice` skill
  (`.claude/skills/tanner-brand-voice/SKILL.md` — plain markdown, readable by any agent).

## PR instructions
- Title format: `[Surface Area] Concise Title Case Title Of What This PR Accomplishes` — a
  surface-area prefix (the part of the app touched), Title Case, no trailing period.
- Run the repo's checks before committing — `npm run lint`, `npm run build`, and its test
  command, whichever the repo defines. Skip only a check the repo genuinely doesn't have.
- When opening a PR, follow the `tanner-create-pr` skill
  (`.claude/skills/tanner-create-pr/SKILL.md` — plain markdown, readable by any agent) for the
  full title format and body structure (business-goal summary, detail paragraph, headless-Chrome
  screenshots for visual changes, a `## Test Plan` section, and testable paths).

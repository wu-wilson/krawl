# CLAUDE.md — Krawl

## What This Is

Krawl is a visual website crawler and health scanner. The user enters a URL, the app crawls the site in real time, and every discovered page, resource, and endpoint is rendered as a node in an animated force-directed graph — color-coded by HTTP status.

## Architecture

- **client/** — React 18 + Vite + TypeScript. Tailwind CSS v3. D3.js force simulation rendered on HTML5 Canvas. Zustand for state management. All crawl logic runs client-side.
- **server/** — Express + TypeScript CORS proxy. Two proxy endpoints — `/fetch` (full page with body) and `/head` (status check only) — plus a `/` health check that returns `{ status: 'ok', service: 'krawl-proxy' }`. Stateless — no database, no auth. Outbound fetches are guarded against SSRF: hostnames are resolved and rejected unless every IP is public unicast, and redirects are followed manually so each hop is re-validated (see `src/security/`).

## Key Decisions

- Canvas rendering instead of SVG — required for smooth performance at 200 nodes.
- Dark mode only — no theme toggle, no `dark:` prefixes. CSS custom properties on `:root`.
- Brand color is Muted Amber (`#d4a017`).
- The spider logo's idle and hover-crawling cycles use CSS `@keyframes`; the landing-page entrance (both body trajectory and leg motion) is driven by JS via WAAPI.
- Animation is a first-class concern — nothing should snap, everything eases.
- The crawl engine enforces hard caps (6 concurrent, depth 3, 200 URLs max). No user-facing settings.
- Five node statuses: `queued`, `pending`, `healthy`, `redirect`, `broken`. No separate `error` status — 4xx, 5xx, and failed requests are all `broken`.

## Do NOT

- Write test files or install testing libraries.
- Use `any`, default exports, SVG for the graph, `dark:` prefixes, or a theme toggle.
- Use inline styles for static values — use Tailwind classes instead. Inline `style={{...}}` is reserved for values Tailwind can't statically extract: JS-derived durations (`DURATION.fast` from `utils/animations.ts`), prop-derived sizes, and animation delays.
- Add a database or authentication to the server.
- Allow horizontal overflow on any screen.
- Show blank screens — every state (loading, empty, error) must have a designed UI.
- Communicate status by color alone — always pair with shape, icon, or text.
- Use UI component libraries (MUI, Chakra, Radix, shadcn). Build from scratch with Tailwind.

## Rules (path-scoped — loaded automatically when editing matching files)

- `.claude/rules/code-style.md` — TypeScript, JSDoc, import ordering, naming, error handling. Loads for `client/**/*.{ts,tsx}` and `server/**/*.ts`.
- `.claude/rules/component-patterns.md` — React file structure, state management, Canvas patterns. Loads for `client/src/**/*.{ts,tsx}`.
- `.claude/rules/styling.md` — Theming, visual language, interactive states, animation. Loads for `client/src/**/*.{tsx,css}`.
- `.claude/rules/responsive.md` — Mobile-first breakpoints and per-component responsive behavior. Loads for `client/src/**/*.tsx`.

## Skills (reference knowledge, invoke with `/crawl-engine` or `/design-tokens`)

- `.claude/skills/crawl-engine/` — How the crawl engine works: queue flow, hard caps, proxy interaction.
- `.claude/skills/design-tokens/` — Exact color hex values, typography, status colors, animation durations.

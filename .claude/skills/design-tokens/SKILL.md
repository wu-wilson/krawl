---
name: design-tokens
description: Exact color hex values, typography, status colors, graph node sizes, spider logo specs, and animation duration constants.
user-invocable: true
---

# Design Tokens

Reference file for exact color values, typography, and animation constants used in the codebase. For rules about how to apply these, see `.claude/rules/styling.md`.

Source of truth: CSS custom properties in `client/src/index.css`. Canvas-specific hex values live in two places (Canvas can't read CSS vars): node status colors in `client/src/components/Graph/GraphNode.tsx` (`NODE_STATUS_COLORS`), and Canvas background, grid dots, and edge colors in `client/src/hooks/useGraph.ts`.

## Brand Colors

- Primary: `#d4a017` (Muted Amber)
- Hover/Light: `#e5b836`
- Active/Dark: `#b8860b`
- Subtle: `rgba(212, 160, 23, 0.08)`

## Dark Mode Palette (only theme)

- bg-primary: `#111114`
- bg-secondary: `#1a1a1e`
- bg-tertiary: `#232328`
- border: `#2e2e34`
- border-subtle: `#232328`
- text-primary: `#ececee`
- text-secondary: `#8b8b96`
- text-tertiary: `#5c5c66`
- surface-hover: `#232328`

## Status Colors

Five statuses — no separate `error` status. 4xx and 5xx are both `broken`.

### CSS custom properties (used by Tailwind)

- Healthy (2xx): `#34d399`
- Redirect (3xx): `#34d399` (same as healthy)
- Broken (4xx/5xx/0): `#f87171`
- Pending: `#d4a017` (brand amber)

### Canvas hex values (in `GraphNode.tsx`, used because Canvas can't read CSS vars)

- Healthy: `#34d399`, Redirect: `#34d399`, Broken: `#f87171`, Pending: `#d4a017`, Queued: `#71717a`

## Typography

- UI font: "Inter" from Google Fonts. Fallback: system-ui, sans-serif.
- Monospace: "JetBrains Mono" from Google Fonts. Fallback: monospace.
- Scale: body text at `text-sm` (14px), headings at `text-lg` to `text-2xl`, data at `text-xs` to `text-sm`.

## Graph Nodes

- Minimum radius: 4px, maximum radius: 16px. Size scales with inbound link count (`getNodeRadius` in `GraphNode.tsx`).
- Shape: all nodes are circles. Resource types are distinguished via filters, not shape.
- Canvas background: `#111114`, grid dots: `rgba(255, 255, 255, 0.12)` at 30px spacing, 1px radius (Railway-style backdrop). Edges use `rgba(255, 255, 255, alpha)` with `alpha = 0.2` (default) or `0.03` (dimmed when a non-connected node is hovered); highlighted edges use `rgba(212, 160, 23, 0.4)`. All in `hooks/useGraph.ts`.

## Spider Logo

- Amber body and 6 legs, white eyes with dark pupils.
- Sizes: 36px (navbar), 44px (landing page).
- Animation states: idle (gentle leg wave), hover-state crawling (active walk cycle).
- The idle leg-wave and hover-state crawling cycle use CSS `@keyframes` in `index.css`. The landing-page entrance — both body trajectory and leg slowdown — is JS-driven via the Web Animations API (see `LandingPage.tsx`).

## Animation Constants (from `utils/animations.ts`)

- Durations: instant 100ms, fast 150ms, normal 250ms, smooth 400ms, slow 600ms.
- CSS easing values are written inline where used (e.g., `cubic-bezier(0.16, 1, 0.3, 1)` for ease-out). Only `DURATION` is imported from the constants file.

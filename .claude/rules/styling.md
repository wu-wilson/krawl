---
paths:
  - "client/src/**/*.tsx"
  - "client/src/**/*.css"
---

# Styling

## Theming
- All colors must use CSS custom properties via Tailwind semantic tokens. Never hardcode hex values in component files. The one exception is Canvas rendering code, which can't access CSS variables — see `components/Graph/GraphNode.tsx` for node status colors and `hooks/useGraph.ts` for Canvas background, grid, and edge colors.
- Dark mode only — no theme toggle. CSS custom properties are defined on `:root`. Never use Tailwind `dark:` prefixes or `data-theme` attributes.

## Visual Language
- Borders over shadows. Use 1px borders for card and panel edges. Only use `shadow-sm` on dropdowns and modals.
- Border radius: `rounded-lg` (8px) for cards, panels, and buttons. `rounded-md` (6px) for inputs and smaller elements. `rounded-full` for icon buttons, badges, and pills.
- Generous spacing: `p-4` to `p-6` inside cards, `gap-3` to `gap-4` between elements. The UI should breathe.
- Status badges use the project's semantic tokens, not Tailwind palette numbers: `bg-status-{healthy|redirect|broken}/15 text-status-{healthy|redirect|broken} rounded-full px-2 py-0.5 text-xs`. For pending/queued, use `bg-brand/15 text-brand` and `bg-bg-tertiary text-text-tertiary` respectively (see `STATUS_STYLES` in `GraphNode.tsx`).

## Interactive States
- Every clickable element must have: a hover state using `var(--surface-hover)`, a focus ring using `ring-2 ring-brand/50`, and a smooth transition using `transition-all duration-150 ease-out`.
- No instant visual changes — all state transitions must be animated.

## Animation
- Use named duration constants from `utils/animations.ts` (`DURATION.fast`, `DURATION.normal`, etc.) for all programmatic transition durations. CSS easing values (e.g., `cubic-bezier(0.16, 1, 0.3, 1)`) are written inline where used.
- Prefer `transform` and `opacity` for animations — they are GPU-accelerated and won't trigger layout recalculation.
- Use CSS `@keyframes` for continuous or looping animations (spider logo legs, pulsing nodes). Use CSS `transition` for state-change animations (hover, filter toggle). Use `requestAnimationFrame` for Canvas rendering and for animating values CSS can't transition — e.g., the eased number rollup in `StatCard.tsx`.
- Every animation should feel smooth and physically plausible — things ease in and out, never snap.
- No UI component libraries. Build all components from scratch with Tailwind.

---
paths:
  - "client/src/**/*.tsx"
  - "client/src/**/*.ts"
---

# Component Patterns

## File Structure

Every component file follows this structure:
1. Imports
2. Props interface (with JSDoc on each prop)
3. Component (with JSDoc above)
4. Helper functions, if any

## State Management

Use `useState` for local UI state (hover, open/close, input values). Use the Zustand store for cross-component shared state (crawl data, filters). Use `useMemo` for expensive derived values. The crawl store uses batched updates via `queueMicrotask` — mutations happen in-place on Maps, then a single flush creates new references.

## Styling

Use Tailwind semantic tokens. Compose conditional styles with template literals. Extract repeated style patterns into variables at the top of the file.

## Canvas Components

Keep all Canvas rendering logic in custom hooks (e.g., `useGraph.ts`, `useAmbientCanvas.ts`). The component mounts the Canvas ref and delegates drawing to the hook. Use `requestAnimationFrame` for animation loops — never `setInterval`. Always clean up animation frames and event listeners in the `useEffect` cleanup function. Listen for window resize events and update Canvas dimensions accordingly.

When a custom hook owns gestures (pan, pinch, wheel) on a canvas, the canvas element must declare `touch-action: none` (Tailwind: `touch-none`) so the browser does not run its own gesture interpretation in parallel — otherwise mobile pinch will zoom the page, single-finger drag will scroll, and macOS trackpad swipe will navigate back. Pair with `select-none [-webkit-touch-callout:none]` and an `onContextMenu={(e) => e.preventDefault()}` if the canvas should not surface the OS long-press / right-click menu. Note: React attaches `onWheel` and `onTouchMove` as passive listeners — `preventDefault()` inside them is silently ignored. If a future change requires blocking native wheel-scroll or touch-scroll on a canvas, attach those listeners manually in `useEffect` with `{ passive: false }` rather than via JSX props. If the hook tracks per-gesture state (e.g., a "this gesture pinched" flag), also wire `onTouchCancel` to clear it — iOS Safari preempts touches for system gestures and `touchend` never fires in those cases, so without `touchcancel` cleanup the flag stays stuck into the next gesture.

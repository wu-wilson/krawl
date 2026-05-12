---
paths:
  - "client/src/**/*.tsx"
  - "client/src/**/*.ts"
---

# Component Patterns

Every component file follows this structure:
1. Imports
2. Props interface (with JSDoc on each prop)
3. Component (with JSDoc above)
4. Helper functions, if any

**State management:** Use `useState` for local UI state (hover, open/close, input values). Use the Zustand store for cross-component shared state (crawl data, filters). Use `useMemo` for expensive derived values. The crawl store uses batched updates via `queueMicrotask` — mutations happen in-place on Maps, then a single flush creates new references.

**Styling:** Use Tailwind semantic tokens. Compose conditional styles with template literals. Extract repeated style patterns into variables at the top of the file.

**Canvas components:** Keep all Canvas rendering logic in custom hooks (e.g., `useGraph.ts`). The component mounts the Canvas ref and delegates drawing to the hook. Use `requestAnimationFrame` for animation loops — never `setInterval`. Always clean up animation frames and event listeners in the `useEffect` cleanup function. Listen for window resize events and update Canvas dimensions accordingly.

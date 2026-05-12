---
paths:
  - "client/**/*.ts"
  - "client/**/*.tsx"
  - "server/**/*.ts"
---

# Code Style

- TypeScript strict mode enabled in both client and server. No `any` — use `unknown` with type narrowing or define an explicit type. Prefer `interface` for object shapes, `type` for unions and intersections.
- Functional React components only, using `const` arrow functions with `React.FC<Props>`.
- Every exported function and component must have a JSDoc docstring with `@param` and `@returns` tags.
- Named exports only (the sole exception is lazy-loaded route components).
- PascalCase for component files, camelCase for utility and hook files.
- If a component exceeds ~150 lines, extract sub-components or custom hooks.
- Prefer pure functions. Use early returns instead of deeply nested conditionals.
- Props interfaces are named `{ComponentName}Props` and defined directly above the component.
- Extract hooks when logic exceeds ~20 lines or is reused across components. Name event handlers `handle{Event}` (e.g., `handleNodeClick`).
- Group imports with blank lines between groups: React and third-party libraries → Components → Hooks and stores → Utils and engine modules → Types (using `import type`).
- Wrap all async operations in try/catch with meaningful error messages. Surface errors to the user via the UI — never swallow them silently.

---
paths:
  - "client/src/**/*.tsx"
  - "client/src/**/*.css"
---

# Responsive Design

## Breakpoints

Mobile-first. Use Tailwind's default breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). Base styles target the smallest screen, then layer on responsive overrides.

## Chrome

- **Navbar (top chrome):** Spider logo always visible; "Krawly" wordmark hidden below `sm` (`hidden sm:inline`). The view switcher (Graph/Report) sits on the right at all breakpoints — inline text buttons below `md`, a pill toggle on `md:` and up. On `sm:` and up, Share and Export render as separate buttons; below `sm`, both collapse into a single overflow menu (three-dot icon). Structure is a two-level wrapper: outer `<nav>` carries the border, background, and `pt-[env(safe-area-inset-top)]` so the bar grows under the notch on iPhones; inner `<div>` is the 56px (`h-14`) content row with `flex items-center justify-between`.
- **StatusBar (bottom chrome):** Persistent `h-11` content row rendered for every non-landing view. `StatsSummary` left-aligned, read-only `FilteredCount` + `CrawlControls` right-aligned via `ml-auto`. Uses `overflow-x-auto scrollbar-hide` so the stats line scrolls horizontally on narrow viewports rather than wrapping. Same nested structure as Navbar: outer wrapper carries `border-t border-border bg-bg-primary pb-[env(safe-area-inset-bottom)]` so the bar grows above the home indicator; inner `h-11` row holds the content.

## Views

- **Landing Page:** Input and button stack vertically on mobile (`flex-col`), sit side-by-side on `sm:` and up. Flat `bg-bg-primary` surface — no canvas. On first mount the spider crawls in along a curved bezier path via WAAPI (`LandingPage.tsx`) — body decelerates softly, legs slow + damp to rest in sync, path ends with a vertical-up tangent so the spider lands upright. `SpiderLogo` uses `React.forwardRef` for direct ref attachment (44×44 `inline-flex`, no wrapper). On arrival, the wordmark slides in from the left (`animate-landing-from-left`) and tagline + URL input + chips slide up from below (`animate-landing-from-bottom`). The entire entrance plays at most once per page load: WAAPI's `onfinish` flips the `hasPlayedEntrance` flag, and `markEntrancePlayed()` is exported for App-level paths that bypass or interrupt the landing (auto-start from `?u=`, manual submit) so Navbar-logo returns skip the animation. `prefers-reduced-motion: reduce` also short-circuits. Padding: `px-6` on mobile, `px-8` on `sm:`, `px-10` on `lg:`.
- **Graph view layout:** Between the navbar and StatusBar, the canvas fills the entire available area. A single floating filter pill is anchored top-left of the canvas (`absolute top-3 left-3 sm:top-4 sm:left-4 z-20`) with `backdrop-blur-md` over `bg-bg-primary/60` and a 1px border. Capped via `max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-2rem)]` so it never overruns the right edge; scrolls horizontally internally if needed.
- **Report view layout:** Between the navbar and StatusBar, a single-row toolbar sits above the table. The toolbar contains only `FilterChips` (which itself owns both the chip filters and the search input). The toolbar uses `overflow-x-auto scrollbar-hide`. The table or mobile card list fills the rest.
- **View switching:** Graph ↔ Report toggles are instant — no cross-fade. The inactive view stays mounted with `opacity-0 z-0 pointer-events-none` (active view: `opacity-100 z-10`) so internal state (scroll position, canvas transform, force simulation, sort order) survives the switch. The instant switch is intentional: a fade would visually echo through the area the sidebar vacates on Report-hide (see Node Detail Sidebar), making the sidebar appear to fade.

## Shared Filter Components

- **Shared atoms (`FilterChips`, `StatsSummary`, `FilteredCount`, `CrawlControls`):** Display-agnostic — the consumer wraps and positions them. The graph view uses only `FilterChips` (floating overlay); the report view uses only `FilterChips` (toolbar); the StatusBar uses `StatsSummary` + `FilteredCount` + `CrawlControls`. The atoms themselves don't impose containers, borders, or backgrounds.
- **Search input in `FilterChips`:** An `<input type="text">` lives at the end of the chip row (right-anchored via `ml-auto`, after a divider). Width is `w-48 sm:w-64`, height ~24px (`py-1.5 text-xs`). `type="text"` rather than `type="search"` to suppress WebKit's native clear button. Bound to `filter.search` in the store, so it works identically on both the Graph view's floating filter pill and the Report view's toolbar — no separate search UI per view.

## Interactions & Detail Views

- **Graph Canvas interaction:** On mobile, touch replaces mouse: pinch to zoom, single-finger drag to pan, tap to select a node. The canvas element declares `touch-none` so the browser hands every touch gesture to the canvas handlers — pinch does not zoom the page, single-finger drag does not scroll. Long-press contextmenu is suppressed via `select-none [-webkit-touch-callout:none]` on the canvas plus an `onContextMenu={(e) => e.preventDefault()}` handler (also kills the desktop right-click menu). Page-wide, `body { overscroll-behavior: none }` (applied via `overscroll-none` in `index.css`) blocks pull-to-refresh on iOS Safari / Android Chrome and two-finger trackpad swipe-back on macOS.

- **Input focus-zoom:** The viewport meta in `client/index.html` sets `maximum-scale=1.0` so iOS Safari/Chrome don't auto-zoom when a sub-16px input (e.g. the landing URL field) is focused. Manual pinch-zoom still works on iOS (the OS ignores the lock); Android Chrome honors it more strictly, with the user's "Force enable zoom" setting as the override.
- **Node Detail Sidebar:** On desktop (`lg:` and up), slides in from the right as a 320px-wide side panel. On mobile and tablet (`< lg`), slides up from the bottom as a half-screen sheet (`h-[50dvh]`) with `rounded-t-xl` and a drag handle. Inner scrollable body uses `pb-[calc(2rem+env(safe-area-inset-bottom))]` so content clears the home indicator. The panel is non-modal: dismiss via the close button (X), the Escape key, or clicking empty canvas (which clears `selectedNodeId` via the existing canvas click handler). No backdrop overlay — the user can keep pan/zoom/hover working on the graph while the panel is open. The panel is bound to Graph view only — `App.tsx` wraps it in a `display: none` toggle keyed on `view !== 'graph'`, so switching to Report instantly hides it (no slide-out) and switching back instantly restores it at its prior open/closed state (no slide-in). Internal state — selected node, accordion expansion — survives view switches because the component stays mounted.
- **Report Table:** Full table with all columns on desktop (`hidden md:block`). On mobile (`md:hidden`), switches to a card/list layout where each URL is a tappable card with status badge and response time.

## Global Rules

Never allow horizontal overflow — use `overflow-x-hidden` on the html element. Touch targets must be at least 44x44px on mobile. Never go below `text-xs` (12px) for any primary text. The one exception is small inline unit suffixes that hang off a larger value (e.g., `text-[11px]` for the `ms`/`s` suffix in `StatCard.tsx`).

**Viewport units:** Never use `h-screen` / `min-h-screen` (= `100vh`) for full-viewport layouts — on mobile browsers `100vh` is the *largest* viewport (URL bar collapsed) and pushes content below the visible fold. The app shell in `App.tsx` uses `h-svh` (smallest viewport — stable, avoids canvas resize jank from URL-bar animation re-heating the force simulation in `useGraph.ts`). The landing page uses `min-h-dvh` (dynamic viewport — fills available space). For notched-device support, `client/index.html` declares `viewport-fit=cover` and the Navbar/StatusBar use `env(safe-area-inset-*)` as documented in the Chrome section.

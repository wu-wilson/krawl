---
paths:
  - "client/src/**/*.tsx"
---

# Responsive Design

## Breakpoints

Mobile-first. Use Tailwind's default breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). Base styles target the smallest screen, then layer on responsive overrides.

## Chrome

- **Navbar (top chrome):** Spider logo always visible; "Krawl" wordmark hidden below `sm` (`hidden sm:inline`). The view switcher (Graph/Report) sits on the right at all breakpoints — inline text buttons below `md`, a pill toggle on `md:` and up. On `sm:` and up, Share and Export render as separate buttons; below `sm`, both collapse into a single overflow menu (three-dot icon).
- **StatusBar (bottom chrome):** Persistent `h-11` strip with `border-t border-border bg-bg-primary` rendered for every non-landing view. `StatsSummary` left-aligned, read-only `FilteredCount` + `CrawlControls` right-aligned via `ml-auto`. Uses `overflow-x-auto scrollbar-hide` so the stats line scrolls horizontally on narrow viewports rather than wrapping.

## Views

- **Landing Page:** Input and button stack vertically on mobile (`flex-col`), sit side-by-side on `sm:` and up. Animated background canvas renders ambient particles. Padding: `px-6` on mobile, `px-8` on `sm:`, `px-10` on `lg:`.
- **Graph view layout:** Between the navbar and StatusBar, the canvas fills the entire available area. A single floating filter pill is anchored top-left of the canvas (`absolute top-3 left-3 sm:top-4 sm:left-4 z-20`) with `backdrop-blur-md` over `bg-bg-primary/60` and a 1px border. Capped via `max-w-[calc(100%-1.5rem)]` so it never overruns the right edge on small screens; scrolls horizontally internally if needed.
- **Report view layout:** Between the navbar and StatusBar, a single-row toolbar sits above the table. The toolbar contains only `FilterChips` (which itself owns both the chip filters and the search input). The toolbar uses `overflow-x-auto scrollbar-hide`. The table or mobile card list fills the rest.

## Shared Filter Components

- **Shared atoms (`FilterChips`, `StatsSummary`, `FilteredCount`, `CrawlControls`):** Display-agnostic — the consumer wraps and positions them. The graph view uses only `FilterChips` (floating overlay); the report view uses only `FilterChips` (toolbar); the StatusBar uses `StatsSummary` + `FilteredCount` + `CrawlControls`. The atoms themselves don't impose containers, borders, or backgrounds.
- **Search input in `FilterChips`:** An `<input type="text">` lives at the end of the chip row (right-anchored via `ml-auto`, after a divider). Width is `w-48 sm:w-64`, height ~24px (`py-1.5 text-xs`). `type="text"` rather than `type="search"` to suppress WebKit's native clear button. Bound to `filter.search` in the store, so it works identically on both the Graph view's floating filter pill and the Report view's toolbar — no separate search UI per view.

## Interactions & Detail Views

- **Graph Canvas interaction:** On mobile, touch replaces mouse: pinch to zoom, single-finger drag to pan, tap to select a node.
- **Node Detail Sidebar:** On desktop (`lg:` and up), slides in from the right as a 320px-wide side panel. On mobile and tablet (`< lg`), slides up from the bottom as a half-screen sheet (`h-[50vh]`) with `rounded-t-xl` and a drag handle. Dismissible by clicking outside (desktop) or pressing Escape.
- **Report Table:** Full table with all columns on desktop (`hidden md:block`). On mobile (`md:hidden`), switches to a card/list layout where each URL is a tappable card with status badge and response time.

## Global Rules

Never allow horizontal overflow — use `overflow-x-hidden` on the html element. Touch targets must be at least 44x44px on mobile. Never go below `text-xs` (12px) for any primary text. The one exception is small inline unit suffixes that hang off a larger value (e.g., `text-[11px]` for the `ms`/`s` suffix in `StatCard.tsx`).

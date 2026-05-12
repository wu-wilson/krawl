---
paths:
  - "client/src/**/*.tsx"
---

# Responsive Design

Mobile-first. Use Tailwind's default breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). Base styles target the smallest screen, then layer on responsive overrides.

- **Landing Page:** Input and button stack vertically on mobile (`flex-col`), sit side-by-side on `sm:` and up. Animated background canvas renders ambient particles. Padding: `px-6` on mobile, `px-8` on `sm:`, `px-10` on `lg:`.
- **Navbar:** Wordmark is always visible. The view switcher (Graph/Report) uses inline buttons on mobile (`md:hidden`), a pill toggle on desktop (`hidden md:flex`). Share and Export buttons collapse labels to icons on mobile.
- **Stats Bar:** Horizontal scroll row of stat cards on mobile with `overflow-x-auto`. Pause/Stop controls inline in the scroll row on mobile (`sm:hidden`), separate controls area on desktop (`hidden sm:flex`).
- **Filter Bar:** Filter pills sit on a single line with `flex-nowrap`. On mobile the row scrolls horizontally (`overflow-x-auto`); on `lg:` and up the horizontal scroll is disabled (`lg:overflow-x-visible`) since the pills fit without scrolling at that width.
- **Graph Canvas:** Fills the available viewport height minus the navbar, stats bar, and filter bar. On mobile, touch interactions replace mouse: pinch to zoom, single-finger drag to pan, tap to select a node.
- **Node Detail Sidebar:** On desktop (`lg:` and up), slides in from the right as a 320px-wide side panel. On mobile and tablet (`< lg`), slides up from the bottom as a half-screen sheet (`h-[50vh]`) with `rounded-t-xl` and a drag handle. Dismissible by clicking outside (desktop) or pressing Escape.
- **Report Table:** Full table with all columns on desktop (`hidden md:block`). On mobile (`md:hidden`), switches to a card/list layout where each URL is a tappable card with status badge and response time.
- **General:** Never allow horizontal overflow — use `overflow-x-hidden` on the html element. Touch targets must be at least 44x44px on mobile. Never go below `text-xs` (12px) for any text.

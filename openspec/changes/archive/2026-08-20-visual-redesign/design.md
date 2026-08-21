## Context

CivicGrid has a functional React/TypeScript frontend built with Vite, Tailwind CSS v4, and Ant Design. It successfully integrates features like dynamic theming, mocked APIs (with TanStack Query), Recharts-based visualizations, and detailed complaint views. However, the current visual language is generic and lacks the premium, intelligence-oriented aesthetic required for high-stakes presentations (e.g., hackathons or civic pitches). We need to elevate the UI significantly without breaking the underlying functionality.

## Goals / Non-Goals

**Goals:**
- Implement a dark-first, premium UI utilizing a sophisticated palette (deep blue-black surface, electric cyan accents).
- Redesign key structural components (AppShell, Sidebar, Topbar) for better spatial hierarchy.
- Introduce highly polished data visualizations, removing default Recharts aesthetics.
- Add elegant micro-interactions (hover states, subtle pulses, component transitions) across the board.
- Transform the AI processing step into a professional, restrained data-analysis animation.
- Restyle the dashboard to include a "Civic Pulse" summary and "Priority Issues" feed.
- Customize Ant Design tokens deeply so they don't look like default AntD components.

**Non-Goals:**
- Rewriting the data fetching layer or modifying the API contract.
- Removing Ant Design entirely (we will override its tokens instead).
- Introducing complex 3D graphics or overwhelming animations.
- Refactoring the entire application architecture or folder structure.

## Decisions

**1. Design Token System Override**
- *Decision:* Update `src/theme/tokens.ts` and `src/index.css` to use the new Palantir-inspired dark theme tokens (`#080D18` background, `#0E1625` surface, `#38BDF8` primary cyan accent).
- *Rationale:* Modifying the existing theme system ensures dark/light toggles continue to work, while profoundly changing the look of the app.

**2. Deep Ant Design Customization**
- *Decision:* Inject aggressive overrides in `App.tsx`'s `<ConfigProvider>` to style Selects, Tables, and Modals with our new border colors (`#243149`), muted text (`#94A3B8`), and rounded radii.
- *Rationale:* We avoid the cost of rebuilding complex components (like Table) from scratch, but strip away the "generic template" feel.

**3. Typography Upgrade to Inter**
- *Decision:* Ensure `Inter` is universally applied with strict font-weight control (e.g., avoiding overly thick headers in dark mode).
- *Rationale:* Inter provides the technical, legible aesthetic required for data-dense dashboards.

**4. Semantic Status Colors**
- *Decision:* Standardize semantic colors across badges, charts, and priority lists (Critical/Emergency = Red, High/Urgent = Orange, Medium/Soon = Amber, Low/Routine = Slate).
- *Rationale:* Prevents a rainbow effect and focuses the user's attention on actionable intelligence.

**5. Chart Refinement**
- *Decision:* Update `Recharts` components to remove default cartesian grid lines, adjust axis colors to muted slate, and use customized tooltip components.
- *Rationale:* Default charts look out of place in a premium UI.

## Risks / Trade-offs

- **Risk:** Customizing Ant Design can be fragile if internal class names are targeted. 
  - *Mitigation:* Use Ant Design's official ConfigProvider token system as much as possible, falling back to global CSS overrides (`src/index.css`) only when necessary.
- **Risk:** Dark mode emphasis might degrade light mode readability.
  - *Mitigation:* Explicitly map light mode tokens to ensure sufficient contrast (e.g., `#F8FAFC` background with `#0F172A` text).
- **Risk:** Micro-interactions causing performance stutter.
  - *Mitigation:* Restrict animations to CSS transforms (`translate`, `scale`) and opacity. Limit animation durations to 150-250ms.

## Why

The CivicGrid frontend is currently a functional MVP, but its visual presentation relies on generic dashboard paradigms. To succeed in hackathon demos and judge presentations, it needs to be transformed into a premium, modern civic-intelligence product. The application must look intelligent, trustworthy, and distinctly Palantir-inspired, moving away from stock Ant Design defaults and standard admin templates.

## What Changes

- Complete aesthetic overhaul focusing on a dark-first, premium interface.
- Redesign of the global application shell (sidebar, topbar, background).
- Comprehensive typography upgrade using a modern sans-serif font (Inter).
- Sophisticated semantic color system with an electric cyan/civic blue accent.
- Redesigned "Civic Pulse" and KPI cards to visualize intelligence.
- Addition of a "Priority Issues" feed on the dashboard.
- Elegant "Citizen Voice" vs "AI Analysis" visual separation in complaint details.
- Restrained, data-processing style animation for the AI submission flow.
- Redesigned data visualizations (Recharts) with subtle backgrounds and theme-aware colors.
- Polish through tasteful micro-interactions and empty states.
- Responsive mobile refinement across all viewports.
- **NOTE**: Existing API contracts, routes, functionality, and mock modes will be strictly preserved.

## Capabilities

### New Capabilities
- `visual-design-system`: Establishes the new dark-first visual identity, tokens, and core UI component overrides.
- `dashboard-redesign`: Revamps the dashboard with Civic Pulse, premium KPI cards, and refined charts.
- `submission-experience`: Enhances the landing page, complaint form, AI processing animation, and success state.
- `complaint-explorer-redesign`: Polishes the explorer table, mobile cards, and filters.
- `complaint-details-redesign`: Implements the split Citizen Voice / AI Analysis view.

### Modified Capabilities

- 

## Impact

- All UI components in `src/components/` and `src/pages/` will be updated with new styling classes and structure.
- `src/theme/tokens.ts` and `src/index.css` will be rewritten to match the new visual direction.
- Ant Design overrides in `App.tsx` will be significantly expanded to remove the default look.
- Recharts implementations will be visually customized.

## 1. Design System Foundation

- [x] 1.1 Update `src/theme/tokens.ts` and `src/index.css` to implement the dark-first Palantir-inspired palette (`#080D18` background, `#0E1625` surface, `#38BDF8` primary).
- [x] 1.2 Update typography configuration in index.css to use `Inter`.
- [x] 1.3 Add generic Ant Design token overrides in `App.tsx` (ConfigProvider) for Table, Select, Modal, Card, Button components to strip default Ant styles and apply dark theme tokens.
- [x] 1.4 Refine Semantic Colors in `constants.ts` or respective badge components (Red, Orange, Amber, Slate).

## 2. Application Shell Redesign

- [x] 2.1 Update `AppShell.tsx` and background styles to use the new deep blue-black background and layout structure.
- [x] 2.2 Redesign `Sidebar.tsx` with geometric active states, custom logo mark (◈ CivicGrid), and generous spacing.
- [x] 2.3 Refine `Topbar.tsx` to include subtle borders and reduced shadow, improving the global search and theme toggle UI.

## 3. Submission Experience

- [x] 3.1 Redesign `LandingPage.tsx` with centered layout, prominent whitespace, and refined typography.
- [x] 3.2 Update `ComplaintForm.tsx` to have elegant focus states and modern input aesthetics.
- [x] 3.3 Replace the generic spinner in `AIProcessingSteps.tsx` with a data-processing animation (pulsing nodes).
- [x] 3.4 Enhance `SubmissionSuccess.tsx` to clearly highlight structured AI data in a visually distinct manner.

## 4. Dashboard Redesign

- [x] 4.1 Update `DashboardPage.tsx` to include a strong contextual header ("Good evening, Civic Admin").
- [x] 4.2 Create the "Civic Pulse" component showing a concise trend line (e.g., Road-related complaints upward trend).
- [x] 4.3 Redesign `KpiCard.tsx` (or `DashboardKpis.tsx`) to show large typography, small icons, and sparklines instead of generic boxes.
- [x] 4.4 Refine `CategoryChart.tsx`, `SeverityChart.tsx`, and `UrgencyChart.tsx` (Recharts) with muted gridlines and customized tooltips.
- [x] 4.5 Add a "Priority Issues" feed section replacing or enhancing `RecentComplaints.tsx`.

## 5. Complaint Explorer & Details

- [x] 5.1 Redesign `DashboardFilters.tsx` and Explorer filters to use compact pill/chip controls.
- [x] 5.2 Refine `ComplaintTable.tsx` for desktop and `ComplaintCard.tsx` for mobile with generous row heights and hover states.
- [x] 5.3 Redesign `ComplaintDetails.tsx` to visually separate "Citizen Voice" from "AI Analysis" structurally (e.g., side-by-side or distinct blocks).

## 6. Polish and Quality Check

- [x] 6.1 Ensure that `LoadingSkeleton.tsx` has a sleek, sweeping animation matching the premium dark aesthetic.
- [x] 6.2 Check `ErrorState.tsx` and `EmptyState.tsx` for visual consistency (muted text, subtle borders).
- [x] 6.3 Final review of mobile responsiveness across `DashboardPage` and `ComplaintDetailsPage`.
- [x] 6.4 Verify that there are no generic standard blue borders on focus (replace with `focus:ring-cyan-500` or similar).

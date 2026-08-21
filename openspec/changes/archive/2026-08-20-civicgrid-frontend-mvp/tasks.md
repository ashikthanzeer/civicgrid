## 1. Project Scaffold & Configuration

- [x] 1.1 Create `frontend/` directory and scaffold Vite + React + TypeScript app (`npm create vite@latest . -- --template react-ts`)
- [x] 1.2 Install dependencies: `tailwindcss`, `postcss`, `autoprefixer`, `antd`, `@ant-design/icons`, `react-router-dom`, `@tanstack/react-query`, `recharts`, `lucide-react`
- [x] 1.3 Configure Tailwind CSS (`tailwind.config.ts`, `postcss.config.js`) with custom design tokens and content paths
- [x] 1.4 Create `.env.example` documenting `VITE_API_BASE_URL` and `VITE_USE_MOCK_API`
- [x] 1.5 Create `.env.local` with `VITE_USE_MOCK_API=true` and `VITE_API_BASE_URL=http://localhost:8000`
- [x] 1.6 Set up `src/` folder structure: `api/`, `components/layout/`, `components/complaints/`, `components/dashboard/`, `components/forms/`, `components/ui/`, `hooks/`, `pages/`, `theme/`, `types/`, `utils/`
- [x] 1.7 Configure TypeScript strict mode in `tsconfig.json` (no implicit any, strict null checks)
- [x] 1.8 Configure React Router with lazy-loaded routes for all five pages in `App.tsx`

## 2. TypeScript Types

- [x] 2.1 Create `src/types/complaint.ts` — define `Complaint`, `ComplaintStatus`, `Severity`, `Urgency`, `ComplaintCategory` types matching the API contract
- [x] 2.2 Create `src/types/api.ts` — define `SubmitComplaintRequest`, `SubmitComplaintResponse`, `GetComplaintsResponse`, `ApiError` types
- [x] 2.3 Create `src/types/filters.ts` — define `ComplaintFilters` and `SortOption` types used by explorer and dashboard
- [x] 2.4 Create `src/utils/constants.ts` — export CATEGORIES array, WARDS array (Ward 1–15), SEVERITY_LEVELS, URGENCY_LEVELS, STATUS_OPTIONS

## 3. Theme System

- [x] 3.1 Create `src/theme/tokens.ts` — define light and dark color token objects (background, surface, elevated surface, border, text, muted text, accent, status colors)
- [x] 3.2 Create `src/theme/ThemeProvider.tsx` — React context provider that reads from `localStorage`, watches `prefers-color-scheme`, sets `data-theme` on `<html>`, and exposes `theme`, `setTheme` via context
- [x] 3.3 Create `src/theme/useTheme.ts` — custom hook that consumes the ThemeContext
- [x] 3.4 Add CSS custom property definitions to `src/index.css` for `[data-theme="light"]` and `[data-theme="dark"]` selectors covering all tokens
- [x] 3.5 Configure Ant Design `ConfigProvider` in `App.tsx` with dynamic `theme.algorithm` (dark/light) and `token` overrides matching the design palette
- [x] 3.6 Verify: switch theme and confirm AntD Table, Select, Modal, and Form all use dark palette colors in dark mode (no white panels)

## 4. API Layer

- [x] 4.1 Create `src/api/client.ts` — central fetch wrapper that routes to mock or real backend based on `VITE_USE_MOCK_API`, normalizes errors to `ApiError`, sets base URL from `VITE_API_BASE_URL`
- [x] 4.2 Create `src/api/mock/complaints.ts` — realistic mock dataset with 12+ complaints across Roads, Water, Electricity, Waste Management, Healthcare, Education, Drainage, Street Lighting, Public Safety; varied severity/urgency; include a Malayalam-context complaint entry
- [x] 4.3 Create `src/api/mock/handlers.ts` — mock implementations of `submitComplaint`, `getComplaints`, `getComplaintById` with artificial delay (300–700ms) to simulate network
- [x] 4.4 Create `src/api/complaints.ts` — export `submitComplaint(payload)`, `getComplaints(filters?)`, `getComplaintById(id)` that call through `client.ts`
- [x] 4.5 Create `src/hooks/useComplaints.ts` — TanStack Query hook wrapping `getComplaints` with filter params, caching, and loading/error state
- [x] 4.6 Create `src/hooks/useComplaint.ts` — TanStack Query hook wrapping `getComplaintById(id)`
- [x] 4.7 Create `src/hooks/useSubmitComplaint.ts` — TanStack Query mutation hook wrapping `submitComplaint`, with `onSuccess` calling `queryClient.invalidateQueries(['complaints'])`

## 5. Shared UI Components

- [x] 5.1 Create `src/components/ui/SeverityBadge.tsx` — badge for Low/Medium/High/Critical with color token + icon + text (not color-only)
- [x] 5.2 Create `src/components/ui/UrgencyBadge.tsx` — badge for Routine/Soon/Urgent/Emergency with color token + text
- [x] 5.3 Create `src/components/ui/CategoryBadge.tsx` — badge with category-specific Lucide icon + category name label
- [x] 5.4 Create `src/components/ui/StatusBadge.tsx` — badge for New/Under Review/Assigned/In Progress/Resolved with neutral semantic colors
- [x] 5.5 Create `src/components/ui/EmptyState.tsx` — component accepting `title`, `description`, optional `action: { label, onClick }` props; renders an icon, text, and optional button
- [x] 5.6 Create `src/components/ui/ErrorState.tsx` — component accepting `message`, `onRetry` props; renders error icon, message, and "Try Again" button
- [x] 5.7 Create `src/components/ui/LoadingSkeleton.tsx` — shimmer skeleton variants for KPI card, complaint row, complaint card, chart area
- [x] 5.8 Verify all badge components in both light and dark mode; ensure contrast ratios ≥ 4.5:1

## 6. Application Shell (Layout)

- [x] 6.1 Create `src/components/layout/Sidebar.tsx` — navigation items (Dashboard, Complaints, Analytics, Settings), active route highlight, CivicGrid logo/name, collapsible on tablet
- [x] 6.2 Create `src/components/layout/Topbar.tsx` — page title prop, search input, theme toggle button, notifications icon placeholder, user avatar placeholder ("Civic Admin")
- [x] 6.3 Create `src/components/layout/ThemeToggle.tsx` — cycles light → dark → system with icon update; calls `setTheme` from `useTheme`
- [x] 6.4 Create `src/components/layout/MobileDrawer.tsx` — slide-in navigation drawer for mobile viewports with animation
- [x] 6.5 Create `src/components/layout/AppShell.tsx` — wraps all dashboard routes with Sidebar + Topbar + scrollable main area; handles responsive sidebar collapse
- [x] 6.6 Test: desktop sidebar is persistent; tablet sidebar collapses on toggle; mobile shows drawer; active route highlighted

## 7. Citizen Landing Page

- [x] 7.1 Create `src/pages/LandingPage.tsx` — hero section with CivicGrid name, tagline, description, and "Report an Issue" CTA button
- [x] 7.2 Add pipeline visualization component to LandingPage — four steps (Citizen Voice → AI Understanding → Structured Issue → Civic Action) as a styled step indicator
- [x] 7.3 Apply theme tokens so landing page renders correctly in both light and dark modes
- [x] 7.4 Verify landing page is fully responsive from 320px with no horizontal overflow
- [x] 7.5 Verify "Report an Issue" button navigates to `/submit`

## 8. Complaint Submission Page

- [x] 8.1 Create `src/pages/SubmitComplaintPage.tsx` — page wrapper with title and subtitle; renders `ComplaintForm`
- [x] 8.2 Create `src/components/forms/ComplaintForm.tsx` — textarea with character count display (live update), minimum 20 char validation, maximum 2000 char limit
- [x] 8.3 Create `src/components/forms/LocationSelector.tsx` — Ant Design Select with Ward 1–15 options; "Use current location" button that calls browser Geolocation API
- [x] 8.4 Handle geolocation success: auto-fill location field with detected ward or coordinate label
- [x] 8.5 Handle geolocation failure: show non-blocking "Location detection unavailable" message; field remains manually selectable
- [x] 8.6 Create `src/components/forms/AIProcessingSteps.tsx` — animated multi-step progress indicator (Complaint received → Understanding → Classifying → Saving) using timed progression
- [x] 8.7 Wire submit button to `useSubmitComplaint` mutation; show `AIProcessingSteps` during `isPending`; disable button to prevent duplicate submissions
- [x] 8.8 Create `src/components/complaints/SubmissionSuccess.tsx` — success screen showing structured AI result (category, subcategory, severity, urgency, location, summary) with badges; "View on Dashboard" and "Submit Another Complaint" buttons
- [x] 8.9 Create submission error state: show user-friendly error message; re-enable submit button on failure
- [x] 8.10 Verify end-to-end: submit complaint → AI processing animation → success screen → navigate to dashboard → complaint appears in list

## 9. Dashboard Page

- [x] 9.1 Create `src/pages/DashboardPage.tsx` — layout using AppShell; renders filters, KPI cards, charts, recent complaints
- [x] 9.2 Create `src/components/dashboard/KpiCard.tsx` — card with icon, title, numeric value, trend indicator; skeleton variant when loading
- [x] 9.3 Create `src/components/dashboard/DashboardKpis.tsx` — renders four KpiCards (Total, Urgent, Critical, Resolved) derived from filtered complaints
- [x] 9.4 Create `src/components/dashboard/DashboardFilters.tsx` — date range picker, location multi-select, category multi-select, severity multi-select, urgency multi-select; "Clear Filters" button; active filter chips display
- [x] 9.5 Create `src/components/dashboard/CategoryChart.tsx` — Recharts BarChart or RadialBarChart showing complaints by category; pass theme-aware axis/label colors from `useTheme`
- [x] 9.6 Create `src/components/dashboard/SeverityChart.tsx` — Recharts PieChart showing severity distribution (Low/Medium/High/Critical)
- [x] 9.7 Create `src/components/dashboard/UrgencyChart.tsx` — Recharts BarChart showing urgency distribution (Routine/Soon/Urgent/Emergency)
- [x] 9.8 Create `src/components/dashboard/RecentComplaints.tsx` — list of 5–10 most recent complaints using `ComplaintCard`; each card navigates to `/complaints/:id` on click
- [x] 9.9 Verify: charts update correctly when filters change; clear filters restores full dataset; loading skeletons show while fetching; dark mode charts have correct colors

## 10. Complaint Explorer Page

- [x] 10.1 Create `src/pages/ComplaintsPage.tsx` — page with AppShell; renders search input, filters, sort controls, and complaints list/table
- [x] 10.2 Create `src/components/complaints/ComplaintTable.tsx` — Ant Design Table with columns (Summary, Category, Location, Severity, Urgency, Created); clickable rows navigate to `/complaints/:id`; visible on ≥768px
- [x] 10.3 Create `src/components/complaints/ComplaintCard.tsx` — card layout for mobile viewports showing all complaint fields stacked; no horizontal overflow
- [x] 10.4 Implement client-side search: filter complaints by text match in `summary` and `raw_text` (case-insensitive)
- [x] 10.5 Implement sort options: Newest, Oldest, Highest Severity, Highest Urgency (Critical > High > Medium > Low, Emergency > Urgent > Soon > Routine)
- [x] 10.6 Wire all filter controls to derive filtered+sorted list; filters combine with AND logic
- [x] 10.7 Render `EmptyState` when search/filter yields zero results with "Clear Filters" action
- [x] 10.8 Render `ErrorState` when `useComplaints` fails with "Try Again" refetch button
- [x] 10.9 Verify: responsive layout switches table→cards at 768px; sorting works correctly; search updates in real time

## 11. Complaint Details Page

- [x] 11.1 Create `src/pages/ComplaintDetailsPage.tsx` — reads `:id` from URL, calls `useComplaint(id)`, renders `ComplaintDetails`
- [x] 11.2 Create `src/components/complaints/ComplaintDetails.tsx` — two-section layout: "Citizen Report" (raw_text verbatim) and "AI Analysis" (all structured fields)
- [x] 11.3 Add metadata section: submission timestamp (formatted), copyable complaint ID (with clipboard copy + "Copied!" feedback), status badge
- [x] 11.4 Add back navigation: "← Back to Complaints" link
- [x] 11.5 Render not-found state when complaint ID does not exist in the dataset
- [x] 11.6 Render loading skeleton while complaint is fetching
- [x] 11.7 Verify: citizen section shows unmodified raw text; AI section shows all structured fields with correct badges; copy button works; back navigation works

## 12. CivicMap Placeholder Component

- [x] 12.1 Create `src/components/complaints/CivicMap.tsx` — polished placeholder showing complaint count, high-priority area count, and a styled placeholder area with a grid/map icon; ready for Leaflet integration later

## 13. Responsive Design Pass

- [x] 13.1 Test and fix layout at 320px, 375px, 768px, 1024px, 1280px, 1440px viewports
- [x] 13.2 Ensure no horizontal scroll on any page at any viewport width
- [x] 13.3 Ensure all form inputs and buttons are touch-friendly (min 44px tap target)
- [x] 13.4 Verify sidebar/drawer behavior on all breakpoints
- [x] 13.5 Verify ComplaintTable → ComplaintCard responsive switch at 768px

## 14. Accessibility Pass

- [x] 14.1 Audit all form fields for associated `<label>` elements or `aria-label`
- [x] 14.2 Verify keyboard navigation: Tab through all interactive elements, Enter/Space activate buttons
- [x] 14.3 Add `aria-live` region for form validation errors and submission status messages
- [x] 14.4 Verify visible focus states (outline) on all interactive elements in both themes
- [x] 14.5 Verify no interactive element relies solely on color to convey state

## 15. Dark Mode Verification Pass

- [x] 15.1 Audit every page in dark mode: LandingPage, SubmitComplaintPage, DashboardPage, ComplaintsPage, ComplaintDetailsPage
- [x] 15.2 Verify all AntD components (Table, Select, DatePicker, Modal, Form, Dropdown) use dark palette — no white panels
- [x] 15.3 Verify all charts (CategoryChart, SeverityChart, UrgencyChart) render with dark-appropriate axis/label/tooltip colors
- [x] 15.4 Verify all badge variants (Severity, Urgency, Category, Status) have sufficient contrast in dark mode
- [x] 15.5 Verify theme persists after page reload (localStorage key `civicgrid-theme`)
- [x] 15.6 Verify system mode responds correctly to OS dark/light toggle

## 16. Build Verification & Polish

- [x] 16.1 Run `npm run build` and fix all TypeScript errors (zero `any` types, no missing types)
- [x] 16.2 Fix all major console errors and warnings
- [x] 16.3 Ensure no hardcoded URLs in source — all use `import.meta.env.VITE_API_BASE_URL`
- [x] 16.4 Ensure no secrets (API keys, Firebase credentials) appear anywhere in `src/`
- [x] 16.5 Verify mock mode works fully offline (`VITE_USE_MOCK_API=true`): dashboard populates, submission returns mock structured data, details page loads
- [x] 16.6 Verify real API mode (`VITE_USE_MOCK_API=false`): submission POST reaches backend, GET complaints returns live data
- [x] 16.7 Do a final review of all acceptance criteria from the spec and confirm each is satisfied

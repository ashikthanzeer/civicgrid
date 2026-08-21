## Context

CivicGrid is a civic intelligence platform where Gemini AI converts citizen complaints into structured civic data stored in Firestore. The platform has a backend API but no frontend. The frontend must serve two audiences: citizens submitting complaints in natural language, and civic administrators monitoring structured complaint data on a dashboard. Development happens during a hackathon where the backend may be unavailable, so offline-capable development is critical.

## Goals / Non-Goals

**Goals:**
- Deliver a full React + TypeScript + Vite frontend with React Router, TanStack Query, Ant Design, Recharts, and Tailwind CSS
- Implement a production-quality dark/light/system theme system as a first-class feature
- Create a clean API abstraction layer that switches between mock and real backends via `VITE_USE_MOCK_API`
- Support the full citizen complaint submission flow end-to-end
- Create an administrative civic intelligence dashboard with charts, filters, and complaint explorer
- Ensure full responsive design from 320px to 1440px+
- Ensure accessibility: semantic HTML, ARIA labels, keyboard nav, visible focus states
- Zero secrets in frontend code — all AI/Firestore calls stay server-side

**Non-Goals:**
- Authentication or role-based access control
- Real-time WebSocket updates
- GIS map integration in MVP (polished placeholder only)
- Backend implementation — this is frontend only
- CI/CD pipeline or Docker configuration

## Decisions

### Decision 1: Vite + React + TypeScript as the build foundation
**Choice**: Vite with React and TypeScript  
**Rationale**: Fast HMR, modern ESM bundling, TypeScript strictness catches API contract mismatches early. Industry standard for React SPAs in 2024–2026.  
**Alternative considered**: Next.js — rejected because the civic dashboard is a SPA without SSR/SSG requirements, and Next.js adds complexity that slows hackathon velocity.

### Decision 2: Tailwind CSS as the primary styling layer
**Choice**: Tailwind CSS with custom design tokens via CSS variables  
**Rationale**: Utility-first approach allows rapid UI iteration. Custom CSS variables for theme tokens (`--bg-primary`, `--surface`, etc.) enable consistent dark/light switching without Tailwind's dark: variant being applied piecemeal across hundreds of components.  
**Alternative considered**: Plain CSS modules — too verbose for a time-constrained hackathon. Styled-components — adds runtime overhead and complexity.

### Decision 3: Ant Design for complex form and table components  
**Choice**: Ant Design (antd) with ConfigProvider wrapping the app for theme injection  
**Rationale**: Ant Design's `ConfigProvider` accepts a custom `theme` object with `algorithm` (dark/light) and `token` overrides. This lets us sync Ant Design's internal theming with our custom CSS variable theme without white-boxing every AntD component in dark mode.  
**Alternative considered**: Headless UI + manual styling — would require reimplementing Select, Table, DatePicker etc., consuming hackathon time.

### Decision 4: TanStack Query for server state
**Choice**: `@tanstack/react-query` with a custom `apiClient` abstraction  
**Rationale**: Provides caching, background refetch, loading/error states, and stale-while-revalidate semantics. The `queryFn` calls go through `src/api/complaints.ts`, which routes to either mock or real HTTP depending on `VITE_USE_MOCK_API`.  
**Alternative considered**: SWR — similar but TanStack Query has more ergonomic mutation APIs for the POST complaint flow.

### Decision 5: Mock API via environment variable, not compile-time mocks
**Choice**: Runtime check `import.meta.env.VITE_USE_MOCK_API === 'true'` in `src/api/client.ts`  
**Rationale**: A developer can switch between mock and real backends by changing `.env.local` without rebuilding. Realistic mock data (12+ complaints) makes the dashboard demo-ready from day one.  
**Alternative considered**: MSW (Mock Service Worker) — powerful but heavy setup overhead; the simple runtime switch is sufficient for this project's scope.

### Decision 6: Theme system via React context + CSS custom properties
**Choice**: `ThemeProvider` context + `data-theme` attribute on `<html>` + CSS variables  
**Rationale**: CSS variables cascade naturally to all elements including Ant Design components when set on `:root`. The `ThemeProvider` reads `localStorage` on mount, watches `prefers-color-scheme` for system mode, and exposes a `setTheme` function. Ant Design's `ConfigProvider` reads from context to apply matching algorithm.  
**Alternative considered**: Tailwind's `dark` class strategy — requires the `dark:` prefix on every utility, making AntD integration difficult and error-prone.

### Decision 7: Folder structure — feature-first with shared UI
**Choice**:
```
src/
├── api/           # client + complaints endpoint module
├── components/    # layout/, complaints/, dashboard/, forms/, ui/
├── hooks/         # useComplaints, useSubmitComplaint, useTheme
├── pages/         # one file per route
├── theme/         # ThemeProvider, useTheme hook, token definitions
├── types/         # shared TypeScript interfaces
└── utils/         # formatters, constants
```
**Rationale**: Clear separation between data layer (api/), state (hooks/), presentation (components/), and pages. Another developer can find and extend any slice without reading the whole codebase.

## Risks / Trade-offs

- **Ant Design dark mode styling gaps** → Use `ConfigProvider` with `theme={{ algorithm: theme.darkAlgorithm }}` and override specific `token` values (colorBgContainer, colorBgElevated, colorBorder) to match the design palette. Test every AntD surface (Table, Select, Modal, Form) in dark mode.
- **TanStack Query + mock API returning stale data** → Set `staleTime: 0` in mock mode so data refreshes on dashboard navigate. Use `queryClient.invalidateQueries` after successful complaint submission.
- **Recharts dark mode axes/labels** → Pass explicit `stroke` and `fill` colors from theme context to chart components rather than relying on CSS inheritance.
- **Mobile sidebar causing layout overflow** → Use `position: fixed` drawer with `z-index` above main content and `overflow: hidden` on body when open.
- **Form submission double-fire** → Disable submit button while `mutation.isPending === true` at the React level, not just visual.

## Migration Plan

1. Create `frontend/` directory at project root
2. Scaffold Vite app: `npm create vite@latest . -- --template react-ts`
3. Install dependencies: Tailwind, AntD, TanStack Query, React Router, Recharts, Lucide React
4. Create `.env.local` with `VITE_USE_MOCK_API=true` and `VITE_API_BASE_URL=http://localhost:8000`
5. Build in priority order: theme system → app shell → submission flow → dashboard → explorer → details
6. When backend is ready, set `VITE_USE_MOCK_API=false` and verify all API calls succeed

**Rollback**: The frontend is a separate `frontend/` directory — removing it has zero impact on the backend.

## Open Questions

- Does the backend return a `status` field on complaints (New / Under Review / etc.) or is this frontend-only for now?
- What are the exact ward names/IDs in the location dataset — are they strictly "Ward 1" through "Ward N" or are there named localities?
- Will the backend support `GET /api/complaints?category=Roads&severity=High` query params, or should the frontend filter client-side from a full list?

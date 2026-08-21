## Why

CivicGrid has no frontend. The platform's AI-powered civic complaint pipeline — citizen submission → Gemini AI classification → Firestore storage → civic dashboard — is invisible without a production-quality UI that citizens and civic administrators can actually use. This is needed now to demonstrate the full end-to-end product during the hackathon.

## What Changes

- Introduces a complete React/TypeScript/Vite frontend application for the CivicGrid platform
- New citizen-facing complaint submission experience with AI processing feedback
- New administrative civic intelligence dashboard with KPI cards, charts, and complaint explorer
- Dark/light/system theme system with localStorage persistence
- Full API abstraction layer with mock mode for backend-unavailable development
- Responsive layouts from 320px mobile to 1440px+ desktop
- All critical user flows: submit complaint → AI analysis → success → dashboard display

## Capabilities

### New Capabilities

- `app-shell`: Global layout system — sidebar, topbar, theme toggle, responsive drawer navigation
- `theme-system`: Dark/light/system theme provider with localStorage persistence and consistent token application across all components
- `complaint-submission`: Citizen complaint submission form with location selector, AI processing state indicator, and success confirmation screen
- `civic-dashboard`: Administrative overview with KPI cards, complaint distribution charts, and recent complaints feed
- `complaint-explorer`: Searchable, filterable, sortable complaint list with table (desktop) and card (mobile) views
- `complaint-details`: Structured complaint details page distinguishing citizen input from AI interpretation
- `api-layer`: Centralized API client with mock/real mode switching via `VITE_USE_MOCK_API`, typed request/response contracts, and realistic mock data (12+ complaints)
- `shared-ui`: Reusable badge components (severity, urgency, category), empty states, error states, and skeleton loaders
- `citizen-landing`: Public-facing landing page with hero, AI pipeline visualization, and CTA to submission

### Modified Capabilities

<!-- No existing capabilities — this is a new frontend on a new project -->

## Impact

- New top-level `frontend/` directory containing the entire Vite + React application
- Adds Node.js/npm dependency for the frontend (does not affect backend)
- No changes to backend API contracts — frontend adapts to documented API shape
- Environment variable `VITE_API_BASE_URL` must point to the backend; `VITE_USE_MOCK_API=true` enables full offline development
- No Firebase/Gemini credentials in the frontend; all AI processing remains server-side

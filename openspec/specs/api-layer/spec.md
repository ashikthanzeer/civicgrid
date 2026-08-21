## ADDED Requirements

### Requirement: API client routes requests through mock or real backend based on environment variable
The `src/api/client.ts` module SHALL check `import.meta.env.VITE_USE_MOCK_API` at runtime. When `true`, all API calls SHALL return data from `src/api/mock/complaints.ts` without any network request. When `false`, all API calls SHALL make HTTP requests to `import.meta.env.VITE_API_BASE_URL`.

#### Scenario: Mock mode returns data without network requests
- **WHEN** `VITE_USE_MOCK_API=true` and the user loads the dashboard
- **THEN** complaints SHALL be displayed from mock data and no HTTP requests SHALL be made to the backend

#### Scenario: Real mode sends requests to the configured base URL
- **WHEN** `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL=https://api.civicgrid.example.com`
- **THEN** all API calls SHALL use that base URL and no mock data SHALL be used

### Requirement: API module exposes typed functions for all endpoints
The `src/api/complaints.ts` module SHALL export: `submitComplaint(payload)`, `getComplaints(filters?)`, and `getComplaintById(id)`. Each function SHALL return a typed Promise matching the documented API contract.

#### Scenario: submitComplaint returns a typed Complaint object
- **WHEN** `submitComplaint({ text, location })` is called successfully
- **THEN** the resolved value SHALL be typed as `{ success: true; complaint: Complaint }` with no `any` types

#### Scenario: API errors are normalized to a consistent error shape
- **WHEN** a network error or non-2xx response occurs
- **THEN** the function SHALL throw an `ApiError` with `message` and `statusCode` fields, NOT a raw fetch error

### Requirement: Mock data contains at least 12 realistic complaints
The mock dataset SHALL include at least 12 complaints covering Roads, Water, Electricity, Waste Management, Healthcare, Education, Drainage, Street Lighting, and Public Safety categories. Severity and urgency SHALL be varied. At least one complaint SHALL represent a scenario submitted in Malayalam (shown through its structured output fields, not the raw text which can be English for MVP).

#### Scenario: Mock complaints cover multiple categories
- **WHEN** mock data is loaded
- **THEN** at least 7 distinct categories SHALL be represented across the 12+ complaints

#### Scenario: Mock data includes multiple severity levels
- **WHEN** mock data is loaded
- **THEN** all four severity levels (Low, Medium, High, Critical) SHALL appear at least once

### Requirement: Environment configuration uses .env files
The project SHALL include a `.env.example` file documenting all required environment variables (`VITE_API_BASE_URL`, `VITE_USE_MOCK_API`). Secrets SHALL NOT appear in any committed file.

#### Scenario: .env.example contains all required variables
- **WHEN** a developer clones the repo and reads `.env.example`
- **THEN** they SHALL see all required variables with example values and explanatory comments

#### Scenario: No Gemini or Firebase credentials appear in frontend source
- **WHEN** the entire `src/` directory is searched for API key patterns
- **THEN** no Firebase service account JSON, no `GEMINI_API_KEY`, and no `firebaseConfig` private keys SHALL be found

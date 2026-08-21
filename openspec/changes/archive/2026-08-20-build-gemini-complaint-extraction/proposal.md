## Why

CivicGrid needs a reliable boundary that turns unstructured, including Malayalam, citizen complaints into validated civic intelligence before a future backend handles persistence or HTTP concerns. Building this focused extraction module now establishes a reusable, testable contract around Gemini structured output without coupling it to FastAPI, Firestore, or the frontend.

## What Changes

- Add a small Python 3.11+ `backend/` module exposing `classify_complaint(text: str) -> CivicComplaint`.
- Define a Pydantic complaint schema with constrained category, severity, and urgency values and explicit handling for missing location or facility data.
- Add a civic complaint extraction prompt that teaches Gemini the severity-versus-urgency distinction and multilingual classification behavior.
- Configure the current official `google-genai` SDK to request Gemini structured output constrained by the Pydantic/schema definition.
- Add environment-based configuration via `GEMINI_API_KEY` and `GEMINI_MODEL`, with no hardcoded credentials.
- Add unit tests for schema, input validation, prompt construction, and error behavior, plus opt-in Gemini integration tests for representative English and Malayalam complaints.
- Add a manual runner, dependency list, environment example, ignore rules, and concise setup/usage documentation.
- Do not add FastAPI routes, Firestore, authentication, frontend, dashboard, deployment, analytics, or database models.

## Capabilities

### New Capabilities

- `gemini-complaint-extraction`: Classify multilingual citizen complaint text into a validated `CivicComplaint` object using Gemini structured output.

### Modified Capabilities

- None.

## Impact

- Adds a new standalone Python package under `backend/` with Pydantic and Gemini SDK dependencies.
- Introduces a stable import surface for future backend integration: `from civicgrid.gemini import classify_complaint`.
- Requires `GEMINI_API_KEY` and optionally `GEMINI_MODEL` for live API calls; unit tests remain runnable without credentials.
- No existing frontend code, routes, persistence layer, or shared application specs are changed.

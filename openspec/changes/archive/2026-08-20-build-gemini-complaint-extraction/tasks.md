## 1. Backend Module Setup

- [x] 1.1 Create the `backend/civicgrid/` package and package initializer.
- [x] 1.2 Add `requirements.txt`, `.env.example`, `.gitignore`, and README setup instructions with the documented supported Gemini model.

## 2. Schema And Prompt

- [x] 2.1 Implement `CivicComplaint` with exactly seven fields and enums for the fixed category taxonomy, severity, and urgency values.
- [x] 2.2 Implement the extraction prompt in `civicgrid/prompts.py`, including multilingual guidance, `Unknown` handling, factuality constraints, and the distinct severity/urgency definitions.
- [x] 2.3 Add prompt construction helpers that safely incorporate complaint text without introducing an unstructured response parsing step.

## 3. Gemini Extraction

- [x] 3.1 Implement environment loading and clear configuration/input exception types in `civicgrid/gemini.py`.
- [x] 3.2 Implement `classify_complaint(text: str) -> CivicComplaint` using `google-genai` structured output configured with the Pydantic complaint schema.
- [x] 3.3 Validate the SDK result as `CivicComplaint` and surface API, timeout/network, and malformed-response failures without fallback data.

## 4. Tests

- [x] 4.1 Add credential-free unit tests for valid and invalid schema values, exact field shape, input validation, missing-key behavior, and prompt content.
- [x] 4.2 Add marked integration tests for road, water, waste, electrical emergency, Malayalam road, missing location, healthcare, and drainage complaints.
- [x] 4.3 Ensure integration tests are skipped or excluded appropriately when `GEMINI_API_KEY` is unavailable and document the explicit integration command.

## 5. Manual Verification And Documentation

- [x] 5.1 Add `test_manual.py` with readable output for predefined English and Malayalam complaints and all seven structured fields.
- [x] 5.2 Document import usage, `model_dump()`, schema values, environment setup, unit tests, integration tests, and manual execution.
- [ ] 5.3 Run unit tests, live integration tests when credentials are available, and the manual script; verify no deprecated SDK or hardcoded credential usage is present.

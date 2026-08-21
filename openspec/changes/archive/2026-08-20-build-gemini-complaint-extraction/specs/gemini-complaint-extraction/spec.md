## ADDED Requirements

### Requirement: Complaint output uses a fixed validated schema
The module MUST expose a `CivicComplaint` Pydantic model containing exactly `category`, `subcategory`, `severity`, `urgency`, `location`, `affected_facility`, and `summary`. `category` MUST be one of `Roads`, `Water`, `Electricity`, `Waste Management`, `Public Transport`, `Healthcare`, `Education`, `Street Lighting`, `Drainage`, `Public Safety`, or `Other`. `severity` MUST be one of `Low`, `Medium`, `High`, or `Critical`, and `urgency` MUST be one of `Routine`, `Soon`, `Urgent`, or `Emergency`.

#### Scenario: Valid structured complaint is accepted
- **WHEN** a response contains all seven fields with allowed category, severity, and urgency values
- **THEN** it is returned as a `CivicComplaint` instance and `model_dump()` produces the structured dictionary

#### Scenario: Arbitrary taxonomy values are rejected
- **WHEN** a response contains a top-level category or priority value outside its allowed enum
- **THEN** Pydantic validation raises a clear validation error and the invalid result is not returned

### Requirement: Gemini is constrained to structured complaint output
The extractor MUST send a civic classification prompt and configure the official `google-genai` SDK's structured output/schema capability using the `CivicComplaint` schema. It MUST NOT depend on free-form model text, regex extraction, string splitting, or manual JSON parsing as a response-conversion workaround.

#### Scenario: Model returns a schema-conforming result
- **WHEN** Gemini processes an English or Malayalam complaint successfully
- **THEN** the extractor validates the structured response and returns a `CivicComplaint`

#### Scenario: Model response is malformed or invalid
- **WHEN** the SDK returns a response that cannot be validated as `CivicComplaint`
- **THEN** the extractor raises an understandable structured-response error and does not return fake or partial data

### Requirement: Classification preserves civic semantics and missing information
The extraction prompt MUST require category selection from the fixed taxonomy, a concise subcategory, factual summary, and extraction of location and affected facility only when present or directly inferable. Missing location or facility MUST be represented as `Unknown`. The prompt MUST distinguish severity as seriousness/potential harm from urgency as response speed, and MUST support multilingual input with English schema labels.

#### Scenario: Road complaint distinguishes severity and urgency
- **WHEN** the input reports a large pothole near a bus stop in Ward 7 that creates a safety risk
- **THEN** the result uses category `Roads`, a pothole-related subcategory, location `Ward 7`, and priority values reflecting seriousness separately from response speed

#### Scenario: Malayalam road complaint is classified by meaning
- **WHEN** the input is `പഞ്ചായത്ത് റോഡിൽ വലിയ കുഴിയുണ്ട്, വാഹനങ്ങൾ പോകാൻ ബുദ്ധിമുട്ടാണ്.`
- **THEN** the result uses category `Roads` and a meaningful road or pothole-related subcategory with English schema labels

#### Scenario: Missing location is not invented
- **WHEN** the input says `The street lights have stopped working.` without naming a place
- **THEN** the result uses category `Street Lighting` and location `Unknown`

### Requirement: Public extraction function validates input and configuration
The module MUST expose `classify_complaint(text: str) -> CivicComplaint`. It MUST reject non-string, empty, and whitespace-only input with a clear Python exception, load `GEMINI_API_KEY` only from environment configuration, and raise understandable errors for missing keys, API/network failures, and invalid structured responses.

#### Scenario: Normal complaint is classified
- **WHEN** a non-empty complaint is passed and Gemini returns a valid structured result
- **THEN** `classify_complaint` returns the validated object without coupling to HTTP or persistence code

#### Scenario: Invalid input is rejected before the API call
- **WHEN** the input is empty, whitespace-only, or not a string
- **THEN** `classify_complaint` raises an input validation exception and does not initialize or call Gemini

#### Scenario: Missing API key is actionable
- **WHEN** `GEMINI_API_KEY` is absent
- **THEN** `classify_complaint` raises an error identifying the missing environment variable rather than returning fallback data

### Requirement: Tests and documentation support offline development and deliberate live verification
The project MUST include unit tests that do not require API credentials, opt-in pytest integration tests marked `integration`, a manual script with predefined English and Malayalam examples, dependency/configuration files, and a README covering setup, usage, schema, model choice, and test commands.

#### Scenario: Unit test suite runs without credentials
- **WHEN** a developer runs `pytest` without `GEMINI_API_KEY`
- **THEN** schema, enum, prompt, and local validation tests pass without making Gemini calls

#### Scenario: Integration tests are explicitly selected
- **WHEN** a developer runs `pytest -m integration` with `GEMINI_API_KEY` configured
- **THEN** representative English and Malayalam complaints are sent to Gemini and their structured classifications are checked

#### Scenario: Manual runner displays structured fields
- **WHEN** a developer runs `python test_manual.py` with valid configuration
- **THEN** the script prints each input and all seven structured output fields in a readable format

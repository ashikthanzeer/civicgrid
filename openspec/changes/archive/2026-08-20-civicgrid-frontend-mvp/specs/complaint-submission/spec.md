## ADDED Requirements

### Requirement: Complaint submission form collects description and location
The `/submit` route SHALL render a form with a large textarea for the complaint description (minimum 20 characters, maximum 2000 characters), a character count display, and a location selector. The form SHALL validate these fields before allowing submission.

#### Scenario: Character count updates as user types
- **WHEN** the user types in the complaint textarea
- **THEN** a character count (e.g., "143 / 2000") SHALL update in real time below the textarea

#### Scenario: Validation prevents submission of short complaints
- **WHEN** the user attempts to submit a complaint with fewer than 20 characters
- **THEN** an inline validation error SHALL appear and the submission SHALL be blocked

#### Scenario: Location selector shows ward options
- **WHEN** the user opens the location dropdown
- **THEN** a list of ward options (Ward 1 through Ward 15 at minimum) SHALL be displayed and selectable

#### Scenario: Geolocation auto-fills location
- **WHEN** the user clicks "Use current location" and grants browser permission
- **THEN** the location field SHALL be auto-filled with the nearest ward or a GPS coordinate label

#### Scenario: Geolocation failure is handled gracefully
- **WHEN** the user denies geolocation permission or the browser API fails
- **THEN** a non-blocking message SHALL inform the user that location detection is unavailable and the field SHALL remain manually selectable

### Requirement: AI processing state is communicated during submission
While the backend processes the complaint, the frontend SHALL display a multi-step progress indicator showing at minimum: "Complaint received", "Understanding complaint", "Classifying civic issue", "Saving civic record".

#### Scenario: Loading state disables the submit button
- **WHEN** a complaint is being submitted
- **THEN** the submit button SHALL be disabled and display a spinner or "Analyzing complaint..." label to prevent duplicate submissions

#### Scenario: Progress steps animate sequentially
- **WHEN** the submission is in progress
- **THEN** steps SHALL appear to complete one by one at timed intervals to communicate AI processing (even if backend returns a single response)

### Requirement: Successful submission shows AI-structured result
After a successful backend response, the form SHALL be replaced by a success confirmation screen displaying the structured complaint data returned by the API: category, subcategory, severity, urgency, location, and AI summary.

#### Scenario: Success screen shows structured fields
- **WHEN** the backend responds with `{ success: true, complaint: { ... } }`
- **THEN** the success screen SHALL display category, subcategory, severity, urgency, location, and summary with appropriate badge styling

#### Scenario: Success screen offers navigation options
- **WHEN** the success screen is displayed
- **THEN** two action buttons SHALL be available: "View on Dashboard" (navigates to `/dashboard`) and "Submit Another Complaint" (resets the form to its initial state)

### Requirement: Submission error is handled gracefully
If the backend returns an error or the network request fails, the user SHALL see a clear error message without raw technical details.

#### Scenario: Network error shows user-friendly message
- **WHEN** the submission request fails due to a network error or non-2xx HTTP response
- **THEN** the form SHALL display "We couldn't submit your complaint. Please check your connection and try again." and the submit button SHALL be re-enabled

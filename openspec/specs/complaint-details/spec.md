## ADDED Requirements

### Requirement: Complaint details page clearly separates citizen input from AI interpretation
The `/complaints/:id` route SHALL display the complaint in two distinct sections: "Citizen Report" (showing the original `raw_text` verbatim) and "AI Analysis" (showing all structured fields produced by Gemini: category, subcategory, severity, urgency, location, affected_facility, and summary). These sections SHALL be visually separated to make clear that AI fields are not the citizen's own words.

#### Scenario: Citizen Report section shows unmodified raw text
- **WHEN** the details page loads for a complaint
- **THEN** the "Citizen Report" section SHALL display `raw_text` exactly as submitted, with no reformatting or paraphrasing

#### Scenario: AI Analysis section shows all structured fields
- **WHEN** the details page loads
- **THEN** the "AI Analysis" section SHALL display: Category, Subcategory, Severity (as a badge), Urgency (as a badge), Location, Affected Facility, and AI Summary

### Requirement: Complaint details displays metadata and status
The details page SHALL show: submission timestamp (formatted as a human-readable date), complaint ID (copyable), and status badge (New / Under Review / Assigned / In Progress / Resolved). Status is display-only in the MVP.

#### Scenario: Complaint ID is copyable
- **WHEN** the user clicks the copy icon next to the complaint ID
- **THEN** the ID SHALL be copied to the clipboard and a brief "Copied!" confirmation SHALL appear

#### Scenario: Status badge uses semantic color
- **WHEN** the status is "New"
- **THEN** the status badge SHALL use a neutral/informational color distinct from severity and urgency badges

### Requirement: Complaint details page handles missing complaints
If the requested complaint ID does not exist in the dataset, the page SHALL display a clear not-found message with a navigation option.

#### Scenario: Unknown ID shows not-found state
- **WHEN** the user navigates to `/complaints/nonexistent-id`
- **THEN** the page SHALL display "Complaint not found." with a "Back to Complaints" link

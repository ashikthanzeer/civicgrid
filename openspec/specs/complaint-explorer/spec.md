## ADDED Requirements

### Requirement: Complaint explorer lists all complaints with search and filters
The `/complaints` route SHALL display a searchable, filterable list of all complaints. A search input SHALL filter by text match against the summary and raw_text fields. Filter controls SHALL support: category, subcategory, severity, urgency, location, and date range. Sorting SHALL support: Newest, Oldest, Highest Severity, Highest Urgency.

#### Scenario: Search filters complaints in real time
- **WHEN** the user types in the search input
- **THEN** the complaint list SHALL update to show only complaints whose summary or raw_text contains the search term (case-insensitive)

#### Scenario: Multiple filters combine with AND logic
- **WHEN** the user selects Category = "Roads" and Severity = "High"
- **THEN** only complaints that are BOTH in Roads AND have High severity SHALL be displayed

#### Scenario: Sort by Highest Severity orders correctly
- **WHEN** the user selects "Highest Severity" sort
- **THEN** Critical complaints SHALL appear first, followed by High, Medium, and Low

### Requirement: Complaint explorer uses responsive table/card layout
On desktop (≥768px) complaints SHALL be displayed in a table with columns: Summary, Category, Location, Severity, Urgency, Created. On mobile (<768px) each complaint SHALL be displayed as a card with all the same fields.

#### Scenario: Desktop table shows all columns
- **WHEN** the viewport is ≥ 768px
- **THEN** a table with the specified columns SHALL be rendered and each row SHALL be clickable to navigate to `/complaints/:id`

#### Scenario: Mobile cards show all fields
- **WHEN** the viewport is < 768px
- **THEN** each complaint SHALL be rendered as a stacked card with no horizontal overflow and all fields visible

### Requirement: Explorer empty state is informative
When no complaints match the current search/filter combination, a clear empty state message SHALL be shown.

#### Scenario: Search with no results shows empty state
- **WHEN** the search or filter combination yields zero results
- **THEN** an empty state SHALL display "No complaints match your filters." with a "Clear Filters" action button

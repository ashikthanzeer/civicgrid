## ADDED Requirements

### Requirement: Compact Filters
The system SHALL display filters as compact pill/chip style controls rather than large full-width form inputs.

#### Scenario: Explorer is loaded
- **WHEN** the user views the complaints explorer
- **THEN** filters for Category, Severity, Urgency, and Location appear as compact inline controls.

### Requirement: Premium Table Redesign
The system SHALL render the complaints list using generous row height, subtle dividers, semantic badges, and a hover state, removing typical spreadsheet styling.

#### Scenario: Table data is displayed
- **WHEN** the desktop view renders the complaint table
- **THEN** it features custom styling, strong primary text, and muted metadata.

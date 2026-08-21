## ADDED Requirements

### Requirement: Dashboard displays top-level KPI cards
The `/dashboard` route SHALL display four KPI metric cards at the top of the page: Total Complaints, Urgent Issues, Critical Issues, and Resolved. Each card SHALL include the metric value, a descriptive title, a relevant icon, and a small trend indicator (mock trend data clearly labeled as mock).

#### Scenario: KPI cards render with complaint data
- **WHEN** the dashboard loads and complaint data is available
- **THEN** four KPI cards SHALL be displayed in a responsive grid (4-column on desktop, 2-column on tablet, 1-column on mobile)

#### Scenario: KPI cards display skeleton loaders while fetching
- **WHEN** the complaint data is loading
- **THEN** KPI card areas SHALL show animated skeleton placeholders instead of blank space

### Requirement: Dashboard displays complaint distribution charts
The dashboard SHALL include: (1) a bar or donut chart showing complaint count by category, (2) a chart showing severity distribution (Low / Medium / High / Critical), and (3) a chart showing urgency distribution (Routine / Soon / Urgent / Emergency). All charts SHALL be responsive and theme-aware.

#### Scenario: Category chart renders in dark mode
- **WHEN** dark mode is active and the category chart is displayed
- **THEN** chart bars/segments, axis labels, gridlines, and tooltip backgrounds SHALL use dark-appropriate colors with sufficient contrast

#### Scenario: Charts handle empty data gracefully
- **WHEN** no complaints exist
- **THEN** charts SHALL display an empty state message ("No data yet") rather than rendering broken or invisible charts

### Requirement: Dashboard shows a recent complaints feed
Below the charts, the dashboard SHALL display the 5–10 most recent complaints, each showing: category, subcategory, summary (truncated to 2 lines), location, severity badge, urgency badge, and relative timestamp (e.g., "12 minutes ago").

#### Scenario: Clicking a recent complaint navigates to details
- **WHEN** the user clicks a complaint card in the recent feed
- **THEN** the router SHALL navigate to `/complaints/:id` for that complaint

### Requirement: Dashboard has filter controls
The dashboard SHALL provide filter controls for date range, location, category, severity, and urgency. Applying a filter SHALL narrow all visible data (KPI counts, charts, recent complaints) to the filtered subset.

#### Scenario: Clearing filters restores full dataset
- **WHEN** the user clicks "Clear Filters"
- **THEN** all filter controls SHALL reset to their default (unfiltered) state and the full complaint dataset SHALL be displayed

#### Scenario: Active filters are indicated visually
- **WHEN** one or more filters are active
- **THEN** active filter values SHALL be displayed as removable chips/tags near the filter controls

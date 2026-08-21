## ADDED Requirements

### Requirement: SeverityBadge renders the correct visual style for each severity level
The `SeverityBadge` component SHALL accept a `severity: "Low" | "Medium" | "High" | "Critical"` prop and render a styled badge using both color AND a text/icon indicator so severity is not communicated by color alone.

#### Scenario: Critical severity badge is visually distinct
- **WHEN** `<SeverityBadge severity="Critical" />` is rendered
- **THEN** the badge SHALL display "Critical" text, use a destructive/red color token, and include a visual indicator (icon or distinct shape) that is not solely color-dependent

#### Scenario: Badges remain readable in dark mode
- **WHEN** dark mode is active and severity badges are displayed
- **THEN** all four severity badge variants SHALL have sufficient contrast ratio (≥ 4.5:1) against the surface background

### Requirement: UrgencyBadge renders the correct visual style for each urgency level
The `UrgencyBadge` component SHALL accept an `urgency: "Routine" | "Soon" | "Urgent" | "Emergency"` prop and render a styled badge using both color AND text.

#### Scenario: Emergency urgency badge is visually distinct
- **WHEN** `<UrgencyBadge urgency="Emergency" />` is rendered
- **THEN** the badge SHALL use a high-alert color (distinct from Critical severity) and display the text "Emergency"

### Requirement: EmptyState component is used consistently across all list views
An `EmptyState` component SHALL be used whenever a list, table, or data section has no data to display. It SHALL accept `title`, `description`, and an optional `action` (button label + callback) props.

#### Scenario: EmptyState renders with optional action button
- **WHEN** `<EmptyState title="No complaints yet" description="..." action={{ label: "Submit a Test Complaint", onClick: fn }} />` is rendered
- **THEN** the title, description, and a styled action button SHALL all be visible

### Requirement: LoadingSkeleton is used for all async data areas
A `LoadingSkeleton` component (or set of skeleton variants) SHALL replace content areas while data is loading. Skeletons SHALL animate with a shimmer effect and match the approximate dimensions of the content they replace.

#### Scenario: Dashboard shows skeletons while fetching complaints
- **WHEN** the dashboard mounts and `useComplaints` query is in loading state
- **THEN** skeleton placeholders SHALL be visible in the KPI card area, chart area, and recent complaints area

### Requirement: ErrorState component provides retry capability
An `ErrorState` component SHALL be rendered when a query fails. It SHALL display a user-friendly message and a "Try Again" button that triggers query refetch.

#### Scenario: Error state retry button refetches data
- **WHEN** the user clicks "Try Again" on an error state
- **THEN** the failed query SHALL be re-executed

### Requirement: CategoryBadge displays the complaint category with an icon
A `CategoryBadge` component SHALL accept a `category: string` prop and render the category name with a relevant icon (e.g., a road icon for Roads, a water drop for Water).

#### Scenario: CategoryBadge renders a recognizable icon for known categories
- **WHEN** `<CategoryBadge category="Roads" />` is rendered
- **THEN** a road or construction-related icon SHALL appear alongside the "Roads" text label

## ADDED Requirements

### Requirement: Global layout shell renders on all dashboard pages
The application SHALL provide a persistent `AppShell` component wrapping all dashboard-oriented routes (`/dashboard`, `/complaints`, `/complaints/:id`, `/analytics`, `/settings`) that contains a sidebar (desktop), a top navigation bar, and a scrollable main content area.

#### Scenario: Desktop sidebar is persistent
- **WHEN** the viewport width is ≥ 1024px
- **THEN** the sidebar SHALL be permanently visible and the main content area SHALL be offset to the right of it

#### Scenario: Tablet sidebar collapses
- **WHEN** the viewport width is between 768px and 1023px
- **THEN** the sidebar SHALL be collapsed by default and togglable via a hamburger icon in the topbar

#### Scenario: Mobile drawer navigation
- **WHEN** the viewport width is < 768px
- **THEN** the sidebar SHALL be replaced by a slide-in drawer triggered by a menu icon in the topbar, and the main content SHALL occupy the full viewport width

#### Scenario: Active route is highlighted in sidebar
- **WHEN** the current URL matches a sidebar navigation item's route
- **THEN** that item SHALL be visually distinguished with an active indicator

#### Scenario: Topbar displays contextual page title
- **WHEN** the user navigates to any dashboard route
- **THEN** the topbar SHALL display the current page's title (e.g., "Dashboard", "Complaints")

### Requirement: Topbar provides global actions
The topbar SHALL include a search input, a theme toggle button, a notifications placeholder icon, and a user/avatar area labeled "Civic Admin".

#### Scenario: Search input is accessible from all dashboard pages
- **WHEN** the user is on any dashboard route
- **THEN** the search input SHALL be visible in the topbar and focusable via keyboard

#### Scenario: Theme toggle is accessible from the topbar
- **WHEN** the user clicks the theme toggle
- **THEN** the theme SHALL cycle through light → dark → system modes and the icon SHALL update to reflect the active mode

## ADDED Requirements

### Requirement: Landing page has a hero section with a primary CTA
The `/` route SHALL display a hero section with the CivicGrid product name, tagline ("Turning citizen voices into actionable civic intelligence."), a brief description, and a prominent "Report an Issue" button that navigates to `/submit`.

#### Scenario: CTA button navigates to submission page
- **WHEN** the user clicks "Report an Issue" on the landing page
- **THEN** the router SHALL navigate to `/submit`

#### Scenario: Landing page works without authentication
- **WHEN** any user visits the `/` route
- **THEN** the landing page SHALL be accessible without a login prompt

### Requirement: Landing page visualizes the civic intelligence pipeline
The landing page SHALL include a visual representation of the four-step pipeline: "Citizen Voice → AI Understanding → Structured Issue → Civic Action". This SHALL be implemented as a simple step indicator, not a complex animation.

#### Scenario: Pipeline steps are visible and labeled
- **WHEN** the landing page is rendered
- **THEN** four steps SHALL be visually distinct with numbered indicators and descriptive labels

### Requirement: Landing page is responsive and theme-aware
The landing page SHALL apply the current theme (light/dark) and SHALL be fully usable on mobile without horizontal overflow.

#### Scenario: Landing page renders correctly in dark mode
- **WHEN** dark mode is active and the landing page is viewed
- **THEN** the background, text, and pipeline visualization SHALL all use dark theme colors with no white/light elements

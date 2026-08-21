## ADDED Requirements

### Requirement: Design Token Overrides
The system SHALL establish a dark-first color palette using a Palantir-inspired palette (deep blue-black surface, electric cyan accents) as CSS custom properties.

#### Scenario: App loads in dark mode
- **WHEN** the application loads
- **THEN** the root background color matches the new `#080D18` token and the accent color matches `#38BDF8`.

### Requirement: Ant Design Token Customization
The system SHALL customize Ant Design components to integrate seamlessly with the CivicGrid visual design system, stripping default templates and rounded corners where necessary to appear premium.

#### Scenario: Displaying Ant Design components
- **WHEN** any Ant Design Select, Table, or Button is rendered
- **THEN** it inherits the custom borders (`#243149`), muted text colors (`#94A3B8`), and specialized hover states without looking like a generic template.

### Requirement: Typography Standardization
The system SHALL utilize the Inter font (or equivalent selected modern sans-serif) globally, ensuring readable font-weights across dark backgrounds.

#### Scenario: Text is rendered
- **WHEN** text is displayed in headers or body
- **THEN** the font-family is correctly applied with appropriate typographic hierarchy.

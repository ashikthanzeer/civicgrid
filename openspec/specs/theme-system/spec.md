## ADDED Requirements

### Requirement: Three theme modes are supported
The application SHALL support three theme modes: `light`, `dark`, and `system`. The `system` mode SHALL read `prefers-color-scheme` from the browser and apply the matching theme. Switching between modes SHALL be instantaneous with a smooth CSS transition (no flash of unstyled content).

#### Scenario: User selects dark mode
- **WHEN** the user selects "Dark" from the theme toggle
- **THEN** the application background SHALL use `#0B1120`, surfaces SHALL use `#111827`, and text SHALL use `#F8FAFC`

#### Scenario: User selects light mode
- **WHEN** the user selects "Light" from the theme toggle
- **THEN** the application background SHALL use `#F8FAFC`, surfaces SHALL use `#FFFFFF`, and text SHALL use `#0F172A`

#### Scenario: System mode follows OS preference
- **WHEN** the user selects "System" mode and the OS is set to dark
- **THEN** the dark theme SHALL be applied automatically without user intervention

### Requirement: Theme preference persists across sessions
The selected theme mode SHALL be persisted to `localStorage` under the key `civicgrid-theme`. On application load, the persisted value SHALL be read and applied before the first render to prevent a theme flash.

#### Scenario: Theme persists after page reload
- **WHEN** the user selects dark mode and reloads the page
- **THEN** dark mode SHALL be active immediately on load without a light-mode flash

#### Scenario: Missing localStorage key defaults to system
- **WHEN** no `civicgrid-theme` key exists in localStorage
- **THEN** the application SHALL default to `system` mode

### Requirement: Theme tokens are applied via CSS custom properties
The theme system SHALL use CSS custom properties (variables) on the `:root` element (via a `data-theme` attribute on `<html>`) to express all color tokens. Ant Design's `ConfigProvider` SHALL receive matching `theme.algorithm` and `token` overrides so no AntD component renders with mismatched colors in dark mode.

#### Scenario: No AntD component shows white background in dark mode
- **WHEN** dark mode is active
- **THEN** all Ant Design surfaces (Table, Select, Modal, Form, Dropdown, DatePicker) SHALL have background colors matching the dark palette

#### Scenario: Charts use theme-aware colors
- **WHEN** the theme changes
- **THEN** Recharts axis labels, gridlines, and tooltips SHALL update to use theme-appropriate colors without page reload

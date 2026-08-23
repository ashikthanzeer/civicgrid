# CivicGrid — AI-Powered Civic Complaint Intelligence Platform
## Comprehensive Project Report & Feature Specification

---

## 1. Executive Summary

**CivicGrid** is a modern civic intelligence and municipal grievance platform designed to bridge the communication gap between citizens and local administrative bodies. Leveraging Google Gemini Multimodal AI, interactive geospatial mapping, and multilingual natural language processing, CivicGrid automatically categorizes, prioritizes, deduplicates, tracks, and manages civic issues through a strict state machine lifecycle and real-time SLA breach detection.

Citizens can report problems (potholes, water leaks, garbage overflow, power outages) via voice, text, or photo in their native regional language and track resolution status publicly using a secret tracking token (`TK-XXXXXXXX`). Municipal officers receive a centralized, prioritized dashboard with analytics, maps, SLA timers, and proof-of-work workflow management tools to resolve public complaints efficiently.

---

## 2. Technology Stack & Architecture

```mermaid
graph TD
    A["Citizen UI / Officer Portal (React 19 + Vite + Tailwind)"] -->|"REST API (Axios / Fetch + React Query)"| B["FastAPI Backend (Python 3.13)"]
    B --> C["Gemini AI (Structured Output & Vision)"]
    B --> D["Persistence Layer (SQLite / PostgreSQL)"]
    A --> E["Google Maps & OpenStreetMap / Leaflet"]
    A --> F["Web Speech API (STT & TTS)"]
    B --> G["SLA Breach & Lifecycle Engine"]
```

### 2.1 Frontend
- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Vanilla CSS tokens with custom CSS variables (CivicGrid Deep Indigo & Saffron theme) + Tailwind CSS.
- **Data Fetching & State**: TanStack React Query v5 with automatic retries and exponential backoff.
- **Mapping**: Google Maps JavaScript API (MarkerClusterer, Places Autocomplete, Geocoding) with fallback to OpenStreetMap/Leaflet.
- **Visualization**: Recharts (Dynamic Bar, Pie, and Donut charts).
- **Localization**: Custom lightweight i18n engine supporting 9 languages.
- **Accessibility**: Web Speech API for voice recognition (Speech-to-Text) and audio readout (Text-to-Speech).

### 2.2 Backend
- **Framework**: FastAPI (Asynchronous Python REST API).
- **AI Engine**: Google GenAI SDK (`gemini-3.6-flash`) with structured JSON schema output and vision parsing.
- **State Machine & SLA Engine**: Strict state transition validation and dynamic SLA breach monitoring (`process_sla_breaches()`).
- **Database Engine**: Dual-engine persistence layer supporting local/embedded **SQLite (WAL mode)** and cloud **PostgreSQL** (Neon, Supabase, Render).
- **Security & Cryptography**: PBKDF2-HMAC-SHA256 with 100,000 iterations for officer credentials; base64 MIME validation (<5MB); parameterized SQL queries.

---

## 3. Comprehensive Feature Catalog

### 🌟 3.1 Citizen Issue Reporting & AI Extraction
1. **Multimodal Complaint Submission**:
   - Citizens can submit issues by typing text, uploading on-site photos, or speaking via microphone.
   - Base64 image payload integration sends photos directly into Gemini vision models for defect confirmation.
2. **Multilingual Voice-to-Text (STT)**:
   - Built-in speech recognition supporting Indian accents and regional languages.
   - Real-time speech transcription directly into the reporting form.
3. **Text-to-Speech (TTS) Accessibility**:
   - Audio playback button on complaint summaries and details for visually impaired or non-literate citizens.
4. **Interactive Location Selection**:
   - **Google Places Search**: Live predictive autocomplete for streets, landmarks, and postal codes.
   - **Pin Drop Map**: Click-to-place map marker that reverse-geocodes coordinates into human-readable addresses.
   - **GPS Geolocation**: One-click "Detect My Current Location" button.
5. **Zero-Touch AI Classification (Gemini)**:
   - **Category & Subcategory**: Automated categorization into 11 civic domains (Roads, Water, Electricity, Waste Management, Public Transport, Healthcare, Education, Street Lighting, Drainage, Public Safety, Other).
   - **Severity Assessment**: Ranks impact from `Low`, `Medium`, `High`, to `Critical`.
   - **Urgency Level**: Classifies urgency from `Routine`, `Soon`, `Urgent`, to `Emergency`.
   - **Facility Extraction**: Identifies affected public infrastructure (e.g., "Transformer #4", "Bus Stop").
   - **Executive Summary**: Generates concise, professional incident summaries from conversational user input.
   - **Spam & Abuse Filtering**: Detects gibberish, profanity, or irrelevant inputs, automatically tagging them as `Rejected / Spam`.

---

### 🔍 3.2 Intelligent Fuzzy Duplicate Detection & Escalation
1. **Multi-Factor Location Matching**:
   - Evaluates complaints without requiring exact word-for-word string equality.
   - **PIN Code + Landmark Matching**: Identifies shared 6-digit Indian PIN codes and area tokens (e.g., `"MG Road, Indiranagar, Jaipur 302006"` matches `"Near MG Road market, 302006"`).
   - **GPS Proximity Radius**: Coordinates within 500 meters automatically flag duplicate open issues.
   - **Token Overlap & Substrings**: Normalizes and compares meaningful landmark tokens while ignoring generic stop words (*ward, sector, road, street, near*).
2. **Unified Citizen Endorsements**:
   - Duplicate complaints are merged in-place into the original complaint rather than cluttering the system with duplicate cards.
   - New reports increment the `citizen_reports_count` (e.g., `🔥 5 Citizen Reports`).
   - Additional text and photos are preserved under **"👥 Additional Citizen Endorsements & Updates"** in the complaint timeline.
3. **Automatic Severity & Urgency Escalation**:
   - As citizen report counts pass critical thresholds ($\ge 2, \ge 3, \ge 5$ reports), severity and urgency automatically escalate to `High` or `Critical`.

---

### 🔄 3.3 Strict Grievance Lifecycle & State Machine
1. **Enforced Status Progression**:
   - System enforces valid state transitions:
     $$\text{New} \longrightarrow \text{Under Review} \Big/ \text{Assigned} \longrightarrow \text{In Progress} \longrightarrow \text{Resolved} \longrightarrow \text{Verified} \Big/ \text{Reopened}$$
   - Direct illegal transitions (e.g. `New` $\rightarrow$ `Resolved` or `New` $\rightarrow$ `Verified`) are rejected with HTTP 422 errors.
2. **Append-Only Activity Audit Trail**:
   - Immutably records every lifecycle event (`CREATED`, `STATUS_CHANGED`, `ASSIGNED`, `SLA_BREACHED`, `RESOLVED`, `VERIFIED_SATISFIED`, `REOPENED_UNSATISFIED`) in the `complaint_events` table.
   - Exposed via `GET /api/complaints/{id}/timeline` and rendered visually using the `TimelineWidget`.

---

### ⏱️ 3.4 SLA Breach Detection & Escalation Engine
1. **Dynamic SLA Target Calculation**:
   - Initial resolution deadlines calculated automatically upon complaint submission:
     - **Critical**: 24 hours
     - **High**: 48 hours
     - **Medium**: 72 hours
     - **Low**: 120 hours
2. **Automatic SLA Breach Processing**:
   - `process_sla_breaches()` automatically scans active complaints where `sla_deadline < now`.
   - Logs an `SLA_BREACHED` audit event, automatically escalates priority to `Critical` / `Emergency`, and flags active complaints.
3. **Visual Breach Indicators**:
   - Renders red `⚠️ SLA BREACHED` badges on officer dashboards and complaint cards for overdue issues.

---

### 🔑 3.5 Public Citizen Tracking Token Portal
1. **Secret Tracking Token (`TK-XXXXXXXX`)**:
   - 12-character high-entropy alphanumeric token generated upon submission.
2. **Public Track Page (`/track/:token`)**:
   - Allows citizens to track real-time resolution progress, SLA countdown timers, map pin, resolution evidence photo, and timeline events without logging in.
   - PII-sanitized public response protecting sensitive officer and citizen credentials.

---

### ✅ 3.6 Officer Resolution & Citizen Verification Workflow
1. **Proof-of-Work Resolution**:
   - Officers submit resolution notes and evidence photos (`POST /api/complaints/{id}/resolve`).
   - Base64 payload security validation enforces JPEG/PNG/WEBP/GIF MIME headers and a 5MB maximum file size limit.
2. **Citizen Satisfaction Verification**:
   - Citizens can confirm resolution (`👍 Yes, Issue Solved`) or reopen the complaint (`👎 No, Reopen Issue`) with feedback (`POST /api/complaints/{id}/verify`).
   - Anti-abuse state locks prevent repeat verification spam unless an issue is re-resolved.

---

### 📊 3.7 Analytics & Municipal Performance Dashboard
1. **KPI Summary Cards**:
   - Total Complaints, Active Issues, In Progress, Resolved Rate, and SLA Compliance Rate.
2. **Real-Time Interactive Visualizations**:
   - **Category Distribution**: Bar chart comparing complaint volumes across civic departments.
   - **Severity Breakdown**: Donut chart displaying Low / Medium / High / Critical proportions.
   - **Urgency Distribution**: Color-coded bar chart tracking response urgency levels.
3. **Spam-Filtered Metrics**:
   - All charts, KPIs, and aggregations compute exclusively from valid, non-rejected complaints.

---

### 🌐 3.8 Multilingual Support (i18n)
CivicGrid provides full UI translation across **9 languages**:
- 🇬🇧 **English (en)**
- 🇮🇳 **Hindi (hi)** — हिन्दी
- 🇮🇳 **Bengali (bn)** — বাংলা
- 🇮🇳 **Tamil (ta)** — தமிழ்
- 🇮🇳 **Telugu (te)** — తెలుగు
- 🇮🇳 **Kannada (kn)** — ಕನ್ನಡ
- 🇮🇳 **Malayalam (ml)** — മലയാളം
- 🇮🇳 **Marathi (mr)** — मराठी

---

### 🔐 3.9 Role-Based Access Control (RBAC) & Security
1. **Role Separation**:
   - **Citizen Mode**: Public access for browsing complaints, tracking via token, viewing maps, reading analytics, and submitting issues.
   - **Officer Mode**: Restricted municipal administration portal enabling assignment, status progression, resolution proof submission, and record deletion.
2. **Cryptographic Authentication**:
   - Officer passwords stored using PBKDF2 with SHA-256 and salt over 100,000 rounds.
   - In-app password change feature.
   - Zero hardcoded secrets in repository.
3. **Resilience & Protection**:
   - **SQL Injection Prevention**: Parameterized queries across all database operations.
   - **Upload Security**: MIME type header validation and 5MB payload size capping.
   - **Render Free Tier Cold-Start Recovery**: Automatic client-side retry with backoff for HTTP 502/503/504.
   - **Cross-Origin Resource Sharing (CORS)**: Configurable origin whitelists with global preflight `OPTIONS` handlers.

---

## 4. Database Schema

### 4.1 `complaints` Table
| Column Name | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Formatted identifier (e.g. `COMP-2026-0001`) |
| `raw_text` | `TEXT NOT NULL` | Original user complaint text |
| `category` | `TEXT NOT NULL` | Main civic department category |
| `subcategory` | `TEXT NOT NULL` | Specific issue classification |
| `severity` | `TEXT NOT NULL` | `Low` \| `Medium` \| `High` \| `Critical` |
| `urgency` | `TEXT NOT NULL` | `Routine` \| `Soon` \| `Urgent` \| `Emergency` |
| `location` | `TEXT NOT NULL` | Ward name, landmark, or street address |
| `affected_facility`| `TEXT NOT NULL` | Associated infrastructure |
| `summary` | `TEXT NOT NULL` | AI-generated summary |
| `status` | `TEXT NOT NULL` | Lifecycle state (`New`, `Assigned`, `In Progress`, `Resolved`, etc.) |
| `created_at` | `TEXT NOT NULL` | ISO 8601 UTC timestamp |
| `updated_at` | `TEXT NOT NULL` | ISO 8601 UTC timestamp |
| `latitude` | `REAL` | Geographic latitude |
| `longitude` | `REAL` | Geographic longitude |
| `image_url` | `TEXT` | Base64 or cloud image URI |
| `image_analysis` | `TEXT` | AI vision analysis of the scene |
| `is_duplicate` | `INTEGER` | `1` if duplicate, `0` if primary |
| `duplicate_of_id` | `TEXT` | ID of original complaint if duplicate |
| `citizen_reports_count` | `INTEGER` | Cumulative citizen support count |
| `additional_updates` | `TEXT` | JSON array of subsequent reports & updates |
| `department` | `TEXT` | Assigned municipal department |
| `ward` | `TEXT` | Municipal ward or administrative zone |
| `assigned_to` | `TEXT` | Name or ID of assigned officer |
| `sla_deadline` | `TEXT` | Target SLA resolution deadline timestamp |
| `resolved_at` | `TEXT` | Timestamp when issue was resolved |
| `tracking_token` | `TEXT` | Secret 12-character public tracking token |

### 4.2 `officers` Table
| Column Name | Type | Description |
|---|---|---|
| `officer_id` | `TEXT PRIMARY KEY` | Officer ID (e.g. `OFFICER-2026`) |
| `password_hash` | `TEXT NOT NULL` | PBKDF2-HMAC-SHA256 password hash |
| `name` | `TEXT NOT NULL` | Officer full name |
| `department` | `TEXT NOT NULL` | Assigned municipal department |
| `created_at` | `TEXT NOT NULL` | ISO 8601 UTC timestamp |

### 4.3 `complaint_events` Table
| Column Name | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Event ID (e.g. `EVT-XXXXXXXX`) |
| `complaint_id` | `TEXT NOT NULL` | Associated complaint identifier |
| `event_type` | `TEXT NOT NULL` | Event type (`CREATED`, `STATUS_CHANGED`, `ASSIGNED`, `SLA_BREACHED`, `RESOLVED`, `VERIFIED_SATISFIED`, `REOPENED_UNSATISFIED`) |
| `actor` | `TEXT NOT NULL` | Actor name or system component (`Citizen`, `Officer`, `SLA Monitor`) |
| `timestamp` | `TEXT NOT NULL` | ISO 8601 UTC timestamp |
| `metadata` | `TEXT` | Additional JSON metadata |

### 4.4 `resolutions` Table
| Column Name | Type | Description |
|---|---|---|
| `complaint_id` | `TEXT PRIMARY KEY` | Associated complaint identifier |
| `note` | `TEXT NOT NULL` | Proof-of-work resolution note |
| `evidence_image` | `TEXT` | Validated photo URI or URL |
| `submitted_at` | `TEXT NOT NULL` | ISO 8601 UTC timestamp |

### 4.5 `citizen_verifications` Table
| Column Name | Type | Description |
|---|---|---|
| `complaint_id` | `TEXT PRIMARY KEY` | Associated complaint identifier |
| `result` | `TEXT NOT NULL` | `Verified` or `Reopened` |
| `feedback` | `TEXT` | Citizen feedback comments |
| `timestamp` | `TEXT NOT NULL` | ISO 8601 UTC timestamp |

---

## 5. REST API Specification

| Method | Endpoint | Description | Auth Level |
|---|---|---|---|
| `POST` | `/api/complaints` | Submit and classify complaint | Public |
| `GET` | `/api/complaints` | Filter, search & paginate complaints | Public |
| `GET` | `/api/complaints/{id}` | Retrieve complaint by ID | Public |
| `GET` | `/api/complaints/track/{tracking_token}` | Public tracking portal lookup | Public |
| `PATCH` / `PUT`| `/api/complaints/{id}` | Update complaint status (with state validation) | Officer |
| `POST` | `/api/complaints/{id}/assign` | Assign department, ward, officer & SLA | Officer |
| `POST` | `/api/complaints/{id}/resolve` | Submit proof of work and mark Resolved | Officer |
| `POST` | `/api/complaints/{id}/verify` | Submit citizen satisfaction feedback | Public |
| `GET` | `/api/complaints/{id}/timeline` | Retrieve activity audit history log | Public |
| `DELETE` | `/api/complaints/{id}` | Permanently delete complaint | Officer |
| `GET` | `/api/complaints/stats`| Aggregate KPI & SLA compliance metrics | Public |
| `POST` | `/api/officer/login` | Authenticate municipal officer | Public |
| `POST` | `/api/officer/change-password` | Update officer password | Officer |
| `POST` | `/api/translate` | Translate text via Gemini AI | Public |
| `GET` | `/api/tts` | Native regional language audio playback stream | Public |
| `GET` | `/api/health` | Health & liveness probe | Public |

---

## 6. Verification & Quality Assurance

- **Backend Test Suite**: **37 passing unit & integration tests** (`pytest tests/`) validating schemas, state transitions, SLA breach detection, image validation, duplicate merging, SQL queries, and endpoints.
- **Frontend Build**: Production bundle builds with **0 errors in 2.15s** (`tsc -b && vite build`).
- **Deployments**: Live on **Vercel** (Frontend) and **Render** (Backend).

# CivicGrid — Complete Project

## Architecture Overview

```
CivicGrid/
├── backend/           # Python — FastAPI + SQLite + Gemini classification
│   ├── civicgrid/
│   │   ├── api.py        ← FastAPI application (HTTP endpoints)
│   │   ├── classifier.py ← Gemini/Mock classifier abstraction
│   │   ├── database.py   ← SQLite persistence layer
│   │   ├── gemini.py     ← Gemini SDK integration + retry logic
│   │   ├── models.py     ← API request/response Pydantic models
│   │   ├── prompts.py    ← Gemini prompt construction
│   │   └── schemas.py    ← AI classification schema (enums + CivicComplaint)
│   ├── tests/
│   │   ├── test_api.py      ← FastAPI endpoint tests (no Gemini needed)
│   │   └── test_gemini.py   ← Gemini unit + integration tests
│   └── data/              ← SQLite database (auto-created)
│
└── frontend/          # TypeScript — React + Vite + Ant Design + TailwindCSS
    └── src/
        ├── pages/         ← 7 pages (Landing, Dashboard, Analytics, Complaints, Detail, Submit, Settings)
        ├── components/    ← UI, layout, forms, dashboard, complaints
        ├── api/           ← API client + mock handlers
        ├── hooks/         ← React Query hooks
        ├── types/         ← TypeScript types
        └── utils/         ← Constants, helpers
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- A Gemini API key (optional — falls back to MockClassifier without one)

---

## Backend Setup

```powershell
cd backend

# Install dependencies
py -m pip install -r requirements.txt

# Copy and configure environment
Copy-Item .env.example .env
# Set GEMINI_API_KEY in .env

# Start the API server
py -m uvicorn civicgrid.api:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive API docs: `http://localhost:8000/docs`

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | For live AI | — | Google AI Studio API key |
| `GEMINI_MODEL` | No | `gemini-3.6-flash` | Model to use for classification |
| `USE_MOCK_CLASSIFIER` | No | `false` | Set `true` to force MockClassifier (no API calls) |
| `CIVICGRID_DB_PATH` | No | `data/civicgrid.db` | Path to SQLite database file |

---

## Frontend Setup

```powershell
cd frontend
npm install

# Configure environment
Copy-Item .env.example .env.local
# Set VITE_USE_MOCK_API=true for mock mode, false for real backend

# Start dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Frontend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |
| `VITE_USE_MOCK_API` | `true` | Use mock data without real backend |

---

## Running Tests

### Backend — Unit + API tests (no Gemini required)
```powershell
cd backend
py -m pytest -v
```

### Backend — Live Gemini integration tests
```powershell
cd backend
py -m pytest -v -m integration
```

### Frontend — Build check + lint
```powershell
cd frontend
npm run build
npm run lint
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/complaints` | Submit and classify a complaint |
| `GET` | `/api/complaints` | List complaints (filterable) |
| `GET` | `/api/complaints/stats` | Aggregate statistics |
| `GET` | `/api/complaints/{id}` | Get complaint by ID |
| `PATCH` | `/api/complaints/{id}` | Update complaint status |
| `GET` | `/api/health` | Health check |

### Submit a Complaint

```bash
curl -X POST http://localhost:8000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{"text": "There is a huge pothole near the bus stop in Ward 7.", "location": "Ward 7"}'
```

### Filter Complaints

```bash
curl "http://localhost:8000/api/complaints?status=New&severity=Critical&sort=highest_urgency"
```

---

## Complaint Lifecycle

```
New → Under Review → Assigned → In Progress → Resolved
```

Status can be updated via `PATCH /api/complaints/{id}` with `{"status": "In Progress"}`.

---

## Gemini Configuration

CivicGrid automatically falls back to MockClassifier when:
- `GEMINI_API_KEY` is not set
- `USE_MOCK_CLASSIFIER=true`

This means the application is fully functional without a Gemini API key — complaints are classified with sensible mock values.

### Quota Management

The free tier allows 20 requests/day. To run integration tests without hitting the quota:

```powershell
# Unit + API tests only (no Gemini calls)
py -m pytest -v

# Integration tests (uses Gemini API)
py -m pytest -v -m integration
```

---

## Troubleshooting

**Backend won't start**: Check that `GEMINI_API_KEY` is set (or set `USE_MOCK_CLASSIFIER=true`).

**pytest can't find civicgrid**: Run `py -m pytest` (not bare `pytest`) from the `backend/` directory. The `conftest.py` adds the package to `sys.path` automatically.

**CORS errors in browser**: Ensure the backend is running on port 8000 and `VITE_USE_MOCK_API=false`.

**Gemini quota exhausted**: Set `USE_MOCK_CLASSIFIER=true` in `backend/.env` to continue development without API calls.

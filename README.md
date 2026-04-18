# Cloud Computing Survey Management and Analysis System

Full-stack MERN application for district-level field survey data collection in Somalia. The system collects Somali survey responses, manages dynamic questions and sectors, exports data to Excel/CSV, and uses Python analytics for readiness scoring insights and reports.

## Stack

- Frontend: React, Vite, Tailwind CSS, Axios, React Router, Recharts
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT
- Analytics: Python, pandas, numpy, openpyxl, matplotlib-ready
- Export: Excel `.xlsx` and CSV

## Project Structure

```text
backend/
  config/ controllers/ middleware/ models/ routes/ services/ utils/
  data/defaults.js
  seed.js
frontend/
  src/api src/components src/context src/pages
analytics/
  analyze.py
  requirements.txt
```

## Local Requirements

- Node.js 18+
- Python 3.10+
- MongoDB installed locally and running
- MongoDB URL: `mongodb://127.0.0.1:27017/cloud_survey_system`

## Setup

1. Install JavaScript dependencies:

```bash
npm run install:all
```

2. Install Python dependencies:

```bash
cd analytics
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

3. Create backend environment file:

```bash
copy backend\.env.example backend\.env
```

4. Create frontend environment file:

```bash
copy frontend\.env.example frontend\.env
```

5. Seed admin, default sectors, Somali questions, and sample responses:

```bash
npm run seed
```

Default admin:

```text
Email: admin@example.com
Password: Admin@12345
```

6. Start the backend:

```bash
npm run dev:backend
```

7. Start the frontend in a second terminal:

```bash
npm run dev:frontend
```

Open:

- Public survey: `http://localhost:5173`
- Admin login: `http://localhost:5173/login`
- API health: `http://localhost:5000/api/health`

If port `5000` is already occupied on your machine, start the backend on another port and point Vite at it:

```bash
set PORT=5050&& npm.cmd run dev --prefix backend
set VITE_API_URL=http://localhost:5050/api&& npm.cmd run dev --prefix frontend -- --port 5174
```

## Core Features

- Public mobile-responsive Somali survey form
- Exact 30-question Somali survey text from the current research instrument
- Real-text answer storage: MongoDB stores `answers.q5 = "Haa"` and `answers.q8 = "Laptop"`, never option indexes
- Dynamic survey question management
- Sector management with active/inactive status
- Secure admin login with JWT
- Admin dashboard with summary cards and charts
- Searchable, filterable, paginated response table
- Individual response details and editing
- Soft delete and bulk delete for responses
- Excel and CSV export with filters
- Python analytics integration
- Readiness score and sector ranking
- Reports with print-friendly output
- Basic audit logs for admin activity

## Readiness Scoring

Each response receives a readiness score from 0 to 100 when saved. The model uses seven equally weighted factors:

- Awareness
- Technology usage
- Infrastructure availability
- Data backup practices
- Cloud tools usage
- Security trust
- Willingness to adopt

The transparent scoring logic lives in `backend/services/readinessService.js`. Scores are grouped into:

- Low: below 40
- Medium: 40 to 69
- High: 70 and above

## Survey Answer Storage

Survey responses use stable question codes and real answer text:

```json
{
  "answers": {
    "q5": "Haa",
    "q6": "Fiican",
    "q8": "Laptop",
    "q21": ["Kharash badan", "Internet liita"]
  }
}
```

Excel, CSV, dashboards, reports, and Python analytics all read the same text labels. The export module writes one respondent per row and includes all 30 Somali question columns.

## API Overview

Public:

- `GET /api/sectors`
- `GET /api/questions`
- `POST /api/responses/public`

Admin:

- `POST /api/auth/login`
- `GET /api/dashboard/stats`
- `GET/POST/PUT/DELETE /api/sectors`
- `GET/POST/PUT/DELETE /api/questions`
- `GET/POST/PUT/DELETE /api/responses`
- `POST /api/responses/bulk-delete`
- `GET /api/exports/responses.xlsx`
- `GET /api/exports/responses.csv`
- `GET /api/analytics`
- `GET /api/analytics/report`
- `GET /api/audit-logs`

## Notes for Future Development

- Add role names to `AdminUser.role` as the organization grows.
- Add refresh tokens if sessions must last longer than the current JWT expiry.
- Add a dedicated analytics cache when response volume becomes large.
- Add chart image generation from Python if downloadable PDF reports are required.

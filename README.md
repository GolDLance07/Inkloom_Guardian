# Inkloom Guardian

**Brand-Agnostic Content Governance & Real-Time Review Workbench**

Inkloom Guardian is a multi-tenant, configuration-driven governance system for evaluating content against an organization's approved guidelines, facts, terminology, claims, disclaimers, and assets. The application is completely brand-agnostic: all brands, knowledge items, findings, review snapshots, and human decisions are persisted in the database and loaded dynamically through API contracts.

---

## 1. Architecture Overview

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS (Obsidian × Electric Lime Design System based on Stitch `7506950409510271942`).
- **Backend**: Python 3.14 + FastAPI + Pydantic v2 + SQLAlchemy 2.x ORM.
- **Rules Engine**: Deterministic Python rules for prohibited terms, preferred terms, required disclaimers, and certified fact checks.
- **Optional AI Adapter**: Additive semantic review via Gemini API that fails gracefully without blocking deterministic checks.
- **Database**: PostgreSQL (Supabase) in production, with seamless SQLite support for local dev and automated tests.

---

## 2. Quickstart & Local Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   ```bash
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI backend:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
5. Run the test suite:
   ```bash
   pytest tests -v
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Stitch Project Integration (`7506950409510271942`)

The frontend faithfully reproduces the 4 desktop screens generated in Stitch:

1. **Brand Review Workbench** (`/`):
   - High-contrast plain editor with 12,000 character limit & live character counter.
   - One-click "Load sample draft" demo fixture.
   - Split 2-column view with categorized findings (Critical, Warning, Terminology), excerpt highlighting, and approved source citations.
   - Interactive "Apply suggestion" actions that patch draft copy in place.
   - **Human Governance Gate**: `Approve`, `Needs changes`, `Reject` recorded to immutable audit ledger.
   - Version History Rail tracking previous drafts and recorded decisions.
2. **Brand Knowledge Repository**:
   - Filter by rule kinds: Guidelines, Facts, Claims, Preferred Terms, Prohibited Terms, Disclaimers.
   - Real-time active status toggles and rule deletion.
   - "Add Knowledge Item" modal with rule configuration.
3. **Brand Workspace Settings**:
   - Brand profile metadata and custom color token hints.
   - Live Brand Identity preview card.
4. **Review History & Audit Log**:
   - Full audit ledger tracking all versions, reviewer labels, and human decisions.
   - Export audit telemetry to JSON.

---

## 4. API Specification (`/api/v1`)

- `GET /health`: Service health and database status.
- `GET /api/v1/brands`: List all workspaces.
- `POST /api/v1/brands`: Create a brand workspace.
- `GET /api/v1/brands/{brand_id}`: Fetch brand details.
- `PATCH /api/v1/brands/{brand_id}`: Update identity tokens.
- `GET /api/v1/brands/{brand_id}/knowledge`: List brand-scoped knowledge items.
- `POST /api/v1/brands/{brand_id}/knowledge`: Add knowledge rule.
- `POST /api/v1/reviews`: Submit content draft for deterministic & AI review.
- `GET /api/v1/reviews/{review_id}`: Fetch review snapshot.
- `POST /api/v1/reviews/{review_id}/decisions`: Record human regulatory decision.

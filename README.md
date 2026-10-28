# Inkloom Guardian

**Brand-Agnostic Content Governance & Real-Time Review Workbench**

Inkloom Guardian is a multi-tenant, configuration-driven governance system for evaluating marketing copy, press releases, and promotional content against brand-specific knowledge, approved facts, terminology requirements, prohibited claims, and required disclaimers. The platform is completely brand-agnostic: brand identities, knowledge items, review findings, suggested rewrites, and human review decisions are stored in the database and resolved dynamically through API contracts.

---

## 1. Project Overview

Inkloom Guardian provides a dedicated workbench where teams submit draft content and evaluate it against active brand guidelines. Rather than relying on generic chatbot prompts or hardcoded enterprise rules, the platform evaluates text using a hybrid sequence: instant deterministic checks for strict rules, followed by an optional, non-blocking LLM pass for semantic nuances.

---

## 2. Problem Statement

Modern organizations struggle with brand compliance and regulatory alignment across distributed marketing and content teams:
- **Manual review bottlenecks**: Legal and brand compliance teams manually review repetitive drafts for standard disclaimers, terminology violations, and factual claims.
- **LLM unreliability & hallucination**: Using generic AI prompts directly for compliance often produces ungrounded recommendations, misses exact phrase requirements, or leaks guidance across brands.
- **Fragile customer-specific hardcoding**: Many compliance tools are hardcoded to a single brand's vocabulary, making multi-brand or agency-level governance cumbersome.
- **Lack of review auditability**: Feedback given across chats or document comments is easily lost, with no structured history of drafts, findings, and human sign-offs.

---

## 3. Solution and Core Value Proposition

Inkloom Guardian addresses these challenges with:
- **Brand-agnostic architecture**: Zero customer-specific brands, products, or rules are hardcoded in the application. All behavior is driven by database-backed knowledge items.
- **Dual-engine review**: Combines regex-based deterministic checks (for zero-latency matching of prohibited terms, preferred terms, required disclaimers, and conflicting facts) with optional Gemini LLM analysis (for contextual claim assessment).
- **Additive, fail-safe AI**: Deterministic checks always run first. If the LLM times out or is unconfigured, deterministic results still return without interruption.
- **Actionable remediation**: Suggestions can be applied directly to the draft in the editor with a single click.
- **Database-backed audit trail**: Every review snapshot, finding count, engine status, and human decision is persisted to relational storage.

---

## 4. Features Currently Implemented

Features are categorized by their implementation and verification status:

| Feature | Status | Description |
| :--- | :--- | :--- |
| **Multi-Tenant Brand Workspaces** | Implemented | Create, list, inspect, and update brands with name, slug, description, industry, and visual color tokens. |
| **Brand Knowledge Repository** | Implemented | Store and categorize rules by `guideline`, `fact`, `claim`, `preferred_term`, `prohibited_term`, and `disclaimer`. Supports active/inactive toggling and deletion. |
| **Deterministic Rules Engine** | Implemented | High-precision regex matching for prohibited phrases, preferred terminology synonyms, mandatory disclaimers, and conflicting fact patterns. |
| **Optional LLM Semantic Review** | Implemented | Grounded prompt execution via Google Gemini REST API to assess claims, detect subtle violations, and draft rewrites. |
| **Fail-Safe AI Degradation** | Implemented | Automatic fallback to `rules_only` or `ai_unavailable` when LLM credentials are empty or the API fails. |
| **Interactive Review Workbench** | Implemented | Split-column workspace with live character counter, Markdown support, and categorized findings stack. |
| **One-Click Suggestion Application** | Implemented | "Apply suggestion" action patches draft text directly in the active editor. |
| **Human Decision Recording** | Implemented | Records `approved`, `needs_changes`, or `rejected` verdicts with reviewer label and audit notes. |
| **Draft Version History** | Implemented | Track successive iterations of a draft under a `ReviewGroup` with version numbers (`v1.0`, `v2.0`). |
| **Review History View** | Implemented | Searchable tabular view of past review runs, finding counts, and recorded decisions. |
| **Audit Event Logging** | Implemented | Relational `audit_events` table tracking brand creation, knowledge modifications, review runs, and human decisions. |
| **Audit Telemetry Export** | Implemented | Export brand review history and findings to structured JSON directly from the UI. |
| **Demo Fixture Seeding** | Implemented | Configurable backend seeder (`demo_brand.json`) and "Load sample draft" workbench action. |
| **Role-Based Access Control (RBAC)** | Planned | Fine-grained multi-user authentication and permission gates (currently single-tenant reviewer label string). |
| **Vector Search / Embeddings (RAG)** | Planned | Vector retrieval for enterprise catalogs with >10,000 concurrent rules. |

---

## 5. How the Review Pipeline Works

The review pipeline processes content through a strict sequence:

```text
1. Content Submission (Title, text body, selected brand ID, optional review_group_id)
   │
   ▼
2. Brand Context Resolution
   └── Loads active KnowledgeItem records strictly scoped to the selected brand_id
   │
   ▼
3. Deterministic Rule Checks (Executed first, zero network dependency)
   ├── Prohibited Terms & Claims (Word-boundary regex)
   ├── Preferred Terms & Synonyms (Disallowed colloquialisms)
   ├── Required Phrases & Disclaimers (Presence checks)
   └── Configured Fact Conflicts (Explicit conflict patterns)
   │
   ▼
4. Optional AI-Assisted Analysis (Executed only if LLM_API_KEY is configured and run_ai=True)
   ├── Serializes active brand knowledge into system prompt
   ├── Sends draft copy to Google Gemini REST API
   ├── Validates returned JSON and strips unverified knowledge item IDs
   └── Merges advisory AI findings with deterministic findings
   │
   ▼
5. Findings & Evidence Assembly
   ├── Computes Safety Score (100 minus weighted severity penalties)
   ├── Formats offending excerpts and cites approved source labels
   └── Attaches suggested replacement rewrites
   │
   ▼
6. Human Review & Remediation
   ├── Reviewer evaluates findings in the split-view workbench
   ├── Reviewer can apply suggestions directly into editor text
   └── Reviewer selects decision: Approve, Needs Changes, or Reject
   │
   ▼
7. Persistence & History Tracking
   └── Stores Review snapshot, Findings, Decisions, and Audit Events in database
```

### Coverage Notice & AI Disclaimer
- **Deterministic checks** depend strictly on configured keywords, regexes, and phrases in the database. If a rule is not configured, it will not be evaluated deterministically.
- **LLM analysis** is inherently probabilistic. Inkloom Guardian does **not** claim zero hallucinations or 100% detection of all factual inaccuracies. Coverage depends on the completeness of active brand knowledge, the clarity of the submitted draft, model behavior, and the quality of supplied evidence.

---

## 6. Technical Architecture

- **Client Layer**: Next.js 16 App Router application running in standalone mode, styled with custom Vanilla CSS tokens and Tailwind CSS (`Ivory & Navy` / `Ink & Ivory` palette). Communicates exclusively with the FastAPI backend over HTTP/JSON.
- **Application Layer**: FastAPI application implementing modular v1 routers (`/brands`, `/knowledge`, `/reviews`, `/decisions`). Stateless request lifecycle with SQLAlchemy database sessions.
- **Review Service**: Orchestrates deterministic rules engine execution, asynchronous LLM HTTP dispatch via `httpx`, score calculations, and database persistence.
- **Data Layer**: Relational schema enforced with foreign keys, cascading deletes, and indexed UUID primary keys.

---

## 7. Technology Stack

### Backend
- **Language**: Python 3.11+ (tested on Python 3.14.7)
- **Framework**: FastAPI `>=0.110.0`
- **ASGI Server**: Uvicorn `[standard] >=0.28.0`
- **Data Validation & Settings**: Pydantic v2 `>=2.6.0`, Pydantic Settings `>=2.2.0`
- **Database ORM**: SQLAlchemy 2.x `>=2.0.28`
- **PostgreSQL Driver**: `psycopg[binary] >=3.1.18`
- **HTTP Client**: `httpx >=0.27.0`
- **Testing**: `pytest >=8.0.0`

### Frontend
- **Framework**: Next.js `16.4.3` (App Router, Turbopack)
- **UI Library**: React `19.3.0`
- **Styling**: Tailwind CSS `^4`, `@tailwindcss/turbopack`, Vanilla CSS design system
- **Icons & Typography**: Material Symbols Outlined, Newsreader, Space Grotesk, Plus Jakarta Sans, Inter, JetBrains Mono
- **Language**: TypeScript `^5`

---

## 8. Repository Structure

```text
Inkloom_Guardian/
├── README.md                           # Project documentation
├── .gitignore                          # Git ignore definitions
├── docker-compose.yml                  # Multi-container orchestration
├── railway.json                        # Railway deployment configuration
├── render.yaml                         # Render blueprint specification
├── koyeb.yaml                          # Koyeb deployment manifest
├── backend/
│   ├── Dockerfile                      # Production Python container
│   ├── Procfile                        # Process manager definition
│   ├── requirements.txt                # Pinned Python dependencies
│   ├── .env.example                    # Backend environment template
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint & lifespan
│   │   ├── config.py                   # Pydantic Settings configuration
│   │   ├── db.py                       # SQLAlchemy engine & session factory
│   │   ├── api/v1/                     # API routers (brands, knowledge, reviews, decisions)
│   │   ├── models/base.py              # Relational database models
│   │   ├── schemas/base.py             # Pydantic request & response schemas
│   │   ├── services/
│   │   │   ├── rules_engine.py         # Deterministic rule verification checks
│   │   │   ├── llm_provider.py         # Gemini LLM adapter & ID validation
│   │   │   ├── review_service.py       # Review orchestration & scoring
│   │   │   └── audit_service.py        # Audit event logger
│   │   └── seed/                       # Demo fixture definitions & seeder
│   └── tests/
│       └── test_api.py                 # Automated pytest suite
└── frontend/
    ├── Dockerfile                      # Multi-stage production container
    ├── package.json                    # Scripts and dependencies
    ├── next.config.ts                  # Next.js configuration (standalone output)
    ├── tsconfig.json                   # TypeScript configuration
    ├── .env.example                    # Frontend environment template
    ├── app/                            # Next.js App Router (layout, page, styles)
    ├── components/                     # UI components & views
    └── lib/                            # API client (`api.ts`) and types (`types.ts`)
```

---

## 9. Prerequisites

- **Python**: Version 3.11 or higher (Python 3.14 verified)
- **Node.js**: Version 18.x or higher (Node.js 20+ recommended)
- **Package Managers**: `pip` and `npm`
- **Database**: PostgreSQL (e.g., Neon, Supabase) or local SQLite (default fallback)
- **API Key (Optional)**: Google Gemini API key (for AI-assisted semantic review)

---

## 10. Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/GolDLance07/Inkloom_Guardian.git
cd Inkloom_Guardian
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

Edit `backend/.env` with your settings (see [Environment Variables](#11-environment-variables)).

Start the backend server:
```bash
python -m uvicorn app.main:app --reload --port 8000
```
Verify the API is running at [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health).

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

Ensure `frontend/.env.local` points to your backend:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Start the frontend development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 11. Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `APP_ENV` | No | `development` | Environment mode (`development`, `production`, `test`). |
| `DATABASE_URL` | No | `sqlite:///./inkloom.db` | Connection string for PostgreSQL or SQLite. |
| `CORS_ORIGINS` | No | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated list of allowed CORS origins. |
| `LLM_PROVIDER` | No | `""` | LLM provider identifier (`gemini`). |
| `LLM_API_KEY` | No | `""` | Google Gemini API key. If omitted, AI checks are safely skipped. |
| `LLM_MODEL` | No | `gemini-1.5-flash` | Gemini model name. (See note below). |
| `LLM_TIMEOUT_SECONDS`| No | `20` | Request timeout in seconds (minimum 30s enforced in client). |
| `MAX_CONTENT_CHARS` | No | `12000` | Maximum allowable character length for submitted drafts. |
| `ENABLE_DEMO_SEED` | No | `true` | Automatically seeds demo brand and knowledge on startup. |

> **Important Model Note**: The default model configured in code is `gemini-1.5-flash`. While `gemini-2.0-flash` is also supported, unverified identifiers such as `gemini-3.6-flash` will cause the Gemini REST API to return HTTP 404 (model not found), triggering a graceful fallback to rules-only mode.

### Frontend Configuration (`frontend/.env.local`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:8000` | Base URL of the FastAPI backend (trailing slash automatically stripped). |

---

## 12. Database Configuration

Inkloom Guardian supports both PostgreSQL and SQLite through SQLAlchemy:
- **Automatic Migration / Initialization**: On application startup, `init_db()` is invoked via FastAPI lifespan, running `Base.metadata.create_all()` to ensure all tables exist.
- **PostgreSQL**: Supports standard `postgresql://` and `postgres://` connection URIs. The application automatically adapts them to the `postgresql+psycopg://` dialect driver.
- **SQLite**: Local SQLite (`sqlite:///./inkloom.db`) is used by default when `DATABASE_URL` is omitted, with `check_same_thread=False` configured.

---

## 13. Running Frontend and Backend

### Option A: Standard Terminal Workflow
- **Backend**: `python -m uvicorn app.main:app --port 8000` (from `backend/` with active virtual environment)
- **Frontend**: `npm run dev` (from `frontend/`)

### Option B: Docker Compose (Self-Hosted)
Run both services in containers with a single command:
```bash
docker compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)

---

## 14. API Endpoints Verified from the Code

All endpoints are registered under `/` and `/api/v1`:

### System & Health
- `GET /` & `GET /health` & `GET /api/v1/health`: Returns API health status, database connection status, and whether AI is enabled.
- `GET /api/v1/demo/fixture`: Returns demo brand slug and sample draft text if `ENABLE_DEMO_SEED=true`.

### Brands (`/api/v1/brands`)
- `GET /api/v1/brands?include_demo=true`: List all brand workspaces.
- `POST /api/v1/brands`: Create a brand workspace (`name`, `description`, `industry`, `logo_url`, `visual_config`).
- `GET /api/v1/brands/{brand_id}`: Fetch brand workspace details.
- `PATCH /api/v1/brands/{brand_id}`: Update brand metadata and visual configuration.

### Knowledge Items (`/api/v1/brands/{brand_id}/knowledge`)
- `GET /api/v1/brands/{brand_id}/knowledge?kind={kind}&active_only={bool}`: List knowledge rules.
- `POST /api/v1/brands/{brand_id}/knowledge`: Create a new knowledge item.
- `PATCH /api/v1/brands/{brand_id}/knowledge/{item_id}`: Update a knowledge item or toggle active status.
- `DELETE /api/v1/brands/{brand_id}/knowledge/{item_id}?permanent={bool}`: Deactivate (`permanent=false`) or permanently delete (`permanent=true`) a knowledge item.

### Reviews & Review Groups (`/api/v1`)
- `POST /api/v1/reviews`: Submit a content draft for evaluation.
  - Body: `{"brand_id": "...", "title": "...", "content": "...", "review_group_id": null, "run_ai": true}`
  - Returns complete `ReviewResponse` with version number, summary scores, and findings list.
- `GET /api/v1/reviews/{review_id}`: Retrieve a stored review snapshot with findings and latest decision.
- `GET /api/v1/review-groups/{group_id}/history`: Retrieve all versioned reviews under a draft group.

### Decisions (`/api/v1/reviews/{review_id}/decisions`)
- `POST /api/v1/reviews/{review_id}/decisions`: Record a human decision (`approved`, `needs_changes`, `rejected`).

---

## 15. Example Content-Review Workflow

1. **Select or Create Brand**: User chooses "Acme Enterprise Core" from the sidebar dropdown.
2. **Inspect Brand Knowledge**: In "Brand Knowledge", user inspects approved facts (e.g., active in 94 countries) and prohibited phrases (e.g., "guaranteed zero foreign exchange risk").
3. **Submit Content**: In "Review", user pastes a draft:
   > *"Acme Enterprise Core provides zero-latency settlements with guaranteed zero foreign exchange risk across 140 countries."*
4. **Trigger Evaluation**: User clicks "Check content".
5. **Inspect Findings**:
   - Critical: Prohibited claim "guaranteed zero foreign exchange risk" flagged with SEC-RULE-156 citation.
   - Critical: Factual conflict "across 140 countries" flagged against certified KB-GEO fact (94 jurisdictions).
6. **Apply Remediations**: User clicks "Apply suggestion" on each finding, updating the editor text in place to compliant alternatives.
7. **Re-evaluate**: User clicks "Check content" to generate version `v2.0`.
8. **Record Decision**: With issues resolved, the reviewer clicks "Approve" in the Human Governance Gate.

---

## 16. AI Review and Deterministic Checks

Inkloom Guardian uses a hybrid verification architecture:

| Aspect | Deterministic Rules Engine | LLM Semantic Review (Gemini) |
| :--- | :--- | :--- |
| **Execution** | Synchronous, local regex/string parsing | Asynchronous REST call to Gemini API |
| **Speed** | Sub-millisecond | Typically 1.5 – 4.0 seconds |
| **Reliability** | 100% predictable; zero hallucinations | Contextual; dependent on model output quality |
| **Scope** | Prohibited words, preferred terms, required disclaimer presence, explicit fact conflict regexes | Unverified claims, tone discrepancies, subtle policy nuances, contextual rewrites |
| **Failure Behavior** | Fails only on code/regex syntax error | Fails safely to `ai_unavailable`; logs warning; never blocks review |
| **Source Tag** | Marked as `source_type: "rule"` (`Deterministic check`) | Marked as `source_type: "ai"` (`AI-assisted`) |

---

## 17. Brand-Specific Knowledge and Isolation

- **Tenant Boundary**: All `KnowledgeItem`, `ReviewGroup`, `Review`, `Finding`, and `Decision` records have a foreign key pointing to `brands.id`.
- **Query Scoping**: Review execution queries *only* active knowledge items matching `KnowledgeItem.brand_id == brand_id`.
- **Cross-Brand Leakage Protection**:
  - The deterministic engine never loads rules from other brands.
  - The LLM prompt receives only knowledge items belonging to the active brand.
  - An ID validation guard in `llm_provider.py` discards any finding referencing a `knowledge_item_id` that does not exist in the active brand's query set.

---

## 18. Suggested Rewrites and Review Decisions

- **Suggested Rewrites**: Both deterministic checks (via `replacement` in `rule_config`) and AI findings generate suggested rewrite strings. The frontend detects these and renders an "Apply suggestion" button that replaces the offending excerpt inside the draft editor.
- **Review Decisions**: Human sign-off is recorded with a verdict (`approved`, `needs_changes`, `rejected`), a reviewer label, an optional remediation note, and a timestamp. Decisions are linked to the review version and logged to the audit events table.

---

## 19. Testing and Verification

### Automated Test Suite
The automated test suite in `backend/tests/test_api.py` was executed and verified:
- **Command**: `python -m pytest tests -v`
- **Result**: `2 passed in ~39s` (against live Neon PostgreSQL).
- **Coverage in Automated Suite**:
  - Health check endpoint verification (`test_health`).
  - Full brand lifecycle: Brand creation, knowledge item insertion (prohibited and preferred terms), draft review execution, finding generation, human decision recording, and brand-isolation verification between Brand X and Brand Y (`test_brand_lifecycle_and_review_flow`).

### Frontend Production Build
The Next.js frontend production bundle was compiled and verified:
- **Command**: `npm run build`
- **Result**: Exited code 0; TypeScript compilation and static page generation completed with 0 errors.

### Manual Verification Results Reported by Developer
The following individual scenarios were manually tested by the project developer:
1. Detection of risky 24-hour product-results claims.
2. Draft containing approved 10% active concentration passing the fact check.
3. Verification of required disclaimer presence.
4. Application of suggested rewrites removing prohibited guarantee wording.
5. Review persistence and version navigation in review history.
6. Verification that knowledge configured in Brand A does not trigger findings in Brand B.

---

## 20. Deployment Guidance

### Deploying Backend to Render / Koyeb
1. Connect the GitHub repository `GolDLance07/Inkloom_Guardian`.
2. Set Root Directory to `backend`.
3. Provide environment variables:
   - `DATABASE_URL`: PostgreSQL connection string with SSL.
   - `LLM_API_KEY`: Google Gemini API key (optional).
   - `LLM_MODEL`: `gemini-1.5-flash`.
   - `CORS_ORIGINS`: `*` (or your frontend domain).
   - `APP_ENV`: `production`.
4. Build command: `pip install -r requirements.txt`.
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. Health check path: `/health`.

### Deploying Frontend to Vercel
1. Import `GolDLance07/Inkloom_Guardian` on Vercel.
2. Set Root Directory to `frontend`.
3. Framework preset: `Next.js`.
4. Environment variable:
   - `NEXT_PUBLIC_API_BASE_URL`: URL of the deployed backend (e.g., `https://api.yourdomain.com`).
5. Click **Deploy**.

---

## 21. Known Limitations

1. **Single-User Reviewer Identity**: Human decisions record an arbitrary string label (e.g., "Demo reviewer", "Admin Guardian"); individual user authentication and session management are not yet implemented.
2. **Plain-Text Content Limit**: Content review accepts plain text and Markdown; direct upload and parsing of PDF, Word (.docx), or HTML files is not currently supported.
3. **Exact & Regex Fact Matching**: Deterministic fact checking requires explicit `conflict_patterns` regexes configured in rule metadata. Dynamic numerical range comparison is handled by the LLM.
4. **Prompt Context Limits**: The entire active knowledge set for a brand is serialized into the LLM prompt. Brands with hundreds of extensive knowledge records may encounter latency or context window bounds.

---

## 22. Future Roadmap

- **Vector Search & Embeddings (RAG)**: Indexing brand guidelines in pgvector for semantic retrieval when brand rulebooks exceed prompt context limits.
- **Multi-Modal Asset Checking**: OCR and layout checking for trademarks, logos, and disclaimer font size compliance in marketing images.
- **Automated Rule Regression Suite**: Batch-testing historical drafts against updated or newly added knowledge items to verify review consistency.
- **Enterprise Authentication (SSO / RBAC)**: Integrating OAuth2/OIDC and role-based permissions (Reviewer, Brand Lead, Legal Admin).

---

## 23. Contribution and Development Workflow

1. Fork or branch from `main`.
2. Ensure backend tests pass:
   ```bash
   cd backend
   python -m pytest tests -v
   ```
3. Ensure frontend builds cleanly:
   ```bash
   cd frontend
   npm run build
   ```
4. Follow brand-agnostic design principles: Never hardcode brand names, products, or rule findings in shared UI components or backend review services.

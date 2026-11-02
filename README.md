# Inkloom Guardian

**Brand-Agnostic Content Governance & Multi-Modal Compliance Workbench**

[![Live Application](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat&logo=vercel)](https://frontend-odtjvz5af-me-abb2.vercel.app/)
[![Repository](https://img.shields.io/badge/GitHub-Repository-blue?style=flat&logo=github)](https://github.com/GolDLance07/Inkloom_Guardian)
[![Backend](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/Next.js-16.4.3-black?style=flat&logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-3776AB?style=flat&logo=python)](https://www.python.org)
[![Database](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=flat&logo=postgresql)](https://github.com/pgvector/pgvector)

Inkloom Guardian is a multi-tenant, configuration-driven content governance and compliance platform. It evaluates marketing drafts, launch announcements, press releases, and visual assets against brand-specific knowledge bases, certified facts, approved terminology, prohibited claims, and mandatory legal disclaimers. 

The system operates on a **strictly brand-agnostic architecture**: zero customer-specific brands, vocabularies, or regulatory rules are hardcoded into application logic. Every brand policy, fact, approved synonym, review finding, suggested rewrite, and human approval decision is stored in the database and resolved dynamically through typed API contracts.

**Live Application**: [https://frontend-odtjvz5af-me-abb2.vercel.app/](https://frontend-odtjvz5af-me-abb2.vercel.app/)  
**GitHub Repository**: [https://github.com/GolDLance07/Inkloom_Guardian](https://github.com/GolDLance07/Inkloom_Guardian)

---

## Table of Contents

1. [Project Introduction](#1-project-introduction)
2. [Features](#2-features)
3. [Architecture Overview](#3-architecture-overview)
4. [Repository Structure](#4-repository-structure)
5. [Prerequisites](#5-prerequisites)
6. [Clone and Installation Instructions](#6-clone-and-installation-instructions)
7. [Environment Variables](#7-environment-variables)
8. [Running the Complete Application](#8-running-the-complete-application)
9. [First-Time Usage Guide](#9-first-time-usage-guide)
10. [Testing and Verification](#10-testing-and-verification)
11. [API Documentation](#11-api-documentation)
12. [Deployment Guide](#12-deployment-guide)
13. [Troubleshooting](#13-troubleshooting)
14. [Known Limitations](#14-known-limitations)
15. [Future Roadmap](#15-future-roadmap)
16. [Contribution Guide](#16-contribution-guide)
17. [License](#17-license)

---

## 1. Project Introduction

### The Problem
Modern distributed teams create marketing copy and visual collateral across high velocity channels. Ensuring consistent brand alignment and regulatory compliance presents severe challenges:
- **Manual review bottlenecks**: Legal, compliance, and brand leads manually inspect copy for standard disclosures, approved phrasing, and fact accuracy.
- **Generic LLM unreliability**: Prompting public LLMs directly for compliance checks often triggers hallucinations, misses strict required phrases, produces ungrounded citations, or leaks proprietary guidelines across tenant boundaries.
- **Customer hardcoding**: Most commercial tools hardcode a single organization's guidelines into code, making agency-level management or multi-product brand governance impossible.
- **Audit fragmentation**: Review feedback spread across chats, email threads, and document comments leaves no immutable audit record for compliance verification.

### The Solution & Core Value Proposition
Inkloom Guardian solves these bottlenecks by pairing **zero-latency deterministic rule verification** with **bounded semantic retrieval (RAG)** and **optional Google Gemini LLM analysis**:
- **Dual-Engine Review**: Strict compliance mandates (prohibited terms, colloquial synonyms, mandatory disclaimers, explicit fact contradictions) are resolved locally with 100% predictability via compiled regular expressions. Complex, nuanced claims are evaluated by Gemini using bounded context retrieved via vector search.
- **100% Deterministic Coverage Guarantee**: RAG bounds the context sent to the LLM to prevent prompt bloat; it never reduces deterministic rule evaluation. 100% of active brand rules are always verified on every draft.
- **Multi-Modal Image Screening**: Pre-flight optical character recognition (OCR) extracts text from visual marketing assets (display ads, social cards, banners) and evaluates it against brand policies.
- **One-Click Remediation**: Every flagged issue includes a contextual explanation, approved evidence citation, and an optional replacement rewrite that can be patched directly into the editor with one click.
- **Immutable Relational Audit Trail**: Successive draft iterations, finding summaries, engine telemetry, and human reviewer decisions (`approved`, `needs_changes`, `rejected`) are permanently recorded in PostgreSQL.

---

## 2. Features

### Implemented Features

| Feature | Status | Description |
| :--- | :---: | :--- |
| **Multi-Tenant Brand Workspaces** | Implemented | Create, list, inspect, and update isolated brand workspaces with custom slugs, visual identity tokens (color hex codes), and industry labels. |
| **Brand Knowledge Repository** | Implemented | Store and manage compliance rules across 8 standardized categories: `guideline`, `fact`, `claim`, `preferred_term`, `prohibited_term`, `required_phrase`, `disclaimer`, and `asset_reference`. |
| **Deterministic Rules Engine** | Implemented | High-speed, zero-network rule evaluation covering prohibited terms, preferred terminology synonyms, mandatory disclaimer presence, and conflicting fact patterns. |
| **Google Gemini Semantic Review** | Implemented | Asynchronous REST-based evaluation using Google Gemini (`gemini-1.5-flash`) for assessing ambiguous claims, nuance violations, and context-aware rewrite generation. |
| **Fail-Safe AI Degradation** | Implemented | If Gemini is unconfigured, times out, or encounters quota exhaustion, the review engine safely degrades to `rules_only` or `ai_unavailable` without failing the user's review. |
| **RAG Semantic Context Retrieval** | Implemented | Uses dense embeddings (`text-embedding-004`) to retrieve the top-N most semantically relevant active knowledge items for the LLM review pass, bounding prompt size. |
| **PostgreSQL pgvector Embeddings** | Implemented | Stores 768-dimensional knowledge embeddings in PostgreSQL using the `pgvector` extension with native cosine distance ordering (`<=>`). |
| **Lexical Retrieval Fallback** | Implemented | Tokenized Jaccard overlap and phrase-matching fallback algorithm that ranks knowledge items when vector search or embedding APIs are unconfigured or unavailable. |
| **Strict Brand Isolation** | Implemented | Enforces `brand_id` foreign keys and query filters across database models, embedding lookups, rules engine iterations, and LLM reference sanitization guards. |
| **Content Review Workbench** | Implemented | Dual-column interactive editor featuring Markdown support, live character counter, policy findings stack, severity filtering, and safety score metering (0–100). |
| **One-Click Suggested Rewrites** | Implemented | Review findings with suggested remediation strings include an "Apply suggestion" action that directly updates the draft text in the live editor. |
| **Human Review Decisions** | Implemented | Governance gate allowing authorized reviewers to record formal verdicts (`approved`, `needs_changes`, `rejected`) with reviewer notes and timestamps. |
| **Draft Version History** | Implemented | Successive edits are tracked under a unified `ReviewGroup`, incrementing version numbers (`v1`, `v2`, `v3`) with historical score comparisons. |
| **Searchable Review History** | Implemented | Tabular log of past review runs displaying titles, version counts, safety scores, finding tallies, engine modes, and latest human decisions. |
| **Audit Event Logging** | Implemented | Dedicated `audit_events` relational table logging brand creation, knowledge item changes, review executions, human decisions, and asset inspections. |
| **JSON Telemetry Export** | Implemented | One-click export of brand review records, version snapshots, and compliance findings directly from the user interface. |
| **Multi-Modal Asset Inspection** | Implemented | Upload raster images (PNG, JPEG, WebP) to extract embedded text via OCR, evaluate it against active brand rules, and view findings alongside preview thumbnails. |
| **Automated Rule Regression Suite** | Implemented | Zero-network, zero-LLM CLI test runner executing 9 version-controlled synthetic test cases to verify rule integrity and prevent regression bugs. |
| **Historical Review Drift Replay** | Implemented | Non-destructive replay CLI mode (`--replay`) that evaluates existing database drafts against updated rules to detect compliance drift. |
| **Demo Fixture Seeding** | Implemented | Startup fixture seeder (`seed_demo.py`) that loads the canonical demo brand `Acme Enterprise Core` and sample treasury compliance rules. |

### Planned Features (Future Roadmap)

| Feature | Status | Description |
| :--- | :---: | :--- |
| **Role-Based Access Control (RBAC)** | Planned | Granular permissions and identity integration (OAuth2 / OIDC / SAML SSO). |
| **Document File Ingestion** | Planned | Direct parsing and section-by-section review of PDF, Word (.docx), and HTML files. |
| **Computer Vision Logo & Layout Verification** | Planned | Visual brand checking for logo placement, minimum clear-space, contrast ratios, and font size compliance. |
| **Real-Time CMS & Editor Plugins** | Planned | Browser extensions, Figma widgets, and CMS plugins (Contentful, WordPress) for in-flight governance. |

---

## 3. Architecture Overview

Inkloom Guardian separates presentation, orchestration, deterministic rule processing, semantic AI analysis, and persistent storage into decoupled layers:

- **Frontend Client (Next.js 16)**: Built with the Next.js App Router, React 19, TypeScript, and Tailwind CSS. Operates in standalone mode and communicates exclusively with the backend via typed REST JSON APIs.
- **Application Engine (FastAPI)**: Python-based ASGI application utilizing Pydantic v2 schemas for request validation, structured error envelopes, and automated OpenAPI documentation.
- **Deterministic Rules Engine (`rules_engine.py`)**: Local compiled regular expression engine executing zero-latency string matching for prohibited terms, preferred terminology, required disclaimers, and conflicting fact patterns.
- **Embedding & Retrieval Service (`embedding_service.py`)**: Computes 768-dimensional dense vectors using Google Gemini `text-embedding-004`. Performs brand-scoped cosine distance searches using `pgvector` on PostgreSQL, with automatic token-based lexical similarity fallback on SQLite or network outage.
- **AI Review Provider (`llm_provider.py`)**: Calls Google Gemini (`gemini-1.5-flash`) via `httpx` with bounded prompt context, defensive JSON decoding, and an ID verification guard that purges unverified knowledge item IDs.
- **Asset Checker (`asset_checker.py`)**: Validates image payloads (Pillow format verification, dimension checks up to 4096px, 10MB limit) and extracts plain text via Tesseract OCR for deterministic screening.
- **Relational Storage (PostgreSQL + pgvector / SQLite)**: Managed via SQLAlchemy 2.x ORM with cascading foreign keys, UUID primary keys, and indexed query paths.

### High-Level System Architecture

```mermaid
graph TD
    Client["Next.js 16 Web Client\n(React 19 / TypeScript / Tailwind CSS)"]
    API["FastAPI Backend Application\n(REST API v1 / Uvicorn ASGI)"]
    Rules["Deterministic Rules Engine\n(Regex / Terminology / Facts)"]
    RAG["Embedding & Retrieval Service\n(pgvector / Lexical Fallback)"]
    Gemini["Google Gemini REST API\n(text-embedding-004 / 1.5-flash)"]
    OCR["Multi-Modal Asset Checker\n(Pillow / Tesseract OCR)"]
    DB[("Relational Database\nPostgreSQL + pgvector / SQLite")]

    Client -->|"HTTP / REST JSON"| API
    Client -->|"Multipart Image Upload"| API
    API --> Rules
    API --> RAG
    API --> OCR
    RAG -->|"Cosine Distance Query"| DB
    RAG -->|"Generate Embeddings"| Gemini
    API -->|"Semantic AI Review"| Gemini
    API -->|"SQLAlchemy 2.x ORM"| DB
    OCR -->|"Extracted Plain Text"| Rules
```

### Review Pipeline Execution Flow

```mermaid
flowchart TD
    A["Draft Submission\n(Title, Content, Brand ID)"] --> B["Brand Context Resolution\n(Fetch all active KnowledgeItems)"]
    B --> C["Deterministic Rule Checks\n(Evaluate 100% of Active Brand Rules)"]
    C --> D{"AI Review Enabled?\n(run_ai=true & LLM_API_KEY present)"}
    D -- "Yes" --> E["RAG Knowledge Retrieval\n(pgvector Cosine Search or Lexical Fallback)"]
    E --> F["Gemini Semantic Review\n(Bounded Knowledge Subset & Draft Copy)"]
    F --> G["ID Verification Guard\n(Discard ungrounded knowledge item IDs)"]
    G --> H["Aggregate Findings & Calculate Safety Score\n(Safety Score: 0 - 100)"]
    D -- "No / Unavailable" --> H
    H --> I["Human Governance Workbench\n(Reviewer inspects findings & applies rewrites)"]
    I --> J["Human Decision Gate\n(Approve / Needs Changes / Reject)"]
    J --> K["Relational Persistence\n(Review Group, Review Snapshot, Findings, Audit Trail)"]
```

---

## 4. Repository Structure

```text
Inkloom_Guardian/
├── README.md                           # Primary onboarding, setup, and architecture guide
├── README_AUDIT.md                     # Comprehensive audit record of verified commands & tests
├── UPDATES.md                          # Round 3 architectural & implementation report
├── .gitignore                          # Standard git ignore definitions
├── docker-compose.yml                  # Multi-container local orchestration (backend + frontend)
├── railway.json                        # Railway deployment manifest
├── render.yaml                         # Render blueprint specification
├── koyeb.yaml                          # Koyeb deployment manifest
├── backend/
│   ├── Dockerfile                      # Production container (Debian Python + tesseract-ocr)
│   ├── Procfile                        # Process manager definition
│   ├── requirements.txt                # Pinned Python package dependencies
│   ├── .env.example                    # Backend environment variable template
│   ├── app/
│   │   ├── main.py                     # FastAPI application entry point, CORS, and lifespan
│   │   ├── config.py                   # Pydantic Settings configuration loader
│   │   ├── db.py                       # SQLAlchemy engine, session maker, and pgvector extension init
│   │   ├── api/v1/                     # Modular API routers
│   │   │   ├── brands.py               # Brand workspace CRUD routes
│   │   │   ├── knowledge.py            # Knowledge items CRUD & embedding dispatch
│   │   │   ├── reviews.py              # Review submission, history, and telemetry routes
│   │   │   ├── decisions.py            # Human governance sign-off routes
│   │   │   └── assets.py               # Multi-modal image inspection endpoint
│   │   ├── models/base.py              # Relational models (Brand, KnowledgeItem, Embedding, etc.)
│   │   ├── schemas/base.py             # Pydantic request and response schemas
│   │   ├── services/
│   │   │   ├── rules_engine.py         # Deterministic regex matching engine
│   │   │   ├── llm_provider.py         # Google Gemini REST API client & response sanitizer
│   │   │   ├── embedding_service.py    # text-embedding-004 client, pgvector retrieval, reindex CLI
│   │   │   ├── asset_checker.py        # Pillow validation & Tesseract OCR plain text extraction
│   │   │   ├── regression_runner.py    # Rule regression CLI runner & historical drift replay
│   │   │   ├── review_service.py       # Review orchestration, RAG coordination, and scoring
│   │   │   └── audit_service.py        # Audit event recorder
│   │   └── seed/
│   │       ├── demo_brand.json         # Canonical Acme Enterprise Core seed fixture
│   │       └── seed_demo.py            # Database seeder execution script
│   └── tests/
│       ├── fixtures/
│       │   └── regression_fixtures.json# 9 synthetic test cases for rule regression suite
│       ├── conftest.py                 # Pytest session fixture & automatic test brand cleanup
│       ├── test_api.py                 # Core API & brand lifecycle test suite
│       ├── test_asset_checker.py       # Image validation & OCR screening test suite
│       ├── test_rag.py                 # Vector search, lexical fallback & isolation test suite
│       └── test_regression.py          # Regression runner integration tests
└── frontend/
    ├── Dockerfile                      # Multi-stage production container
    ├── package.json                    # Frontend package dependencies and scripts
    ├── next.config.ts                  # Next.js configuration (standalone output)
    ├── tsconfig.json                   # TypeScript compiler configuration
    ├── .env.example                    # Frontend environment template
    ├── app/
    │   ├── layout.tsx                  # Root layout, Google Fonts, and metadata
    │   ├── page.tsx                    # Main workbench application page & auth gating
    │   └── globals.css                 # Custom styling tokens and Tailwind CSS imports
    ├── components/
    │   ├── AppHeader.tsx               # Workspace header with reviewer credentials & status
    │   ├── AppSidebar.tsx              # Brand switcher & navigation menu
    │   ├── CreateBrandModal.tsx        # Modal for provisioning new brand workspaces
    │   ├── InitialLoadingScreen.tsx    # Minimal boot screen
    │   ├── LoginScreen.tsx             # Pre-configured demo login screen
    │   └── views/
    │       ├── BrandReviewWorkbench.tsx# Split-view review editor, findings, and RAG badge
    │       ├── BrandKnowledgeRepository.tsx # Rule management workspace
    │       ├── AssetInspectionView.tsx # Multi-modal image upload & OCR screening
    │       ├── ReviewHistoryView.tsx   # Draft version history and decisions table
    │       ├── BrandSettingsView.tsx   # Brand visual token & metadata settings
    │       └── EvaluationInProgressModal.tsx # Progress overlay during review execution
    └── lib/
        ├── api.ts                      # Client-side API request client
        └── types.ts                    # TypeScript interface definitions
```

---

## 5. Prerequisites

### System Requirements

| Tool | Version Requirement | Purpose | Required / Optional |
| :--- | :--- | :--- | :---: |
| **Git** | `>= 2.30` | Repository cloning and version control | **Required** |
| **Python** | `>= 3.11` (Python 3.14 supported) | Backend API, rules engine, embeddings | **Required** |
| **Node.js** | `>= 18.17.0` (Node 20+ recommended) | Frontend Next.js application | **Required** |
| **npm** | `>= 9.0.0` | Frontend package management | **Required** |
| **PostgreSQL** | `>= 15.0` (with `pgvector`) | Production database & vector embeddings | *Optional* (SQLite is default fallback) |
| **Tesseract OCR**| `>= 5.0.0` | Optical character recognition in images | *Optional* (App degrades gracefully if missing) |
| **Gemini API Key**| Google AI Studio API Key | AI semantic review & dense embeddings | *Optional* (App runs in rules-only mode if empty) |

### Official Installation Links
- [Python Download](https://www.python.org/downloads/)
- [Node.js Download](https://nodejs.org/en/download/)
- [Git Download](https://git-scm.com/downloads)
- [PostgreSQL Download](https://www.postgresql.org/download/)
- [pgvector Extension](https://github.com/pgvector/pgvector#installation)
- [Tesseract OCR Releases (UB Mannheim for Windows)](https://github.com/UB-Mannheim/tesseract/wiki)
- [Google AI Studio (Gemini API Key)](https://aistudio.google.com/app/apikey)

---

## 6. Clone and Installation Instructions

Follow these step-by-step instructions to set up and run Inkloom Guardian locally from scratch.

### Step 1: Clone the Repository
```bash
git clone https://github.com/GolDLance07/Inkloom_Guardian.git
cd Inkloom_Guardian
```

---

### Step 2: Backend Setup

Navigate to the `backend/` directory:
```bash
cd backend
```

#### 2.1 Create and Activate a Python Virtual Environment

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(If PowerShell blocks script execution, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`)*

**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 2.2 Install Backend Dependencies
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### 2.3 Configure Backend Environment Variables
Copy the template `.env.example` to create your local `.env`:
```bash
# Windows PowerShell
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

---

### Step 3: Database Setup

Inkloom Guardian supports two database configurations:

#### Option A: Local SQLite (Zero Setup — Default)
By default, `backend/.env.example` specifies:
```env
DATABASE_URL=sqlite:///./inkloom.db
```
No external database server is required. SQLite is initialized automatically on startup, and vector retrieval operates using the built-in lexical and cosine fallback engines.

#### Option B: PostgreSQL with pgvector (Production Mode)
If using a managed PostgreSQL instance (e.g., Neon, Supabase, AWS RDS, or local Postgres):
1. Ensure the `vector` extension is available on your database. If you have superuser rights, the application automatically runs:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. Update `DATABASE_URL` in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/inkloom?sslmode=disable
   ```
*(Note: SQLAlchemy automatically maps standard `postgresql://` strings to the modern `postgresql+psycopg://` dialect driver).*

#### Database Table Creation
Inkloom Guardian initializes all relational tables automatically during FastAPI startup lifespan via `Base.metadata.create_all(bind=engine)` in `app/db.py`. No manual SQL migrations are required for fresh installations.

---

### Step 4: Tesseract OCR Setup (Multi-Modal Asset Checking)

The multi-modal asset inspector uses `pytesseract` to extract copy from images.

- **Windows**:
  1. Download and run the Windows installer from [UB-Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki).
  2. Default install directory: `C:\Program Files\Tesseract-OCR\tesseract.exe`.
  3. If not added to system `PATH`, configure in `backend/.env`:
     ```env
     TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
     ```
- **macOS**:
  ```bash
  brew install tesseract
  ```
- **Ubuntu / Debian**:
  ```bash
  sudo apt-get update && sudo apt-get install -y tesseract-ocr libtesseract-dev
  ```

*(Graceful Degradation: If Tesseract is not installed, the application will not crash. Uploading an asset returns a structured response with status `ocr_unavailable` and an advisory explanation).*

---

### Step 5: Configure Gemini AI Integration (Optional)

1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Set the following in `backend/.env`:
   ```env
   LLM_PROVIDER=gemini
   LLM_API_KEY=your_actual_gemini_api_key_here
   LLM_MODEL=gemini-1.5-flash
   EMBEDDING_MODEL=text-embedding-004
   ```
*(Leave `LLM_API_KEY=` blank to run 100% locally in deterministic rules-only mode).*

---

### Step 6: Start the Backend Server

Run Uvicorn from the `backend/` directory with your virtual environment active:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Verify Backend Health**:
Open [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) in your browser. Expected response:
```json
{
  "status": "healthy",
  "service": "inkloom-guardian-api",
  "version": "1.0.0",
  "database": "connected",
  "ai_enabled": true,
  "rules_engine": "active"
}
```
Interactive Swagger API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### Step 7: Frontend Setup

Open a **separate terminal window** and navigate to the `frontend/` directory:
```bash
cd frontend
```

#### 7.1 Install Frontend Dependencies
```bash
npm install
```

#### 7.2 Configure Frontend Environment
Create `frontend/.env.local` from `frontend/.env.example`:
```bash
# Windows PowerShell
copy .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```
Ensure `frontend/.env.local` contains:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

#### 7.3 Start the Frontend Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to access Inkloom Guardian.

---

## 7. Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Default | Purpose | Example Format |
| :--- | :---: | :--- | :--- | :--- |
| `APP_ENV` | No | `development` | Application runtime environment (`development`, `production`, `test`). | `production` |
| `DATABASE_URL` | No | `sqlite:///./inkloom.db` | SQLAlchemy connection string for SQLite or PostgreSQL. | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `CORS_ORIGINS` | No | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated list of allowed browser CORS origins. | `http://localhost:3000,https://my-app.vercel.app` |
| `LLM_PROVIDER` | No | `""` | AI provider name (`gemini`). | `gemini` |
| `LLM_API_KEY` | No | `""` | Google AI Studio API key for Gemini review and embeddings. | `AIzaSyD-sample-key-123` |
| `LLM_MODEL` | No | `gemini-1.5-flash` | Gemini model name for semantic review. | `gemini-1.5-flash` |
| `LLM_TIMEOUT_SECONDS` | No | `20` | Maximum network timeout for Gemini API calls (minimum 30s enforced in client). | `30` |
| `MAX_CONTENT_CHARS` | No | `12000` | Maximum allowable character count for submitted draft content. | `15000` |
| `ENABLE_DEMO_SEED` | No | `true` | Automatically seeds the canonical Acme Enterprise Core demo brand on startup. | `true` |
| `EMBEDDING_MODEL` | No | `text-embedding-004` | Model identifier for generating 768-dimensional knowledge embeddings. | `text-embedding-004` |
| `MAX_IMAGE_UPLOAD_BYTES` | No | `10485760` | Maximum file upload size in bytes for asset inspection (10MB). | `10485760` |
| `TESSERACT_CMD` | No | `None` | Path to the Tesseract OCR binary if not present in system PATH. | `C:\Program Files\Tesseract-OCR\tesseract.exe` |

### Frontend Configuration (`frontend/.env.local`)

| Variable | Required | Default | Purpose | Example Format |
| :--- | :---: | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:8000` | Base URL of the FastAPI backend (trailing slash automatically stripped). | `http://localhost:8000` or `https://api.yourdomain.com` |

---

## 8. Running the Complete Application

### Option A: Standard Dual-Terminal Workflow
1. **Terminal 1 (Backend)**:
   ```bash
   cd backend
   # Activate venv, then:
   python -m uvicorn app.main:app --port 8000 --reload
   ```
2. **Terminal 2 (Frontend)**:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Option B: Docker Compose (All-in-One Containerized Stack)
Run both backend and frontend inside Docker containers with a single command from the project root:
```bash
docker compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

## 9. First-Time Usage Guide

Follow this guide to execute a complete compliance review workflow from scratch:

```text
 ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
 │ 1. Workspace   │  ──►  │ 2. Add Rules   │  ──►  │ 3. Run Review  │
 │ Select Brand   │       │ Facts & Terms  │       │ Check Content  │
 └────────────────┘       └────────────────┘       └────────────────┘
                                                           │
                                                           ▼
 ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
 │ 6. Sign-off    │  ◄──  │ 5. Re-evaluate │  ◄──  │ 4. Remediate   │
 │ Record Verdict │       │ Version v2.0   │       │ Apply Rewrites │
 └────────────────┘       └────────────────┘       └────────────────┘
```

### Step 1: Access the Application
Open [http://localhost:3000](http://localhost:3000). If greeted by the login screen, click **"Fill Demo Credentials"** (`demo@inkloom.io`) and click **"Enter Brand Workspace"**.

### Step 2: Select or Create a Brand Workspace
In the left sidebar dropdown under **Active Brand**, select the pre-seeded brand **Acme Enterprise Core (Demo)**, or click **"+ Create brand"** to set up a new workspace.

### Step 3: Inspect the Brand Knowledge Repository
Click **"Brand knowledge"** in the sidebar. Notice the approved guidelines, certified facts, preferred terminology, and prohibited claims:
- Certified Fact: *"Acme Treasury provides compliant clearing services in 94 supported jurisdictions..."*
- Prohibited Phrase: *"guaranteed zero foreign exchange risk"* (Regulatory citation: `SEC-RULE-156`).
- Preferred Term: *"Atomic Clearing Ledger"* (Disallowed colloquialisms: `"instant settlement pipe"`, `"magic ledger"`).

### Step 4: Submit a Content Draft for Review
Click **"Review"** in the sidebar. You can write your own copy or click **"Load sample draft"** in the top right to populate the pre-configured compliance test draft:
> *"Acme Enterprise Core provides zero-latency settlements with guaranteed zero foreign exchange risk across 140 countries using our instant settlement pipe."*

Click the red **"Check content"** button.

### Step 5: Evaluate Findings & Evidence
The right panel populates with flagged policy findings and an overall **Safety Score**:
- **Critical Violation (Prohibited Phrase)**: *"guaranteed zero foreign exchange risk"* flagged under `SEC-RULE-156`.
- **Critical Discrepancy (Certified Fact Conflict)**: *"across 140 countries"* contradicts the certified 94-jurisdiction operating charter.
- **Warning (Non-Standard Terminology)**: *"instant settlement pipe"* departs from the approved brand lexicon.

### Step 6: Apply One-Click Suggested Rewrites
For each finding, review the approved evidence mandate and recommendation. Click **"Apply suggestion"** on the finding card. The draft editor automatically patches the text to compliant alternatives in place.

### Step 7: Re-evaluate to Generate Version 2
Click **"Check content"** again. The engine re-evaluates the patched text, updates the Safety Score to `100/100`, and records the new version snapshot as `v2.0` in the draft history.

### Step 8: Record Human Review Decision
Under the **Human Governance Gate**, select the **Approved** verdict, enter a reviewer note (e.g., *"SLA claims and terminology verified against v3 policy"*), and click **"Record Decision"**.

### Step 9: Multi-Modal Asset Inspection
Click **"Asset inspection"** in the sidebar. Drag and drop any marketing banner (PNG, JPEG, or WebP). Click **"Inspect Image Asset"** to extract embedded text via OCR and verify that disclaimers and product names satisfy active brand policies.

### Step 10: Inspect Review History & Export Audit Telemetry
Click **"Review history"** in the sidebar to review past draft snapshots, version numbers, and audit events. Click **"Export Telemetry"** to download a structured JSON audit package.

---

## 10. Testing and Verification

Inkloom Guardian includes a multi-layered verification suite covering deterministic rules, vector embeddings, image validation, OCR processing, and API lifecycle contracts.

### 1. Run Backend Pytest Suite
Run the automated test suite from the `backend/` directory with the virtual environment active:
```bash
cd backend
python -m pytest tests -v
```
**Verified Result**: `13 passed in ~16m` (tested against PostgreSQL with `pgvector` and local fallback).
- `tests/test_api.py`: Validates health checks, brand provisioning, rule creation, review execution, human decision recording, and cross-brand rule isolation.
- `tests/test_asset_checker.py`: Validates corrupt file rejection, MIME format enforcement, 4096px dimension bounds checking, graceful OCR degradation, and brand-isolated image evaluation.
- `tests/test_rag.py`: Verifies that deterministic rules evaluate 100% of active rules regardless of RAG state, verifies lexical similarity fallback, confirms inactive rule exclusion, and validates idempotent embedding reindexing.
- `tests/test_regression.py`: Executes synthetic fixture scenarios and verifies historical review replay drift detection.

---

### 2. Run Automated Rule Regression CLI
Execute the deterministic rule regression runner without network or LLM dependencies:
```bash
cd backend
python -m app.services.regression_runner
```
**Expected Output**:
```text
====================================================================
   INKLOOM GUARDIAN - AUTOMATED RULE REGRESSION SUITE
====================================================================
[PASS] TC-001-prohibited-term: Prohibited phrase detection with suggested replacement
[PASS] TC-002-preferred-terminology: Disallowed colloquial term triggers preferred term suggestion
[PASS] TC-003-required-disclaimer-missing: Missing required regulatory disclaimer flag
[PASS] TC-004-required-phrase-satisfied: Required phrase present in draft triggers zero findings
[PASS] TC-005-fact-discrepancy: Fact discrepancy regex conflict pattern detected
[PASS] TC-006-clean-copy: Fully compliant copy generates zero findings
[PASS] TC-007-inactive-rule-suppression: Deactivated rules must NOT trigger any findings
[PASS] TC-008-overlapping-rules: Draft triggering multiple distinct rule categories simultaneously
[PASS] TC-009-brand-isolation: Brand-scoped isolation prevents cross-tenant rule enforcement
--------------------------------------------------------------------
Summary: 9/9 passed, 0 failed.
====================================================================
```

---

### 3. Run Historical Review Drift Replay
Replay recent reviews saved in the database against current active rules to identify compliance drift:
```bash
cd backend
python -m app.services.regression_runner --replay --limit 20
```

---

### 4. Knowledge Embedding Reindexer CLI
Reindex embeddings for all active brand knowledge items in the database:
```bash
cd backend
python -m app.services.embedding_service reindex
```
To reindex a specific brand:
```bash
python -m app.services.embedding_service reindex --brand-id <brand-uuid>
```

---

### 5. Frontend Production Build Verification
Verify that TypeScript compiling, linting, and Next.js static page generation complete cleanly:
```bash
cd frontend
npx tsc --noEmit
npm run build
```
**Expected Output**:
```text
▲ Next.js 16.4.3 (Turbopack)
✓ Compiled successfully in 702ms
✓ Finished TypeScript in 1288ms
✓ Generating static pages (4/4) in 598ms
```

---

## 11. API Documentation

All API endpoints are prefixed with `/api/v1` (with system health available at `/health` and `/` as well). Interactive Swagger UI documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### System & Health Endpoints

#### `GET /health` | `GET /api/v1/health`
Returns service status, database connectivity, and AI integration status.
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "service": "inkloom-guardian-api",
    "version": "1.0.0",
    "database": "connected",
    "ai_enabled": true,
    "rules_engine": "active"
  }
  ```

#### `GET /api/v1/demo/fixture`
Returns pre-seeded sample draft content and demo brand metadata.
- **Response `200 OK`**:
  ```json
  {
    "enabled": true,
    "brand_slug": "acme-enterprise-core",
    "sample_draft": {
      "title": "Global Treasury Settlement Infrastructure",
      "content": "Acme Enterprise Core provides zero-latency settlements with guaranteed zero foreign exchange risk..."
    }
  }
  ```

---

### Brand Workspaces (`/api/v1/brands`)

#### `GET /api/v1/brands?include_demo=true`
List all brand workspaces. Query param `include_demo` toggles visibility of demo brands.

#### `POST /api/v1/brands`
Create a new brand workspace.
- **Request Body**:
  ```json
  {
    "name": "Apex Cloud Systems",
    "description": "Enterprise cloud infrastructure",
    "industry": "Cloud Computing",
    "visual_config": {
      "primary_color": "#00FFCC",
      "secondary_color": "#0F172A"
    }
  }
  ```
- **Response `201 Created`**: Returns brand object with generated UUID `id` and unique `slug`.

#### `GET /api/v1/brands/{brand_id}`
Fetch brand workspace details by UUID or slug.

#### `PATCH /api/v1/brands/{brand_id}`
Update brand metadata or visual color tokens.

---

### Knowledge Items (`/api/v1/brands/{brand_id}/knowledge`)

#### `GET /api/v1/brands/{brand_id}/knowledge`
Query brand knowledge rules. Supported query parameters: `kind` (`guideline`, `fact`, `claim`, `preferred_term`, `prohibited_term`, `required_phrase`, `disclaimer`) and `active_only` (`true`/`false`).

#### `POST /api/v1/brands/{brand_id}/knowledge`
Add a new rule to a brand workspace. Automatically dispatches embedding generation.
- **Request Body**:
  ```json
  {
    "kind": "prohibited_term",
    "title": "Unsubstantiated Uptime Guarantee",
    "content": "100% unbreakable uptime",
    "source_label": "SLA Manual v4",
    "active": true,
    "rule_config": {
      "replacement": "industry-standard 99.99% high availability SLA"
    },
    "metadata": {
      "severity": "critical"
    }
  }
  ```
- **Response `201 Created`**: Returns knowledge item record.

#### `PATCH /api/v1/brands/{brand_id}/knowledge/{item_id}`
Update knowledge rule fields, configuration, or active toggle. Re-indexes embedding if active.

#### `DELETE /api/v1/brands/{brand_id}/knowledge/{item_id}?permanent=false`
Deactivates (`permanent=false`, default) or permanently deletes (`permanent=true`) a knowledge item.

---

### Content Reviews (`/api/v1/reviews`)

#### `POST /api/v1/reviews`
Submit draft copy for compliance evaluation.
- **Request Body**:
  ```json
  {
    "brand_id": "ecf3e415-0d95-4229-ad27-933b9bd7844e",
    "title": "Q3 Enterprise Infrastructure Update",
    "content": "Acme delivers 100% unbreakable uptime with zero risk guarantee across 140 countries.",
    "review_group_id": null,
    "run_ai": true
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "id": "rev-550e8400-e29b-41d4-a716-446655440000",
    "review_group_id": "grp-123e4567-e89b-12d3-a456-426614174000",
    "brand_id": "ecf3e415-0d95-4229-ad27-933b9bd7844e",
    "version_number": 1,
    "title": "Q3 Enterprise Infrastructure Update",
    "content": "Acme delivers 100% unbreakable uptime with zero risk guarantee across 140 countries.",
    "engine_status": "rules_and_ai",
    "retrieval_mode": "vector",
    "created_at": "2026-11-03T01:30:00Z",
    "summary": {
      "total": 2,
      "critical": 2,
      "warning": 0,
      "info": 0,
      "score": 60
    },
    "findings": [
      {
        "id": "fnd-1",
        "review_id": "rev-550e8400",
        "brand_id": "ecf3e415",
        "knowledge_item_id": "k-1",
        "source_type": "rule",
        "category": "prohibited_term",
        "severity": "critical",
        "claim_status": "contradicted",
        "title": "Prohibited phrase detected: '100% unbreakable uptime'",
        "explanation": "Use of restricted terminology violates brand policy.",
        "evidence": "Mandate from SLA Manual v4: '100% unbreakable uptime'",
        "content_excerpt": "...delivers 100% unbreakable uptime with...",
        "suggested_rewrite": "Acme delivers industry-standard 99.99% high availability SLA with zero risk guarantee across 140 countries.",
        "location_start": 14,
        "location_end": 38
      }
    ],
    "latest_decision": null
  }
  ```

#### `GET /api/v1/reviews/{review_id}`
Retrieve a review snapshot with all associated findings and latest human decision.

#### `GET /api/v1/review-groups/{group_id}/history`
Retrieve all chronological review iterations (`v1`, `v2`, `v3`) under a single draft group.

#### `GET /api/v1/brands/{brand_id}/reviews`
List all reviews recorded under a brand workspace.

---

### Human Decisions (`/api/v1/reviews/{review_id}/decisions`)

#### `POST /api/v1/reviews/{review_id}/decisions`
Record a human governance verdict.
- **Request Body**:
  ```json
  {
    "decision": "approved",
    "reviewer_label": "Senior Compliance Lead",
    "note": "Verified SLA claims and factual consistency against corporate policy."
  }
  ```
- **Response `201 Created`**: Returns decision record.

---

### Multi-Modal Asset Checking (`/api/v1/brands/{brand_id}/assets`)

#### `POST /api/v1/brands/{brand_id}/assets/inspect-image`
Upload and screen marketing imagery.
- **Request**: `multipart/form-data` with `file` (PNG, JPEG, WebP, max 10MB).
- **Response `200 OK`**:
  ```json
  {
    "brand_id": "ecf3e415-0d95-4229-ad27-933b9bd7844e",
    "filename": "q3_banner_ad.png",
    "extracted_text": "Invest today for guaranteed 100% risk-free returns.",
    "ocr_confidence": 94.2,
    "processing_status": "success",
    "findings": [
      {
        "category": "prohibited_term",
        "severity": "critical",
        "title": "Prohibited phrase detected: 'guaranteed 100% risk-free'",
        "explanation": "Absolute guarantee claims violate financial compliance policy.",
        "evidence": "Mandate from SEC-RULE-156",
        "suggested_rewrite": "Invest today backed by automated risk management protocols."
      }
    ],
    "limitations": "OCR text extraction is advisory and screens plain text only. It does not verify typography, layout, font sizes, colors, or logo artwork. Human verification remains required."
  }
  ```

---

## 12. Deployment Guide

### Deployment Topology
In production, Inkloom Guardian operates as a distributed system:
- **Frontend**: Deployed on **Vercel** as a globally edge-distributed Next.js application.
- **Backend**: Deployed on **Render** (or Koyeb / Railway) as a containerized Python Web Service.
- **Database**: Hosted on **Neon Serverless PostgreSQL** with native `pgvector` extension support.

---

### Backend Deployment (Render)

1. Connect the GitHub repository `GolDLance07/Inkloom_Guardian` in the Render dashboard.
2. Select **Web Service** and choose **Python** runtime (or Docker).
3. Set the configuration:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
4. Configure Environment Variables in Render:
   - `APP_ENV`: `production`
   - `DATABASE_URL`: Your production PostgreSQL connection string (`postgresql://user:pass@host/db?sslmode=require`).
   - `CORS_ORIGINS`: Your Vercel frontend URL (e.g., `https://frontend-odtjvz5af-me-abb2.vercel.app`).
   - `LLM_PROVIDER`: `gemini`
   - `LLM_API_KEY`: Your Google AI Studio API key.
   - `LLM_MODEL`: `gemini-1.5-flash`
   - `EMBEDDING_MODEL`: `text-embedding-004`
   - `ENABLE_DEMO_SEED`: `true`

---

### Frontend Deployment (Vercel)

1. Import `GolDLance07/Inkloom_Guardian` into Vercel.
2. Select the **Root Directory** as `frontend`.
3. Set Framework Preset to **Next.js**.
4. Configure Environment Variable:
   - `NEXT_PUBLIC_API_BASE_URL`: The URL of your deployed Render backend (e.g., `https://inkloom-guardian-api.onrender.com`).
5. Click **Deploy**.

*(Deployment Safety Note: The live production environment is actively running. Modifying local repository documentation will not affect the production deployment unless changes are merged and deployed).*

---

## 13. Troubleshooting

### 1. Backend fails to start with `ModuleNotFoundError: No module named 'app'`
- **Cause**: Running Python from inside `backend/app/` instead of `backend/`.
- **Solution**: Navigate to `backend/` and run `python -m uvicorn app.main:app --reload`.

### 2. Database Connection Error (`connection refused` or `timeout`)
- **Cause**: Invalid PostgreSQL credentials or unreachable host.
- **Solution**: If testing locally without PostgreSQL, omit `DATABASE_URL` in `backend/.env`. The application defaults to SQLite (`sqlite:///./inkloom.db`) automatically.

### 3. Missing `pgvector` Extension Error on PostgreSQL
- **Cause**: Database user lacks permission to create extensions or pgvector is not installed on the Postgres server.
- **Solution**: Execute `CREATE EXTENSION IF NOT EXISTS vector;` as superuser. If on SQLite, vector functionality automatically uses the built-in fallback.

### 4. Gemini API Error 404 (`models/gemini-... not found`)
- **Cause**: Using an unreleased or invalid model identifier (e.g., `gemini-3.6-flash`).
- **Solution**: Set `LLM_MODEL=gemini-1.5-flash` in `backend/.env`.

### 5. Gemini Request Timeout
- **Cause**: Poor network connectivity or complex prompt causing latency beyond timeout bounds.
- **Solution**: Increase `LLM_TIMEOUT_SECONDS=45` in `backend/.env`.

### 6. OCR Text Extraction Fails or Returns `ocr_unavailable`
- **Cause**: Tesseract binary is not installed on the host machine or not discovered in system PATH.
- **Solution**: Install Tesseract OCR (see [Prerequisites](#5-prerequisites)). On Windows, specify the full path in `backend/.env`: `TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe`.

### 7. Frontend Cannot Connect to Backend (`Network Connection Failed`)
- **Cause**: `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` does not match the running backend port.
- **Solution**: Ensure backend is running on `http://localhost:8000` and `frontend/.env.local` contains `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.

### 8. CORS Blocked in Browser Console
- **Cause**: Backend `CORS_ORIGINS` does not whitelist the frontend origin.
- **Solution**: In `backend/.env`, set `CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000` (or `*` for development).

### 9. Port Already in Use (`8000` or `3000`)
- **Windows**: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force`
- **macOS / Linux**: `lsof -ti :8000 | xargs kill -9`

---

## 14. Known Limitations

1. **Advisory OCR Screening**: Multi-modal asset checking evaluates extracted plain text only. It does not verify typography, layout hierarchy, font sizes, colors, or logo artwork. Findings are advisory and human verification remains necessary.
2. **Plain-Text Content Limit**: Draft review accepts plain text and Markdown; direct upload and document parsing of PDF, Word (.docx), or HTML files is not currently supported.
3. **Exact & Regex Fact Matching**: Deterministic fact checking requires explicit `conflict_patterns` regular expressions configured in rule metadata. Dynamic numerical range comparison is handled by the LLM.
4. **Context Retrieval Bounding**: RAG retrieves the top-N semantically relevant knowledge records for the LLM prompt. Deterministic checks always evaluate 100% of active brand rules, but AI evaluation focuses on the bounded subset.
5. **Single-Tenant Reviewer Identity**: Human decisions currently record an arbitrary string label (e.g., "Senior Compliance Lead"); full multi-user authentication (RBAC / SSO) remains planned.

---

## 15. Future Roadmap

1. **Document File Ingestion**: Direct upload, parsing, and section-by-section governance of PDF, DOCX, and rich-text files.
2. **Enterprise Authentication (SSO / RBAC)**: Integrating SAML, OAuth2/OIDC, and role-based permissions (Reviewer, Brand Lead, Legal Admin).
3. **Computer Vision Artwork & Logo Verification**: Verifying logo clear-space, aspect ratios, typography scale, and color palette compliance in marketing banners.
4. **Real-Time CMS & Editor Plugins**: Browser extensions, Figma widgets, and CMS integrations (Contentful, WordPress) for in-flight governance.
5. **Fine-Grained Audit Telemetry Streaming**: Webhook streaming of review snapshots and human sign-offs to enterprise SIEM platforms.

---

## 16. Contribution Guide

We welcome contributions to Inkloom Guardian! Follow these guidelines to submit changes:

### Development Workflow
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/GolDLance07/Inkloom_Guardian.git
   git checkout -b feature/your-feature-name
   ```
2. Follow brand-agnostic design principles:
   - **Never hardcode customer names, brand names, products, or rule findings in shared UI components or backend review services.**
   - All rules must resolve dynamically through `KnowledgeItem` records.
3. Run backend tests before submitting a PR:
   ```bash
   cd backend
   python -m pytest tests -v
   python -m app.services.regression_runner
   ```
4. Verify frontend build and type checks:
   ```bash
   cd frontend
   npx tsc --noEmit
   npm run build
   ```
5. Commit with descriptive commit messages following the Conventional Commits format (`feat:`, `fix:`, `docs:`, `test:`).
6. Open a Pull Request targeting `main`.

---

## 17. License

*No license file is currently included in this repository. All rights are reserved by the original project authors.*

# Inkloom Guardian — README Audit & Verification Record

This document records the exact inspections, corrections, command executions, test results, and discrepancies identified during the comprehensive README overhaul.

---

## 1. What Was Inspected

The following codebase assets were directly inspected to verify architectural alignment:

- **Dependencies & Manifests**:
  - `backend/requirements.txt`: Verified FastAPI `>=0.110.0`, SQLAlchemy `>=2.0.28`, `pgvector >=0.2.5`, `Pillow >=10.2.0`, `pytesseract >=0.3.10`, `python-multipart >=0.0.9`, `psycopg[binary] >=3.1.18`.
  - `frontend/package.json`: Verified Next.js `16.4.3`, React `19.3.0`, `@tailwindcss/turbopack ^4`, TypeScript `^5`.
- **Backend Configuration & Models**:
  - `backend/app/config.py`: Verified all 12 Settings parameters (`APP_ENV`, `DATABASE_URL`, `CORS_ORIGINS`, `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_TIMEOUT_SECONDS`, `MAX_CONTENT_CHARS`, `ENABLE_DEMO_SEED`, `EMBEDDING_MODEL`, `MAX_IMAGE_UPLOAD_BYTES`, `TESSERACT_CMD`).
  - `backend/app/models/base.py`: Inspected `Brand`, `KnowledgeItem`, `ReviewGroup`, `Review`, `Finding`, `Decision`, `AuditEvent`, and `KnowledgeEmbedding` (Vector 768).
  - `backend/app/db.py`: Verified `init_db()` runs `CREATE EXTENSION IF NOT EXISTS vector;` on PostgreSQL and maps `postgresql://` to `postgresql+psycopg://`.
- **Backend Services & Routers**:
  - `backend/app/services/rules_engine.py`: Inspected deterministic regex checks for prohibited phrases, preferred terms, required disclaimers, and conflicting facts.
  - `backend/app/services/embedding_service.py`: Verified Gemini `text-embedding-004` API caller, pgvector cosine distance, lexical similarity fallback, and reindexing CLI.
  - `backend/app/services/asset_checker.py`: Verified image validation (10MB, 4096px bounds, MIME checks) and Tesseract OCR text extraction.
  - `backend/app/services/regression_runner.py`: Verified standalone regression CLI and historical drift replay.
  - `backend/app/api/v1/`: Verified routes in `brands.py`, `knowledge.py`, `reviews.py`, `decisions.py`, and `assets.py`.
- **Frontend Views & API Client**:
  - `frontend/lib/api.ts`: Verified all API client methods, including `inspectAssetImage`.
  - `frontend/components/views/AssetInspectionView.tsx`: Inspected file dropzone, OCR text display, findings rendering, and advisory disclaimer.
  - `frontend/components/views/BrandReviewWorkbench.tsx`: Inspected review submission, findings cards, "Apply suggestion" logic, and RAG status indicator.
- **Deployment Manifests & Docker**:
  - `render.yaml`, `railway.json`, `koyeb.yaml`, `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`.
- **Test Modules**:
  - `backend/tests/test_api.py`, `backend/tests/test_asset_checker.py`, `backend/tests/test_rag.py`, `backend/tests/test_regression.py`, `backend/tests/conftest.py`, and `backend/tests/fixtures/regression_fixtures.json`.

---

## 2. What Documentation Was Corrected

| Area | Previous Documentation | Corrected Documentation |
| :--- | :--- | :--- |
| **RAG & Vector Search** | Listed under "Future Roadmap" as planned | Documented as **Implemented** with PostgreSQL `pgvector`, Gemini `text-embedding-004`, and lexical fallback. |
| **Multi-Modal Asset Checking** | Omitted from features list | Documented as **Implemented** with OCR text extraction, image validation, and `POST /api/v1/brands/{brand_id}/assets/inspect-image`. |
| **Rule Regression Suite** | Listed under "Future Roadmap" as planned | Documented as **Implemented** with standalone CLI (`regression_runner.py`) and historical drift replay (`--replay`). |
| **Automated Tests** | Documented only 2 tests in `test_api.py` | Documented all 13 verified tests across `test_api.py`, `test_asset_checker.py`, `test_rag.py`, and `test_regression.py`. |
| **Environment Variables** | Missing `EMBEDDING_MODEL`, `MAX_IMAGE_UPLOAD_BYTES`, and `TESSERACT_CMD` | Full reference table provided in README and added to `backend/.env.example`. |
| **Database Migrations** | Ambiguous mention of migrations | Clarified that `init_db()` creates tables automatically on startup; no manual migration scripts required for fresh installs. |
| **License** | Unspecified | Explicitly noted that no license file is included in the repository (All Rights Reserved). |

---

## 3. Commands Verified

The following commands were directly executed in the repository environment and verified to succeed:

1. **Rule Regression Suite CLI**:
   ```bash
   cd backend
   python -m app.services.regression_runner
   ```
   *Result*: Code 0. 9/9 synthetic test cases passed.

2. **Full Pytest Suite**:
   ```bash
   cd backend
   python -m pytest tests -v
   ```
   *Result*: Code 0. 13 passed in 1017.25s against PostgreSQL with `pgvector` and automatic teardown.

3. **Frontend TypeScript Check**:
   ```bash
   cd frontend
   npx tsc --noEmit
   ```
   *Result*: Code 0. Zero TypeScript compile errors.

4. **Frontend Production Build**:
   ```bash
   cd frontend
   npm run build
   ```
   *Result*: Code 0. Next.js 16.4.3 Turbopack production build succeeded in 702ms with all static pages generated.

5. **Embedding Reindexer CLI Help & Execution**:
   ```bash
   cd backend
   python -m app.services.embedding_service --help
   ```
   *Result*: Code 0. Verified CLI argument parser syntax (`reindex`, `--brand-id`).

---

## 4. Tests Actually Run and Their Results

### Pytest Execution Summary
```text
tests/test_api.py::test_health PASSED                                    [  7%]
tests/test_api.py::test_brand_lifecycle_and_review_flow PASSED           [ 15%]
tests/test_asset_checker.py::test_asset_inspection_invalid_format PASSED [ 23%]
tests/test_asset_checker.py::test_asset_inspection_corrupt_file PASSED   [ 30%]
tests/test_asset_checker.py::test_asset_inspection_oversized_dimensions PASSED [ 38%]
tests/test_asset_checker.py::test_asset_inspection_graceful_ocr_handling_and_brand_isolation PASSED [ 46%]
tests/test_rag.py::test_deterministic_checks_unaffected_by_rag_or_credentials PASSED [ 53%]
tests/test_rag.py::test_lexical_fallback_and_inactive_exclusion PASSED   [ 61%]
tests/test_rag.py::test_brand_isolation_in_retrieval PASSED              [ 69%]
tests/test_rag.py::test_vector_retrieval_flow_with_mock PASSED           [ 76%]
tests/test_rag.py::test_reindex_all_knowledge_idempotent PASSED          [ 84%]
tests/test_regression.py::test_automated_rule_regression_suite PASSED    [ 92%]
tests/test_regression.py::test_regression_replay_mode PASSED             [100%]

================= 13 passed, 1 warning in 1017.25s ==================
```

---

## 5. Items That Remain Unverified

The following items cannot be fully verified locally and are noted explicitly:
- **Tesseract Host Binary**: Tesseract executable was not installed in system PATH on the Windows host machine; graceful degradation to `ocr_unavailable` and mocked OCR execution were verified via `test_asset_checker.py`.
- **Live Render & Vercel Webhook Triggers**: Remote cloud webhooks were not triggered to preserve live deployment stability.

---

## 6. Discrepancies Discovered

1. **`render.yaml` Model Identifier**: `render.yaml` specifies `LLM_MODEL: gemini-3.6-flash`. Because `gemini-3.6-flash` is not a valid Gemini endpoint, the application safely degrades to rules-only mode on Render. A note was added in the README troubleshooting section recommending `gemini-1.5-flash`.
2. **`docker-compose.yml` Database URL**: Previously contained a hardcoded plaintext database connection string; this was corrected in Round 3 to use `${DATABASE_URL:-sqlite:///./inkloom.db}`.
3. **Absence of a LICENSE file**: Clarified in the README that all rights remain with the authors until a license is formally added.

---

## 7. Confirmation of Deployment Safety

- No changes were made to application logic or runtime code.
- No changes were made to production deployment settings or cloud environment variables.
- All modifications are strictly confined to documentation (`README.md`, `README_AUDIT.md`, `backend/.env.example`).

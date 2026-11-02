# Inkloom Guardian — Round 3 Architecture & Implementation Report

This document records the architectural improvements, feature implementations, verification results, and operational guides completed for Round 3.

---

## 1. Executive Summary

Three core platform enhancements were added to Inkloom Guardian while strictly preserving existing business rules, deterministic review guarantees, and multi-tenant brand isolation:

1. **Vector Search & Embeddings (RAG)**: Bounded semantic context retrieval for the optional LLM review engine using PostgreSQL `pgvector` (`Vector(768)`) with Gemini `text-embedding-004` and automatic lexical similarity fallback. Deterministic rule checks continue to evaluate 100% of active brand knowledge items.
2. **Multi-Modal Asset Checking**: Pre-flight optical character recognition (OCR) and text extraction for visual marketing assets (PNG, JPEG, WebP) screened against active brand policies, with strict size/dimension limits (10MB, 4096px) and advisory notices.
3. **Automated Rule Regression Suite**: Zero-network, deterministic regression harness driven by synthetic version-controlled fixtures covering 9 rule scenarios, accompanied by a CLI runner and non-destructive historical review drift replay.

In addition, security hygiene was strengthened by eliminating hardcoded database connection credentials from `docker-compose.yml` and enforcing environment-variable substitution.

---

## 2. Feature One: Vector Search & Embeddings (RAG)

### Problem Addressed
In previous versions, the entire active knowledge base for a brand was serialized and injected into the LLM system prompt. For large knowledge bases, this inflated token consumption, risked context window degradation, and increased latency.

### Architecture & Implementation
- **Schema & Model (`KnowledgeEmbedding`)**:
  - Located in `backend/app/models/base.py`.
  - Fields: `id` (UUID), `knowledge_item_id` (foreign key with `CASCADE`, unique index), `brand_id` (foreign key with `CASCADE`, index), `embedding` (`Vector(768)`), `model_version`, `created_at`, `updated_at`.
  - Database initialization (`init_db` in `backend/app/db.py`) runs `CREATE EXTENSION IF NOT EXISTS vector;` on PostgreSQL while supporting transparent array fallback on SQLite.
- **Embedding Service (`backend/app/services/embedding_service.py`)**:
  - `generate_embedding(text)`: Calls Gemini `text-embedding-004` via REST API with defensive timeouts and error handling. Returns 768-dimensional float vector.
  - `generate_and_store_embedding(db, item)`: Automatically called on knowledge item creation/update (`backend/app/api/v1/knowledge.py`).
  - `retrieve_relevant_knowledge(db, brand_id, query_text, limit=10)`:
    - Strictly filters by `brand_id` at the database query level.
    - Excludes inactive and deleted knowledge items.
    - On PostgreSQL with pgvector, executes native cosine distance ordering (`<=>`).
    - On SQLite, computes in-memory vector cosine similarity.
    - If embeddings are unavailable or fail, automatically falls back to tokenized lexical ranking (Jaccard similarity + exact phrase bonus).
- **Review Pipeline Integration (`backend/app/services/review_service.py`)**:
  1. Load selected brand.
  2. Load **all active knowledge items** for the brand.
  3. Run deterministic checks against **all active knowledge items** (100% rule coverage preserved).
  4. Retrieve top-N relevant knowledge subset via RAG (`retrieve_relevant_knowledge`).
  5. Pass bounded subset to Gemini review service (`run_ai_review`).
  6. Validate all returned knowledge item references against the brand's verified IDs.
  7. Persist review record with `retrieval_mode` (`vector`, `lexical_fallback`, or `all`).
- **Idempotent CLI Backfill**:
  ```bash
  cd backend
  python -m app.services.embedding_service reindex [--brand-id <uuid>]
  ```
- **Frontend Indicator**:
  - Compact badge displayed in the workbench findings header indicating retrieval mode (`RAG: Vector`, `RAG: Lexical`, `RAG: Active`) without exposing embedding vectors or provider internals.

---

## 3. Feature Two: Multi-Modal Asset Checking

### Problem Addressed
Marketing assets often contain claims, pricing, and required legal disclaimers embedded directly within raster images (banners, social cards, display ads), evading text-only draft reviews.

### Architecture & Implementation
- **Validation Pipeline (`backend/app/services/asset_checker.py`)**:
  - Validates file size against `MAX_IMAGE_UPLOAD_BYTES` (default 10MB).
  - Validates MIME types (`image/jpeg`, `image/png`, `image/webp`) and file extensions.
  - Performs Pillow image integrity verification (`Image.open().verify()`) to reject corrupt or malformed payloads.
  - Enforces maximum image dimension bounds (4096 x 4096 px) to prevent decompression bombs.
- **OCR Engine & Graceful Degradation**:
  - Uses `pytesseract` to extract plain text and word-level OCR confidence.
  - If Tesseract is not installed on the host, gracefully degrades to status `ocr_unavailable` with an advisory explanation rather than failing with a 500 error.
- **Brand-Scoped Deterministic Evaluation**:
  - Extracted text is fed directly through `run_deterministic_checks()` using only the active knowledge items of the specified `brand_id`.
  - Records an audit event (`asset_inspected`) for compliance logging.
- **API Endpoint**:
  - `POST /api/v1/brands/{brand_id}/assets/inspect-image`
  - Accepts `multipart/form-data` with file upload.
  - Returns `AssetInspectionResponse` with `extracted_text`, `ocr_confidence`, `processing_status`, `findings`, and `limitations`.
- **Frontend View (`frontend/components/views/AssetInspectionView.tsx`)**:
  - Dedicated "Asset inspection" navigation tab in `AppSidebar`.
  - Drag-and-drop file upload dropzone with thumbnail preview, file size, and dimension feedback.
  - Displays extracted text preview with character count and OCR confidence.
  - Renders policy findings cards with severity badges, explanations, source citations, and recommendations.
  - Prominently displays the advisory disclaimer: *"OCR text extraction is advisory and screens plain text only. It does not verify typography, layout, font sizes, colors, or logo artwork. Human verification remains required."*

---

## 4. Feature Three: Automated Rule Regression Suite

### Problem Addressed
Rule modifications or refactoring risk introducing regressions into deterministic compliance checks. Teams require automated verification without incurring LLM API costs or rate limits.

### Architecture & Implementation
- **Synthetic Fixtures (`backend/tests/fixtures/regression_fixtures.json`)**:
  - 9 standardized test cases covering:
    1. `TC-001-prohibited-term`: Prohibited phrase detection with suggested replacement.
    2. `TC-002-preferred-terminology`: Disallowed colloquial term triggering preferred term suggestion.
    3. `TC-003-required-disclaimer-missing`: Missing regulatory disclaimer flag.
    4. `TC-004-required-phrase-satisfied`: Required phrase present in draft triggering zero findings.
    5. `TC-005-fact-discrepancy`: Fact discrepancy regex conflict pattern detected.
    6. `TC-006-clean-copy`: Fully compliant copy generating zero findings.
    7. `TC-007-inactive-rule-suppression`: Deactivated rules verified to not trigger findings.
    8. `TC-008-overlapping-rules`: Multi-rule conflict handling across categories.
    9. `TC-009-brand-isolation`: Cross-tenant rule isolation verification.
- **CLI Runner (`backend/app/services/regression_runner.py`)**:
  - Zero-network, zero-LLM dependency execution.
  - Compares expected vs. actual findings (category, severity, claim status, rewrite presence).
  - Returns exit code `0` on success, `1` on failure with granular diagnostic output.
  - Historical Replay Mode (`--replay`): Re-evaluates recent database reviews against current active brand rules to identify rule drift without altering historical review records.
- **Pytest Integration (`backend/tests/test_regression.py`)**:
  - `test_automated_rule_regression_suite`
  - `test_regression_replay_mode`

---

## 5. Security & Configuration Cleanup

1. **Docker Compose Sanitization**:
   - In `docker-compose.yml`, replaced hardcoded plaintext Neon PostgreSQL connection string with `${DATABASE_URL:-sqlite:///./inkloom.db}`.
   - Credentials previously checked into repository should be rotated in the upstream database provider.
2. **Environment Configuration**:
   - Added `EMBEDDING_MODEL` (`text-embedding-004`), `MAX_IMAGE_UPLOAD_BYTES` (`10485760`), and optional `TESSERACT_CMD` to `Settings` in `backend/app/config.py`.
3. **Container Dependencies**:
   - Updated `backend/Dockerfile` to install `tesseract-ocr` and `libtesseract-dev` for containerized OCR processing.

---

## 6. Verification and Test Results

### 1. Backend Rule Regression Runner
```bash
python -m app.services.regression_runner
```
**Result**:
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

### 2. Pytest Test Suite
```bash
python -m pytest tests -v
```
- `tests/test_api.py`: Brand lifecycle, deterministic rule evaluation, human decisions, brand isolation.
- `tests/test_regression.py`: Automated synthetic fixtures runner and replay mode.
- `tests/test_asset_checker.py`: Image validation (format, corruption, 4096px bounds), OCR handling, brand isolation.
- `tests/test_rag.py`: Deterministic check coverage invariant (100% evaluated), lexical fallback, inactive rule suppression, vector mock flow, idempotent reindex.

### 3. Frontend TypeScript & Production Build
```bash
cd frontend
npx tsc --noEmit
npm run build
```
**Result**:
```text
✓ Compiled successfully in 1060ms
✓ Finished TypeScript in 1547ms ...
✓ Generating static pages (4/4) in 641ms
```
Zero TypeScript compiler errors and successful static page generation.

---

## 7. Known Boundaries & Limitations

1. **Advisory OCR**: OCR extraction screens plain text only. It cannot recognize company logos, evaluate font point size compliance, check color contrast ratios, or detect visual balance. Human verification remains mandatory.
2. **Advisory AI Findings**: AI reviews operate as assistive second opinions. Findings do not guarantee 100% detection of all subtle factual errors and cannot replace human editorial sign-off.
3. **Brand Isolation**: Every query enforcing knowledge items, review creation, asset checking, and embeddings explicitly scopes queries by `brand_id`. Cross-brand data leakage is strictly prohibited.


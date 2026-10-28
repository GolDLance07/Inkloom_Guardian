# Inkloom Guardian --- Technical Requirements Document

**Architecture objective:** A small, reliable, brand-agnostic
application with configuration-driven behavior and predictable
deployment.

## 1. Architecture decisions

-   **Frontend:** Next.js App Router, TypeScript, Tailwind CSS; Vercel
    deployment.
-   **Backend:** Python FastAPI + Pydantic; Render Web Service.
-   **Database:** PostgreSQL on Supabase; SQLAlchemy 2.x and Alembic
    migrations.
-   **Review engine:** deterministic, brand-independent Python rules.
-   **Optional AI:** one server-side LLM adapter. AI failure must not
    block deterministic review.
-   **Repository:** one repo with `/frontend`, `/backend`, `/docs`.
-   **No P0 dependency on vector search:** retrieve active knowledge
    records for a brand directly from PostgreSQL. Add embeddings only
    after a tested requirement emerges.

## 2. System flow

``` text
Browser
  -> Next.js frontend (Vercel)
  -> FastAPI JSON API (Render)
  -> brand-scoped review service
       -> deterministic rules
       -> optional LLM adapter
  -> PostgreSQL (Supabase)
```

The browser never connects directly to PostgreSQL and never receives AI
provider secrets. All brand-specific behavior is loaded from
API/database records. Shared UI code must not branch on a particular
brand name, product, price, phrase, or industry.

## 3. Repository layout

``` text
inkloom-guardian/
  README.md
  .gitignore
  docs/
    PRD.md
    TRD.md
    Design.md
    IMPLEMENTATION_PLAN.md
  frontend/
    app/
    components/
    lib/api.ts
    lib/types.ts
    .env.example
  backend/
    app/
      main.py
      config.py
      db.py
      models/
      schemas/
      api/
      services/
        rules_engine.py
        review_service.py
        llm_provider.py
        audit_service.py
      seed/
        demo_brand.json
        seed_demo.py
    alembic/
    tests/
    .env.example
```

Choose one backend dependency approach (`requirements.txt` or
`pyproject.toml`) and pin tested versions. Never commit real `.env`
files.

## 4. Database schema

Use UUID primary keys, UTC timestamps, foreign keys, and indexes for
brand-scoped queries. Add created/updated timestamps where appropriate.

### `brands`

-   `id UUID PK`
-   `name TEXT NOT NULL`
-   `slug TEXT UNIQUE NOT NULL` (generated safely; collisions handled)
-   `description TEXT NULL`
-   `industry TEXT NULL`
-   `logo_url TEXT NULL`
-   `visual_config JSONB NOT NULL DEFAULT '{}'` --- optional approved
    presentation tokens; validated against an allowlist
-   `is_demo BOOLEAN NOT NULL DEFAULT false`
-   `created_at TIMESTAMPTZ NOT NULL`
-   `updated_at TIMESTAMPTZ NOT NULL`

Do not store arbitrary CSS or scripts in `visual_config`. Validate color
tokens and URLs; apply accessible defaults in the frontend.

### `knowledge_items`

-   `id UUID PK`
-   `brand_id UUID NOT NULL FK brands`
-   `kind TEXT NOT NULL` --- enum: `guideline`, `fact`, `claim`,
    `preferred_term`, `prohibited_term`, `required_phrase`,
    `disclaimer`, `asset_reference`
-   `title TEXT NOT NULL`
-   `content TEXT NOT NULL`
-   `normalized_value TEXT NULL`
-   `source_label TEXT NOT NULL`
-   `active BOOLEAN NOT NULL DEFAULT true`
-   `rule_config JSONB NOT NULL DEFAULT '{}'` --- only supported,
    validated rule configuration; no executable code
-   `metadata JSONB NOT NULL DEFAULT '{}'`
-   `created_at`, `updated_at TIMESTAMPTZ`

### `review_groups`

Represents a continuing draft across versions. - `id UUID PK` -
`brand_id UUID NOT NULL FK brands` - `title TEXT NOT NULL` -
`created_at TIMESTAMPTZ NOT NULL`

### `reviews`

One immutable review version. - `id UUID PK` -
`review_group_id UUID NOT NULL FK review_groups` -
`brand_id UUID NOT NULL FK brands` (redundant by design for query
safety; enforce consistency in service/DB where practical) -
`version_number INTEGER NOT NULL` - `content TEXT NOT NULL` -
`engine_status TEXT NOT NULL` --- `rules_only`, `rules_and_ai`,
`ai_unavailable` - `created_at TIMESTAMPTZ NOT NULL` - unique
`(review_group_id, version_number)`

### `findings`

-   `id UUID PK`
-   `review_id UUID NOT NULL FK reviews ON DELETE CASCADE`
-   `brand_id UUID NOT NULL FK brands` (must match review's brand)
-   `knowledge_item_id UUID NULL FK knowledge_items`
-   `source_type TEXT NOT NULL` --- `rule`, `ai`, `system_rule`
-   `category TEXT NOT NULL`
-   `severity TEXT NOT NULL` --- `critical`, `warning`, `info`
-   `claim_status TEXT NULL` --- `supported`, `contradicted`,
    `unverified`, `not_applicable`
-   `title TEXT NOT NULL`
-   `explanation TEXT NOT NULL`
-   `evidence TEXT NULL`
-   `content_excerpt TEXT NULL`
-   `suggested_rewrite TEXT NULL`
-   `location_start INTEGER NULL`
-   `location_end INTEGER NULL`
-   `created_at TIMESTAMPTZ NOT NULL`

### `decisions`

-   `id UUID PK`
-   `review_id UUID NOT NULL FK reviews`
-   `brand_id UUID NOT NULL FK brands`
-   `decision TEXT NOT NULL` --- `approved`, `needs_changes`, `rejected`
-   `reviewer_label TEXT NOT NULL DEFAULT 'Demo reviewer'`
-   `note TEXT NULL`
-   `created_at TIMESTAMPTZ NOT NULL`

### `audit_events`

-   `id UUID PK`
-   `brand_id UUID NOT NULL FK brands`
-   `review_id UUID NULL FK reviews`
-   `event_type TEXT NOT NULL`
-   `details JSONB NOT NULL DEFAULT '{}'`
-   `created_at TIMESTAMPTZ NOT NULL`

### Data integrity

-   Every review group, review, finding, and decision must belong to
    exactly one brand.
-   A finding's knowledge item must belong to the same brand as its
    review.
-   Validate brand relationships in service code and add database
    constraints/triggers where practical.
-   Never trust a client-supplied brand ID without verifying that
    referenced records belong to it.
-   Public demo is shared and unauthenticated; do not claim data privacy
    or tenant isolation from other users. Add
    authentication/authorization before supporting private production
    workspaces.

## 5. API contract

Prefix routes with `/api/v1`. Use Pydantic request/response schemas and
a consistent error envelope.

### Brands

-   `GET /api/v1/brands` --- list brands, optionally exclude demo
    records or filter with a query parameter.
-   `POST /api/v1/brands` --- create brand from name and optional
    description, industry, logo URL, and visual config.
-   `GET /api/v1/brands/{brand_id}` --- fetch brand details.
-   `PATCH /api/v1/brands/{brand_id}` --- update allowed identity
    fields.
-   `GET /api/v1/brands/{brand_id}/knowledge` --- list knowledge items
    grouped by kind.
-   `POST /api/v1/brands/{brand_id}/knowledge` --- create a knowledge
    item.
-   `PATCH /api/v1/brands/{brand_id}/knowledge/{item_id}` --- update
    supported fields.
-   `DELETE /api/v1/brands/{brand_id}/knowledge/{item_id}` ---
    soft-delete/deactivate; avoid destructive deletion if referenced by
    history.

Example brand request:

``` json
{
  "name": "Example Studio",
  "description": "Optional description",
  "industry": "Optional industry",
  "logo_url": null,
  "visual_config": {}
}
```

Example knowledge request:

``` json
{
  "kind": "prohibited_term",
  "title": "Restricted phrase",
  "content": "example restricted phrase",
  "source_label": "Brand guidelines v1",
  "active": true,
  "rule_config": {}
}
```

### Reviews

-   `POST /api/v1/reviews` --- create a review group and first version,
    or create a new version when `review_group_id` is provided.
-   `GET /api/v1/reviews/{review_id}` --- review snapshot, findings,
    brand identity, and latest decision.
-   `GET /api/v1/review-groups/{group_id}/history` --- versions and
    decisions for one group.
-   `GET /api/v1/brands/{brand_id}/reviews` --- list recent reviews for
    selected brand.
-   `POST /api/v1/reviews/{review_id}/decisions` --- record a human
    decision.
-   `GET /health` --- service and DB health.

Review request:

``` json
{
  "brand_id": "uuid",
  "review_group_id": null,
  "title": "Draft title",
  "content": "Content to review",
  "run_ai": true
}
```

Decision request:

``` json
{
  "decision": "needs_changes",
  "reviewer_label": "Demo reviewer",
  "note": "Optional explanation"
}
```

### Response and errors

-   Return actual records and findings; no demo findings injected by the
    frontend.
-   Include `engine_status` and a summary computed from persisted
    findings.
-   Errors use
    `{"error":{"code":"VALIDATION_ERROR","message":"Readable explanation"}}`.
-   Use 404 for unknown or cross-brand IDs where revealing record
    existence is inappropriate.
-   Never return stack traces, secrets, connection strings, or provider
    raw responses to the client.

## 6. Rules engine design

Implement brand-independent functions that accept content and active
knowledge items for one brand: - `check_prohibited_terms` -
`check_preferred_terms` - `check_required_phrases` -
`check_configured_fact_conflicts` - `check_supported_guidelines`

The engine must not import demo seed data or inspect brand names. It
receives only the selected brand's data from the service layer.

Use normalized matching and word boundaries where appropriate. Rule
configuration must be schema-validated; never `eval`, execute Python, or
accept arbitrary regex/code from a public user. If regex support is
later added, restrict syntax, length, and execution behavior.

Numeric fact checks require explicit supported patterns/configuration.
Do not infer that every number in content is a conflict.

Each deterministic finding includes a valid knowledge item ID, source
label/evidence, category, severity, and explanation. If evidence is
insufficient, label a claim `unverified`; do not label it contradicted
solely because no matching fact was found.

## 7. Optional AI adapter

Define a provider interface that receives only: - the content
snapshot; - active relevant knowledge items for the selected brand; -
allowed output schema/instructions.

Validate returned data with Pydantic. Reject unknown knowledge IDs,
enforce output size limits, set a bounded timeout (initial target 20
seconds), and handle missing keys, provider failures, and malformed JSON
without losing deterministic findings. Keep credentials server-side. The
AI cannot approve content, invent approved facts, or change the selected
brand.

## 8. Environment variables

### Frontend `.env.example`

``` bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend `.env.example`

``` bash
APP_ENV=development
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DBNAME
CORS_ORIGINS=http://localhost:3000
LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL=
LLM_TIMEOUT_SECONDS=20
MAX_CONTENT_CHARS=12000
ENABLE_DEMO_SEED=true
```

Use the exact database connection details from the provider, adapted for
the chosen SQLAlchemy driver. `ENABLE_DEMO_SEED` should control optional
fixture loading only; the product must work when it is false. Do not
make the frontend rely on demo-specific environment variables.

## 9. Seed data and migrations

-   Keep optional sample brand records in
    `backend/app/seed/demo_brand.json` or equivalent.
-   `seed_demo.py` is the only module that knows the sample brand's
    exact name, facts, phrases, and content.
-   Seed operation must be idempotent and scoped to known demo fixture
    IDs/slugs.
-   Never delete all brands or all knowledge during seed/reset.
-   Do not auto-seed sample content into a newly created brand.
-   Run Alembic migrations through a controlled release/deploy step;
    avoid multiple workers racing to migrate at startup.
-   Test migrations against an empty database and a database with
    existing seed records.

## 10. Deployment

### Supabase

1.  Create project/database and secure connection string.
2.  Configure connectivity from Render.
3.  Apply Alembic migrations with a documented one-time or release
    command.
4.  Optionally run the idempotent demo seed.
5.  Verify brand creation and database persistence.

### Render backend

-   Set root directory to `backend`.
-   Use pinned dependencies.
-   Start Uvicorn on `0.0.0.0:$PORT`.
-   Configure database URL, exact CORS origins, content limit, and
    optional LLM variables.
-   Verify `/health`, `GET /api/v1/brands`, `POST /api/v1/brands`,
    knowledge CRUD, review, and decision endpoints.

### Vercel frontend

-   Set root directory to `frontend`.
-   Set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend URL.
-   Redeploy after environment changes.
-   Test in a clean private browser session.

### Release smoke test

1.  App loads with no console errors.
2.  Brand list comes from API; empty list is handled.
3.  Create a new brand with only a name.
4.  Add a prohibited term and a required phrase to that brand.
5.  Review content containing the term and omitting the phrase.
6.  Verify findings cite that brand's actual knowledge items.
7.  Create/select a second brand and confirm the first brand's knowledge
    does not leak.
8.  Recheck edited content and confirm versioning.
9.  Record a decision, refresh, and confirm persistence.
10. Repeat with AI disabled.
11. Confirm `/health` and logs are clean.

## 11. Security and failure modes

-   Exact-origin CORS; no wildcard with credentials.
-   Validate and limit request body, content length, notes, logo URLs,
    and visual config.
-   Rate-limit unauthenticated write/review endpoints.
-   Use parameterized ORM queries and escape output.
-   Never render user-provided HTML or model-generated HTML.
-   No secret in `NEXT_PUBLIC_*` variables.
-   DB down: health reports safe 503 and UI offers retry.
-   AI down: rules-only results still appear.
-   Invalid evidence ID: reject/downgrade AI finding.
-   Cross-brand reference: return safe error and log diagnostics.
-   Seed disabled: app still works with user-created brand.
-   Empty knowledge: explain that no configured checks can run; do not
    fabricate a clean bill of health.

## 12. Testing requirements

-   Unit tests for each rule and matching edge cases.
-   API tests for create/list/update brand and knowledge CRUD.
-   Brand isolation tests, including cross-brand finding references.
-   Review versioning and decision persistence tests.
-   Tests for empty/oversized input and malformed requests.
-   AI absent, timeout, invalid JSON, unknown evidence ID, and valid
    output tests.
-   Frontend tests for loading, empty, error, findings, and saved
    decision states.
-   End-to-end smoke test against deployed URLs.

## 13. Architecture constraints

No P0 dependency on vector DB, graph DB, Redis, queues, authentication
provider, OCR, or external integrations. Add complexity only after the
brand-agnostic core workflow passes on production.

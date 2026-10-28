# Inkloom Guardian --- Round 2 Implementation Plan

**Primary rule:** Implement a real brand-agnostic workflow before adding
visual polish or stretch features. Every stage must work for arbitrary
brand records, not just a demo fixture.

## 0. Release target

A fresh visitor opens the deployed URL, creates or selects a brand, adds
knowledge, reviews content, sees actual evidence-backed findings,
edits/rechecks, records a human decision, refreshes, and sees persistent
history. Optional demo data can accelerate evaluation but is not
required for product functionality.

## 1. Scope lock

### P0

-   Brand list/create/select/update.
-   Brand-scoped knowledge list/create/update/deactivate for supported
    record types.
-   Text editor and review creation.
-   Brand-independent deterministic rules.
-   Actual findings with evidence.
-   Versioning and human decision history.
-   Persistence and brand-isolation tests.
-   Public deployment, health endpoint, and smoke tests.

### P1 after P0 works

-   Optional AI review and suggested rewrites.
-   Text/Markdown upload.
-   Optional brand identity customization polish.

### P2

-   Change Impact Radar, graph visualization, OCR/image analysis,
    accounts/roles, publishing integrations, analytics.

## 2. Phase 1 --- Repository and local baseline

1.  Create one GitHub repository with `/frontend`, `/backend`, `/docs`.
2.  Add the current PRD, TRD, Design, and implementation plan.
3.  Add README with local setup, architecture, environment variables,
    tests, migration/seed commands, and deployment steps.
4.  Add `.gitignore` for `.env`, virtual environments, `node_modules`,
    build outputs, and local data.
5.  Create `.env.example` files with placeholders only.
6.  Pin tested dependencies and select one dependency management method
    per language.
7.  Implement `GET /health` and a frontend service-status component.
8.  Confirm a fresh clone starts both services.

**Gate 1:** Fresh clone runs locally; frontend correctly reports backend
health and handles backend-down state.

## 3. Phase 2 --- Database and migration strategy

1.  Create Supabase PostgreSQL project.
2.  Implement SQLAlchemy models for `brands`, `knowledge_items`,
    `review_groups`, `reviews`, `findings`, `decisions`, and
    `audit_events`.
3.  Add indexes for brand-scoped lookups and constraints for version
    uniqueness.
4.  Add Alembic migrations.
5.  Implement migrations for an empty database and test applying them
    from scratch.
6.  Ensure all review and knowledge relationships enforce brand
    consistency in service code and, where practical, database
    constraints.
7.  Create an optional demo fixture file under `backend/app/seed/`; keep
    sample company name, phrases, values, and sample draft only in that
    fixture.
8.  Implement an idempotent seed command that only upserts known demo
    fixture IDs/slugs and never wipes the database.
9.  Verify seed can be disabled and that the app still supports
    user-created brands.

**Gate 2:** Empty database migrates successfully; demo seeding twice
creates no duplicates; seed disabled leaves the application functional.

## 4. Phase 3 --- Brand APIs and dynamic frontend selection

Implement in this order: 1. `GET /api/v1/brands` 2.
`POST /api/v1/brands` 3. `GET /api/v1/brands/{id}` 4.
`PATCH /api/v1/brands/{id}` 5. `GET /api/v1/brands/{id}/knowledge` 6.
`POST /api/v1/brands/{id}/knowledge` 7.
`PATCH /api/v1/brands/{id}/knowledge/{item_id}` 8. `DELETE` or
deactivate a knowledge item safely.

Then build: - brand selector from API data; - create-brand form; - brand
identity fallback when optional fields are absent; - knowledge list and
add/edit forms; - loading, empty, and error states.

Do not use a frontend constant array as the source of truth for brands
or knowledge. Demo fixture data must come through the same API as other
records.

**Gate 3:** Create two brands with different knowledge; select each and
confirm the UI shows only its stored data. This works without
redeployment.

## 5. Phase 4 --- Brand-independent deterministic rules

1.  Define schemas/enums for knowledge kinds, findings, severity, claim
    status, and rule configuration.
2.  Implement functions that receive content plus the selected brand's
    active knowledge.
3.  Add prohibited-term and preferred-term checks with normalized
    matching and appropriate boundaries.
4.  Add required-phrase and disclaimer checks.
5.  Add only explicitly supported configured fact-conflict rules; do not
    infer every numeric difference is wrong.
6.  Link every finding to the correct knowledge item or explicit system
    rule.
7.  Keep demo-specific terms and expected outputs out of engine code and
    unit tests' production module; put fixture-specific assertions in
    fixture tests.
8.  Add unit tests with multiple unrelated brands, different phrases,
    case/punctuation edge cases, unrelated numbers, and empty knowledge.
9.  Verify no findings are generated when there are no applicable
    checks, and show limited-coverage status rather than universal
    compliance.

**Gate 4:** The same engine handles at least two brands with distinct
rules; changing a stored rule changes subsequent results for only that
brand.

## 6. Phase 5 --- Review APIs, versioning, and decisions

1.  Implement review group creation and immutable review snapshots.
2.  Implement `POST /api/v1/reviews`, running deterministic rules for
    the supplied brand.
3.  Persist findings in the same transaction as the review.
4.  Implement `GET /api/v1/reviews/{id}`.
5.  Implement history by review group and review listing filtered by
    brand.
6.  Implement decision recording and audit events.
7.  Validate all supplied IDs and ensure the review, brand, and
    knowledge references are consistent.
8.  Test empty/oversized content, malformed requests, unknown IDs,
    cross-brand references, DB failures, duplicate submissions, and
    version sequencing.
9.  Ensure decisions attach to the exact reviewed version and survive
    refresh.

**Gate 5:** API tests prove content snapshots, findings, decisions, and
history persist and cannot cross brand boundaries.

## 7. Phase 6 --- Main workbench frontend

1.  Build the shared app shell and brand selector.
2.  Load brands and knowledge from API only.
3.  Build editor, title field, character count, and submit action.
4.  Wire the editor to the real review endpoint.
5.  Render returned findings and evidence dynamically; do not hardcode
    result cards.
6.  Add loading, validation, no-knowledge, no-findings, API-error, and
    rules-only states.
7.  Preserve draft text when a request fails.
8.  Implement human decision actions and only show saved confirmation
    after API success.
9.  Implement version history from persisted API data.
10. Add Brand Knowledge and Brand Settings views.
11. Add responsive layout, keyboard navigation, labels, focus states,
    and contrast checks.
12. Run the flow with no demo seed and with two different seeded/test
    brands.

**Gate 6:** A tester can create a brand, add a rule, review content,
inspect the source, edit/recheck, record a decision, refresh, and see
history without verbal help.

## 8. Phase 7 --- Optional AI layer

Only begin once Gate 6 passes.

1.  Choose one provider based on available credentials and budget.
2.  Add provider secret only to backend environment.
3.  Define a validated structured output schema.
4.  Send content and relevant knowledge for the selected brand only.
5.  Reject unknown evidence IDs and malformed responses.
6.  Label unsupported claims `unverified`; do not treat absence of
    evidence as falsity.
7.  Set bounded timeout and output limits.
8.  Handle missing key, timeout, quota errors, and malformed output
    while preserving deterministic results.
9.  Clearly show whether AI ran, was skipped, or failed.
10. Test AI-enabled and rules-only modes.

**Gate 7:** AI is additive and cannot block the central path or silently
approve content.

## 9. Phase 8 --- Deployment without surprises

### Database

1.  Create production Supabase project.
2.  Configure a backend connection string appropriate for the selected
    SQLAlchemy driver.
3.  Run Alembic migrations through a controlled one-time/release step.
4.  Run optional demo seed only if desired.
5.  Test brand creation and knowledge persistence from the deployed
    backend.

### Backend on Render

1.  Configure backend root directory and pinned dependencies.
2.  Start Uvicorn on `0.0.0.0:$PORT`.
3.  Set database URL, exact CORS origins, content limits, and optional
    LLM environment variables.
4.  Verify `/health`, brand APIs, knowledge APIs, review, history, and
    decision endpoints using the public URL.
5.  Check logs for startup, migration, database, and CORS errors.

### Frontend on Vercel

1.  Set frontend root directory.
2.  Set `NEXT_PUBLIC_API_BASE_URL` to the public backend URL.
3.  Redeploy after changing environment variables.
4.  Open the public URL in a clean private browser session.
5.  Inspect console and Network requests for wrong API base URL, CORS
    failures, and 4xx/5xx responses.

### Production release gate

Do not declare ready based only on localhost or mock data. Test the
exact URL that will be submitted to judges.

## 10. Phase 9 --- End-to-end acceptance test

Run from a fresh browser: - \[ \] Brand list is loaded from API. - \[ \]
Empty brand list shows a create-brand path. - \[ \] Create a brand with
only a name. - \[ \] Optional identity fields missing do not break
layout. - \[ \] Add one prohibited term and one required phrase to Brand
A. - \[ \] Review text that violates those rules; findings cite Brand
A's real knowledge items. - \[ \] Create Brand B with different rules;
no Brand A finding/knowledge appears. - \[ \] Edit Brand A's stored
knowledge and confirm a subsequent review uses the updated rule. - \[ \]
Empty knowledge is clearly described as limited coverage, not
compliance. - \[ \] Recheck creates a new version and preserves the
previous snapshot. - \[ \] Approve, Needs changes, and Reject can be
recorded. - \[ \] Decision and note survive refresh. - \[ \] AI disabled
or unavailable mode completes the entire workflow. - \[ \] API-down
state preserves editor text and offers retry. - \[ \] Mobile view has no
horizontal scrolling. - \[ \] Keyboard users can operate primary
controls. - \[ \] No secrets or demo-only assumptions are embedded in
shared UI/business logic. - \[ \] Production health endpoint is healthy.

## 11. Definition of done

The Round 2 product is ready when a new visitor can create/select a
brand, add knowledge, run a review, inspect actual findings and sources,
edit/recheck, and record a persistent human decision. The same
implementation works for multiple brands without code changes. Optional
demo fixtures can make evaluation easier, but are not required for the
app to function.

## 12. Risk register

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Demo assumptions leak into product  Keep all fixture-specific values in
                                      seed module; add multi-brand tests

  Over-scoping                        Lock P0/P1/P2; defer graph, OCR,
                                      auth, and integrations

  AI unavailable                      Deterministic engine always runs

  Cross-brand data leak               Validate relationships and test
                                      brand isolation

  False-positive numeric checks       Explicit configured fact rules and
                                      regression tests

  Schema drift                        Alembic migrations; no manual-only
                                      schema

  CORS/wrong API URL                  Exact production origins and
                                      private-browser smoke test

  Seed duplicates or destructive      Idempotent upsert; never wipe
  reset                               unrelated rows

  Judge confusion                     Brand selector, create-brand
                                      action, sample fixture clearly
                                      labeled

  Empty knowledge mistaken for        Explicit limited-coverage state
  passing                             
  -----------------------------------------------------------------------

## 13. Session cadence

At the end of each work session: 1. Commit working code with a
descriptive message. 2. Run backend tests and frontend checks. 3. Run
the newest end-to-end path. 4. Update docs when implementation differs.
5. Track what works, known failures, and the next task. 6. Mark features
complete only when connected behavior and error states work---not merely
because the UI exists.

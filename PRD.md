# Inkloom Guardian --- Product Requirements Document

**Status:** Round 2 build specification\
**Product principle:** Brand-agnostic, configuration-driven, usable
without a walkthrough.\
**Release objective:** A judge can open the public link, select or
create a brand workspace, review content against that brand's stored
knowledge, understand the findings and evidence, revise the content, and
record a human decision.

## 1. Product summary

Inkloom Guardian is a brand-governance workbench for reviewing content
against a selected organization's approved guidelines, facts,
terminology, claims, disclaimers, and assets. The product must support
different brands and industries without source-code changes for each
brand.

The core path is: **select/create brand → provide content → run checks →
inspect evidence-backed findings → revise/recheck → record human
decision**.

## 2. Problem and users

Marketing teams, content creators, agencies, and brand managers need to
keep content consistent with changing brand guidance and approved facts.
Manual review is repetitive and can miss prohibited wording, stale
facts, unsupported claims, missing disclaimers, and guideline
violations.

The product assists reviewers; it does not certify legal compliance or
replace human judgment.

## 3. Goals and non-goals

### P0 goals

1.  Public demo usable without login or verbal instructions.
2.  Brand selection from backend-provided records.
3.  Create a brand workspace without changing source code.
4.  Add, view, and update the brand's supported knowledge items.
5.  Submit text and check it against the selected brand's knowledge.
6.  Show actual findings with severity, explanation, content excerpt,
    evidence/source, and optional correction.
7.  Clearly distinguish contradicted claims from unverified claims.
8.  Edit and recheck content with version history.
9.  Record `Approve`, `Needs changes`, or `Reject`, including optional
    notes.
10. Persist brands, knowledge, reviews, findings, and decisions in the
    database.
11. Continue deterministic checks when AI is unavailable or
    unconfigured.
12. Deploy reproducibly with health checks and a documented smoke test.

### P1 goals, only after P0 is stable

-   Optional LLM-assisted semantic review and suggested rewrites.
-   `.txt` and `.md` uploads.
-   Brand identity customization such as logo, colors, and typography.
-   Optional import of simple guideline documents if parsing can be made
    reliable.

### Non-goals for Round 2

-   SSO, billing, team permissions, multi-tenant enterprise security, or
    publishing integrations.
-   Automatic discovery of external content.
-   Custom model training, calibrated truth scores, or legal
    certification.
-   Advanced graph visualization, OCR/image matching, video/audio
    review, or analytics dashboards.
-   Any UI that presents a hardcoded demo brand as the only supported
    brand.

## 4. Brand-agnostic product principles

-   **No brand-specific branches:** Shared UI and business logic must
    not contain conditions tied to a particular company, industry,
    product, price, phrase, or demo record.
-   **Data-driven identity:** Brand names, logos, descriptions, optional
    colors, and identity details come from stored brand configuration.
-   **Data-driven governance:** Guidelines, approved facts, terminology,
    claims, disclaimers, and assets are records associated with a brand.
-   **Actual results only:** Findings and review summaries must be
    derived from the review engine/API response, never hardcoded into UI
    components.
-   **Demo data is optional:** Demo seed records live in an isolated
    seed/configuration module and can be replaced without code changes.
-   **Missing information is valid:** Empty knowledge categories and
    missing logos/colors must have graceful states.
-   **Unknown is not false:** Lack of evidence results in `Unverified`,
    not `False`.
-   **Human decision:** AI never approves or publishes content
    automatically.
-   **Honest capability labels:** Only checks implemented by the backend
    may be shown as available.

## 5. Core user journeys

### Journey A --- Returning visitor

1.  Open the public app.
2.  Choose a brand from the brand selector.
3.  Inspect that brand's knowledge summary.
4.  Paste or edit content, then run a review.
5.  Read findings and source evidence.
6.  Edit content and recheck; a new version is created.
7.  Record a human decision and optional note.
8.  Refresh and confirm the review and decision persist.

### Journey B --- New brand

1.  Select `Create brand`.
2.  Enter a required brand name and optional description/industry.
3.  Save and enter the new brand workspace.
4.  Add supported knowledge items: guideline, approved fact, preferred
    term, prohibited term/claim, required phrase/disclaimer, or approved
    asset reference.
5.  Review content against the new brand.
6.  See a helpful empty-knowledge warning if there are not yet any
    applicable checks; do not invent findings.

### Journey C --- Demo

1.  Select an explicitly labeled sample workspace if demo seed data is
    enabled.
2.  Load the sample draft from demo configuration.
3.  Run the same review API and rules engine used for any other brand.
4.  Findings come from the brand's stored knowledge and actual engine
    results.
5.  Demo fixtures must not be imported into or silently applied to a
    newly created brand.

## 6. Functional requirements

### FR-1: Brand list and selection

-   `GET` the available brands from the backend.
-   Display name and optional logo/industry from returned records.
-   Support loading, empty, and error states.
-   If no brands exist, show a create-brand path rather than a fake
    brand.
-   If demo seed data exists, mark it clearly as a demo/sample
    workspace.

**Acceptance:** Creating a second brand and selecting it updates the
workspace identity and knowledge without a code change or redeployment.

### FR-2: Create and update brand

-   Required: brand name.
-   Optional: description, industry, logo URL, color tokens, typography
    preferences.
-   Validate input and enforce length limits.
-   Brand identity fields must be optional and safely defaulted.
-   Brand colors are presentation hints; they cannot override semantic
    warning/error states or accessibility contrast.
-   Do not accept arbitrary executable markup, scripts, or unsafe CSS.

**Acceptance:** A user can create a brand with only a name; the
workspace remains usable when all optional fields are absent.

### FR-3: Brand knowledge management

-   List knowledge for the selected brand.
-   Support adding and editing supported knowledge items in P0, unless
    explicitly deferred before implementation.
-   Knowledge kinds: `guideline`, `fact`, `claim`, `preferred_term`,
    `prohibited_term`, `required_phrase`, `disclaimer`,
    `asset_reference`.
-   Store source label, content/value, active state, and optional
    metadata.
-   The UI must only advertise automated enforcement for rule types
    actually implemented.
-   Empty categories show an explanation and an action to add an item.

**Acceptance:** A reviewer can add a prohibited term to one brand, rerun
a review for that brand, and observe the new finding; another brand is
unaffected.

### FR-4: Content submission and versioning

-   Accept title and plain text content.
-   Initial maximum: 12,000 characters, configurable server-side.
-   Each review stores an immutable content snapshot and version number.
-   A new draft starts a review group; recheck creates a new version in
    that group.
-   Paste remains the primary path. `.txt`/`.md` upload is optional P1.
-   Reject empty or oversized content with a useful message.

**Acceptance:** Invalid input is handled without crash or silent
truncation; rechecks preserve history.

### FR-5: Deterministic checks

Implement reusable, brand-independent checks that operate only on the
selected brand's active knowledge: - prohibited term/phrase; - preferred
terminology; - required phrase/disclaimer; - explicitly configured
fact-conflict rules; - supported deterministic guideline rules such as
maximum length or required wording.

Every finding references a real knowledge item or an explicit system
rule. Do not assume any particular price, company, phrase, product,
currency, or industry. Numeric conflicts must use explicit configured
fact patterns, not a naive "all numbers must match" rule.

**Acceptance:** The same engine works for two brands with different
terms and facts; changing one brand's knowledge affects only that
brand's future reviews.

### FR-6: Optional AI review

-   AI is additive, not required for the central workflow.
-   Send the draft and relevant knowledge from the selected brand only.
-   Validate structured output against a schema.
-   Model evidence references must point to supplied knowledge IDs.
-   AI may identify potential issues or suggest edits, but cannot invent
    approved facts or set a review to approved.
-   If the provider is missing, times out, or returns invalid output,
    deterministic findings remain available and the UI labels AI as
    skipped/unavailable.
-   Do not present uncalibrated model confidence as a factual
    probability.

**Acceptance:** Rules-only mode completes the whole workflow. When
configured, AI findings are clearly labeled and validated.

### FR-7: Findings

Each finding can contain: - category and severity; - title and
plain-language explanation; - affected content excerpt/location when
available; - source/evidence linked to a selected-brand knowledge
item; - claim status: `supported`, `contradicted`, `unverified`, or
`not_applicable`; - suggested rewrite, optional; - source type:
deterministic rule or AI-assisted.

The UI must render any number of findings and handle zero findings,
missing evidence, and AI-unavailable states. No hardcoded findings or
scores.

**Acceptance:** A finding's evidence is traceable to a real stored
knowledge item or an explicitly named rule.

### FR-8: Human decision and audit

-   Provide `Approve`, `Needs changes`, and `Reject`.
-   Store decision, optional note, reviewer label, timestamp, and
    reviewed version.
-   Require explicit human action; no automatic approval.
-   Show decision and history after refresh.
-   A decision applies to a specific content version.

**Acceptance:** A saved decision survives refresh and is linked to the
exact version reviewed.

### FR-9: Brand isolation

-   Every knowledge item, review, finding, and decision must be
    associated with the correct brand through validated relationships.
-   API queries must enforce the selected brand/review relationship.
-   No finding for one brand may cite another brand's knowledge.
-   This is not enterprise authentication; the public demo must be
    labeled as a shared demo. Do not imply private workspace security
    without auth and authorization.

**Acceptance:** Automated tests prove that a review for Brand A cannot
retrieve or cite Brand B's knowledge.

### FR-10: Resilience and deployment

-   `/health` reports service/database status without secrets.
-   Frontend API URL is environment-configured.
-   Secrets stay server-side.
-   CORS allowlist, request validation, content limits, bounded AI
    timeout, and user-friendly errors.
-   Migrations and demo seeding are repeatable.
-   No dependence on local files or developer-only state.

**Acceptance:** A fresh deployment passes the complete public smoke
test.

## 7. Primary screens

### A. Brand Review Workbench

-   Brand selector and optional identity preview.
-   Brand-specific knowledge summary loaded from API.
-   Content title/editor and `Check content` action.
-   Actual review findings with evidence.
-   Human decision controls and version history.
-   Clear service and AI status.
-   First-run instructions and optional sample draft only when demo
    fixtures are available.

### B. Brand Knowledge

-   List and filter knowledge records for selected brand.
-   Add/edit supported record types.
-   Show source label, active status, and how a record is checked.
-   Empty state with `Add knowledge`.
-   Never show a predefined company-specific list as universal content.

### C. Brand Settings / Identity

-   Basic brand name, description, industry, optional logo and visual
    tokens.
-   Save and reload from API.
-   Neutral defaults for missing values.

### D. Review History

-   Reviews filtered by selected brand.
-   Version, timestamp, finding count, status, and decision.
-   Selecting a review loads actual stored details.

Avoid an empty analytics dashboard. The review workbench is the primary
entry point.

## 8. Optional demo fixture

Demo seed data is only a fixture used to demonstrate the generic
product. It must live in a dedicated seed file/command, be explicitly
labeled, and be removable/replaced without modifying application code.

Example fixture can include an invented sample brand, one approved
numeric fact, a prohibited phrase, a preferred term, and a required
disclaimer. All checks must still run through the same generic database
and rules engine. The brand name and sample values must never appear as
constants in shared frontend components or business logic.

## 9. Security, privacy, accessibility

-   Use fictional demo data and warn against confidential content in the
    shared public demo.
-   Escape user content; never render raw HTML or scripts from
    content/model output.
-   No secret keys in frontend bundles.
-   Validate uploads and request sizes; rate-limit review creation.
-   Keyboard-accessible controls, visible focus, semantic labels,
    adequate contrast, and non-color status indicators.
-   Do not claim certification or legal compliance.
-   Explain that AI may miss issues and that a human owns the decision.
-   Avoid collecting more user data than needed.

## 10. Release metrics and acceptance gates

-   Fresh visitor completes brand selection → review → evidence →
    recheck → decision without verbal help.
-   Creating a brand and adding a rule requires no code changes.
-   Two brands with different rules remain isolated.
-   Deterministic results are repeatable.
-   AI-off mode works.
-   Review and decision persist after refresh.
-   Empty/malformed/oversized inputs produce safe errors.
-   Deployed smoke test passes on the exact submitted URL.

## 11. Priorities

**P0:** brand list/create/select, basic knowledge CRUD, deterministic
checks, actual findings/evidence, review versions, human
decision/history, persistence, deploy and smoke tests.\
**P1:** AI review, rewrites, text/Markdown upload, optional brand
identity customization beyond basic fields.\
**P2:** external-content impact radar, graph visualization, OCR/visual
assets, team auth, publishing integrations, analytics.

## 12. Definition of done

The product is ready when a new user can create or select a brand, add
brand-specific knowledge, review content, understand evidence-backed
results, revise and recheck, and record a decision that persists. A
sample brand may make the demo faster, but the application must not
depend on that sample brand to function.

# Inkloom Guardian --- Design Specification for Stitch

**Purpose:** Generate a cohesive, responsive interface for a
brand-agnostic governance workbench.\
**Core requirement:** The UI must not be designed around a particular
customer, fictional company, product, industry, price, or fixed set of
brand rules.

## 1. Product experience

The main experience is: select or create a brand → add or inspect its
approved knowledge → submit content → check it → inspect evidence-backed
findings → revise/recheck → record a human decision.

The application should feel like a serious AI governance tool, not a
generic chatbot or an empty analytics dashboard. The design is a visual
system and interaction specification; all data and actions must be wired
to the API during implementation.

## 2. Brand-agnostic design rules

Never embed a customer-specific brand name, logo, product, price,
industry, claim, guideline, prohibited phrase, or review finding in
shared UI components.

All customer/brand-specific data must be loaded from API responses: -
brand name and optional logo/description/industry; - optional visual
identity tokens; - brand knowledge and source labels; - review findings,
evidence, and suggested rewrites; - review versions, decisions, and
audit events.

Static application copy such as navigation labels, field labels, button
text, help text, and generic empty states may be defined in the
frontend.

Demo content is allowed only as an isolated, explicitly labeled sample
fixture returned by the backend. Never use demo content as the fallback
for an empty real brand or display sample findings as live results.

## 3. Visual system

### Application shell

Use a consistent application-owned theme that is independent of customer
brands: - Obsidian `#101211` --- primary dark surfaces. - Graphite
`#242A26` --- panels and elevated surfaces. - Electric lime `#C6FF4D`
--- primary action and selected-state accent. - Mist `#F2F4EF` ---
readable light surface/text. - Muted text `#A8B0A7`. - Semantic warning
amber and critical red used sparingly and consistently.

The application theme governs navigation and common controls. A brand's
optional colors may appear in a brand identity preview, but must not
override semantic statuses or cause contrast failures. Missing brand
colors use neutral defaults.

Typography: Space Grotesk or similar for headings; Inter or equivalent
for UI/body. Use restrained borders, moderate 10--14 px card radii, a
consistent spacing scale, visible focus, and readable text. Avoid
decorative neon overload, glassmorphism, random gradients, robot
mascots, and stock-photo hero sections.

## 4. Primary screen: Brand Review Workbench

This is the default workspace, not a dashboard that forces users through
unrelated setup pages.

### Header and navigation

-   Application wordmark: `Inkloom Guardian`.
-   Brand selector populated from `GET /api/v1/brands`.
-   `Create brand` action.
-   Navigation: `Review`, `Brand knowledge`, `Review history`,
    `Brand settings`.
-   Status: API connected/unavailable; AI
    enabled/rules-only/unavailable.
-   If there are no brands, show the create-brand empty state. Do not
    invent a selected company.

### Workbench layout

Desktop: two-column editor and results area; secondary panels for human
decision and version history below or alongside results. Mobile:
single-column sequence.

#### Content editor

-   Title input.
-   Large plain-text editor.
-   Character count and server-defined maximum.
-   `Check content` primary action.
-   Optional `Load sample draft` action only if the API indicates that a
    demo fixture exists.
-   Privacy note appropriate for a shared public demo.
-   Preserve text when API errors occur.

#### Before review

Show a neutral instructional empty state: select/create a brand, add
relevant knowledge, and submit a draft. If the selected brand has no
active knowledge, explain that review coverage will be limited and link
to `Brand knowledge`. Do not show fabricated findings.

#### Findings panel

Render only findings returned by the backend: - summary counts computed
from returned findings; - category/severity and clear title; - affected
excerpt or location, if provided; - plain-language explanation; -
`Approved source` or `Source rule` block linked to real evidence when
available; - optional suggested rewrite with an explicit
`Apply suggestion` action; - label `Rule check` or `AI-assisted`.

Support arbitrary finding counts and categories. Include states for
findings, no findings detected, no configured checks, missing evidence,
AI unavailable, and review error. A no-findings message must say that
configured checks found no issues, not certify the content as
universally correct.

#### Human decision

-   Explanation: a human makes the final decision.
-   Actions: `Approve`, `Needs changes`, `Reject`.
-   Optional note.
-   Confirmation from API response including decision and timestamp.
-   Do not show a saved-success state until the API confirms
    persistence.

#### Version history

-   Version, timestamp, finding count, and decision/status from API
    data.
-   Selecting an earlier version shows its stored snapshot and results.
-   Warn before replacing unsaved editor text if needed.

## 5. Brand creation and identity

Create a compact modal or page with: - Required brand name. - Optional
description and industry. - Optional logo URL. - Optional brand colors
and typography preferences. - Save and cancel actions. - Inline
validation and safe errors.

Do not require logo, industry, custom colors, or any specific company
field to create a usable brand. Provide neutral identity placeholders
when optional fields are missing. Validate URLs and use safe fallback
behavior for broken images.

## 6. Brand Knowledge screen

Load records for the selected brand from the API. Group available
records by generic category: - Guidelines - Approved facts - Approved
claims - Preferred terminology - Prohibited terminology/claims -
Required phrases and disclaimers - Approved asset references

Each record displays its actual title, content/value, source label,
active status, and supported check behavior. Show only categories with
records or a generic `Add knowledge` affordance. Do not hardcode example
records into the shared screen.

Support adding/editing the record types actually implemented by the
backend. Clearly distinguish stored knowledge from checks the engine can
automatically enforce.

Empty state: `No knowledge added yet` with a short explanation and
`Add knowledge` action.

## 7. Brand settings screen

Load/save brand identity fields through the API: - name; -
description; - industry; - optional logo; - optional validated
color/typography tokens.

Do not accept or display arbitrary CSS/HTML. If brand colors are
unavailable, the application theme remains unchanged. Brand identity
preview is optional and cannot reduce readability.

## 8. Review History screen

Show reviews for the selected brand only: - draft title; - version; -
date/time; - finding count; - latest human decision/status.

All rows must come from API data. Provide loading, empty, and error
states. Clicking a row opens the actual review. Never populate this view
with fake metrics or placeholder reviews that look real.

## 9. Required states

Design coherent variants for: 1. No brands yet. 2. Brand list
loading/error. 3. Create brand form and validation error. 4. Brand
selected with knowledge. 5. Brand selected with no knowledge. 6. Editor
ready. 7. Review submitting. 8. Findings returned. 9. No findings
detected. 10. No configured checks / insufficient knowledge. 11. AI
skipped/unavailable while deterministic checks complete. 12.
API/database error with retry. 13. Applying a suggested rewrite. 14.
Decision pending. 15. Decision saved. 16. Review history
empty/loading/error. 17. Missing logo or invalid optional identity
fields.

## 10. Responsive and accessible behavior

-   Desktop sidebar and readable two-column workspace.
-   Tablet collapsible navigation and stackable panels.
-   Mobile single-column flow with no horizontal scrolling.
-   Semantic headings, labeled inputs, keyboard-accessible controls,
    visible focus, and sufficient contrast.
-   Status is communicated with text/icons as well as color.
-   Errors state what happened and how to recover.
-   Respect reduced-motion preferences.

## 11. Component system

Reusable components may include: - `AppShell`, `BrandSelector`,
`BrandIdentity`, `CreateBrandForm` - `ServiceStatus`,
`KnowledgeSummary`, `KnowledgeItemCard`, `KnowledgeEditor` -
`ContentEditor`, `CharacterCount`, `FindingSummary`, `FindingCard` -
`EvidenceBlock`, `SuggestedRewrite`, `DecisionPanel`, `AuditTimeline` -
`VersionHistory`, `LoadingState`, `EmptyState`, `ErrorBanner`, `Toast`

Components receive typed props and render supplied data. They must not
import demo fixtures or branch on company names.

## 12. Copy guidance

Use precise language: - `Check content`, not `Run AI magic`. -
`Approved source`, not vague `AI context`. - `Unverified claim`, not
`False claim` when evidence is missing. - `Rules-only mode`, not an
implication that AI ran. - `No issues found in configured checks`, not
`100% compliant`.

Never display fabricated evidence, fake confidence percentages,
hardcoded compliance scores, or mock findings as live results.

## 13. Stitch generation request

Generate a high-fidelity responsive web application for Inkloom Guardian
with the Brand Review Workbench as the main view, plus Brand Knowledge,
Create Brand/Brand Settings, and Review History views.

Use the Obsidian × Electric Lime application-owned design system. Keep
the UI brand-agnostic: use neutral placeholders or clearly labeled
generic example content only in a separate demo state. Do not make a
specific company the permanent default or embed specific products,
prices, phrases, findings, or industries into shared components.

Represent all required loading, empty, error, findings, rules-only, and
decision-saved states. Use dynamic data slots for brand identity,
knowledge items, findings, and decisions. Make every screen plausible to
wire to the API contracts in `TRD.md`; generated mock data is for visual
preview only and must not be treated as production behavior.

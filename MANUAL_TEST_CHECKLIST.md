# Inkloom Guardian — Manual Test Checklist (Judge Evaluation Guide)

This checklist provides a step-by-step walkthrough for evaluating the resilience, reliability, and user experience of **Inkloom Guardian**. Each scenario tests edge cases, unexpected user behavior, and error recovery.

---

## Pre-Requisites & Environment

- **Frontend URL**: `http://localhost:3000` (or production deployment)
- **Backend URL**: `http://localhost:8000`
- **Supported Browsers**: Chrome, Firefox, Safari, Edge

---

## Test Suite 1: Authentication & Session Resilience

| Step | Action | Expected Behavior | Result |
|---|---|---|---|
| 1.1 | Open the application root (`/`). | The split-screen Login page appears with the Inkloom Guardian brand on the left and credentials on the right. | [ ] Pass |
| 1.2 | Click **"Sign In with Demo Credentials"** (or use `demo@inkloom.io` / `guardian-demo-2026`). | Authenticates instantly and redirects to the governance dashboard. | [ ] Pass |
| 1.3 | Refresh the browser (`F5` or `Ctrl+R`). | The user session remains logged in; no unexpected redirect back to login. | [ ] Pass |
| 1.4 | Click the user profile pill in the top header and click **"Sign Out"**. | Session clears and returns cleanly to the login screen. | [ ] Pass |

---

## Test Suite 2: Form Validation & Bad Input Resilience

| Step | Action | Expected Behavior | Result |
|---|---|---|---|
| 2.1 | Click **"+ New Brand"** in the sidebar. | The "Create Brand Workspace" modal opens. | [ ] Pass |
| 2.2 | Leave the Brand Name empty or enter only spaces (`"   "`), then click Submit. | Submission is blocked; clean validation banner: *"Brand name cannot be empty or whitespace only."* | [ ] Pass |
| 2.3 | Enter a valid brand name (`"Test Brand Alpha"`) and submit. | Brand is created, automatically selected, and stored in `localStorage`. | [ ] Pass |
| 2.4 | In the Review Workbench, leave the Content editor blank and click **"Check Content"**. | Submission is blocked; error banner indicates: *"Please enter content to review."* | [ ] Pass |
| 2.5 | Go to **Brand Knowledge Repository** -> click **"Add knowledge item"**. | Add Knowledge modal opens. | [ ] Pass |
| 2.6 | Select **"Approved Fact"** and enter an invalid regex pattern in conflict patterns (or malformed string). | Schema validation rejects the pattern with an informative message rather than crashing the database. | [ ] Pass |

---

## Test Suite 3: Multi-Tenant Brand Isolation & State Reset

| Step | Action | Expected Behavior | Result |
|---|---|---|---|
| 3.1 | Select **Acme Enterprise Core** from the sidebar. | Active brand switches to Acme. Ribbon shows linked knowledge count. | [ ] Pass |
| 3.2 | Click **"Load sample draft"** and click **"Check content"**. | Findings load for Acme Enterprise Core (e.g. prohibited SLA terms, disclaimers). | [ ] Pass |
| 3.3 | Switch active brand in the sidebar to **NovaGlow Skincare**. | The workbench immediately resets: previous findings, draft text, and history are cleared. **No Brand A findings leak into Brand B.** | [ ] Pass |
| 3.4 | Refresh the browser while NovaGlow Skincare is selected. | NovaGlow Skincare remains the selected brand upon reload (retained via `localStorage`). | [ ] Pass |

---

## Test Suite 4: Review Workflow & One-Click Suggested Corrections

| Step | Action | Expected Behavior | Result |
|---|---|---|---|
| 4.1 | Select **Acme Enterprise Core** and load the demo draft. Click **"Check content"**. | Findings appear on the right column sorted by severity (Critical, Warning, Terminology). | [ ] Pass |
| 4.2 | On any finding with a suggested rewrite, click **"Apply suggestion"**. | The draft in the editor is atomically updated with the approved wording. | [ ] Pass |
| 4.3 | Check the suggestion button state. | The button changes to **"Applied ✓"** with green accent and is disabled to prevent duplicate replacements. | [ ] Pass |
| 4.4 | Click **"Check content"** again with the corrected text. | Engine evaluates Version 2.0; the resolved finding disappears and the health score increases. | [ ] Pass |

---

## Test Suite 5: Human Governance Gate & Rapid-Click Idempotency

| Step | Action | Expected Behavior | Result |
|---|---|---|---|
| 5.1 | Scroll to the **Human Governance Gate** below the findings. | Officer verdict options (`Approved`, `Needs Changes`, `Rejected`) and notes box are visible. | [ ] Pass |
| 5.2 | Select **"Needs Changes"**, add a brief note, and click **"Record Official Verdict"**. | Verdict is committed to the immutable audit ledger with a success confirmation toast. | [ ] Pass |
| 5.3 | Rapidly double-click or triple-click the record verdict button. | The button is disabled while saving (`isRecordingDecision`), and the backend idempotency guard prevents duplicate records. | [ ] Pass |
| 5.4 | Check the **Version Rail** on the right. | The version snapshot displays the human verdict badge (`needs changes`). | [ ] Pass |

---

## Test Suite 6: Review History & Snapshot Deep-Linking

| Step | Action | Expected Behavior | Result |
|---|---|---|---|
| 6.1 | Navigate to the **Review History** tab. | Historical table displays all prior review versions, timestamps, finding counts, and verdicts. | [ ] Pass |
| 6.2 | Click **"View Snapshot"** on any past review version. | Switches to the Review Workbench and loads that exact version's draft, title, and findings into the workbench. | [ ] Pass |
| 6.3 | Return to **Review History** and click **"Export Audit Telemetry"**. | Browser downloads `inkloom_audit_<brand>_<timestamp>.json` containing full JSON audit logs. | [ ] Pass |
| 6.4 | Switch to a brand with 0 reviews. | Clean empty state displays an **"Open Review Workbench"** CTA button with no dead ends. | [ ] Pass |

---

## Test Suite 7: Multi-Modal Asset Inspection (OCR)

| Step | Action | Expected Behavior | Result |
|---|---|---|---|
| 7.1 | Navigate to the **Asset Inspection** tab. | Multi-modal dropzone and inspection workbench appear. | [ ] Pass |
| 7.2 | Drag and drop or upload an image asset (JPEG, PNG, or WebP). | Image preview renders immediately in the left pane. | [ ] Pass |
| 7.3 | Click **"Run Asset Inspection"**. | OCR extracts text; deterministic checks screen for brand compliance; findings display on the right. | [ ] Pass |
| 7.4 | Click **"Clear Asset"** or switch active brand. | Uploaded image and findings reset cleanly. | [ ] Pass |

---

## Test Suite 8: Knowledge Management & Deletion Safety

| Step | Action | Expected Behavior | Result |
|---|---|---|---|
| 8.1 | Navigate to **Brand Knowledge Repository**. | Filter tabs (`All`, `Prohibited Terms`, `Approved Facts`, `Disclaimers`) and cards display. | [ ] Pass |
| 8.2 | Click the **Active / Disabled** toggle on any knowledge item. | Item active status toggles instantly and updates compliance checks. | [ ] Pass |
| 8.3 | Click the **Trash icon** on any knowledge item. | A **confirmation modal** appears: *"Permanently Delete Rule? This action removes this rule permanently from compliance checks."* | [ ] Pass |
| 8.4 | Click **"Cancel"**. | Modal closes; rule remains untouched. | [ ] Pass |
| 8.5 | Click trash icon again and click **"Delete Permanently"**. | Rule is deleted from the database and removed from the UI. | [ ] Pass |

---

## Test Suite 9: Brand Workspace Deletion (Danger Zone)

| Step | Action | Expected Behavior | Result |
|---|---|---|---|
| 9.1 | Navigate to **Brand Settings** tab. | Brand configuration form and visual identity preview display. | [ ] Pass |
| 9.2 | Scroll down to the **Danger Zone** section. | Red-bordered card with *"Delete Brand Workspace"* button appears. | [ ] Pass |
| 9.3 | Click **"Delete Brand Workspace"**. | Modal asks for confirmation, warning that all rules and reviews will be removed. | [ ] Pass |
| 9.4 | Confirm deletion. | Brand is removed from database; UI falls back gracefully to the next available workspace without crashing. | [ ] Pass |


# HYG.3 — Web Structure

**Covers:** public marketing site + authenticated staff web app (dashboard) + the patient-facing consumer app (`/client`).

> **v0.3 note (2026-09-10):** this doc previously said "no patient-facing pages, per PRD §6/§13." That is no longer true — a full patient portal exists (see PRD **§6A**). §4 below is rewritten to the real route tree; §1 and §3.3 are corrected. The staff app (§3) is unchanged.

---

## 1. Structure Principles

- Three surfaces, **separate concerns**: (1) marketing sells the vision (Wellness Before Illness); (2) the staff app delivers operational/commercial intelligence + the pharmacist review queue; (3) the patient consumer app (`/client`, PRD §6A) is preventive wellness tracking, pharmacist-gated. Marketing copy must not promise features the product doesn't have (e.g. no "AI predicts your vitamin deficiency" — conflicts with PRD §13).
- Staff app navigation is **role-aware**: the two roles live in production are **Lead Clinician** and **Pharmacist** (`REVIEWER_ROLES`, `server/routes/insights.ts`); the earlier `org_admin / analyst / it_admin` set was never seeded. Review actions (Accept / Modify / Reject, telemedicine scheduling) are gated to those roles.
- The patient app has **no login/MFA** — the Phase 1 consumer flow carries `patientId` in `localStorage` and passes it explicitly on every request (`server/routes/wearables.ts` header comment; PRD Phase 3 would add real patient auth).
- Every authenticated staff page maps to an endpoint group in `api-architecture.md`; every `/client` page maps to a `/v1` route that takes `patientId` explicitly.

---

## 2. Public Marketing Site (hyg3.[domain])

```
/                          Home — brand story, "Wellness Before Illness / Vitamin & Supplement Intelligence"
/product                   What HYG.3 does (maps 1:1 to MVP Definition, PRD §6 — no overclaiming)
/how-it-works              Data → Consent → AI → Human Review → Action (PRD §7 workflow, visualized)
/who-its-for               Segment pages: pharmacy, wellness retailer, hospital pharmacy dept, lab
   /who-its-for/pharmacy
   /who-its-for/wellness-retailer
   /who-its-for/hospital-pharmacy
/trust                     Privacy, security, data-ownership posture (partner-controlled data, not centralized — PRD §8 equivalent)
   /trust/privacy
   /trust/security
   /trust/data-ownership
/pricing                   Commercial model (implementation + SaaS + usage tier, PRD §11)
/about                     Company (Libralytics), mission, HYG.3 brand
/contact                   Pilot partner inquiry form
/legal
   /legal/terms
   /legal/privacy-policy
   /legal/dpa                Data Processing Agreement template/reference
```

**Content guardrail:** every claim on `/product` and `/how-it-works` should be checkable against the current PRD MVP Definition. If a claim requires a Phase 3+ feature, it's labeled "coming" or omitted — not implied as live.

---

## 3. Authenticated Staff App (hyg-3.vercel.app/app)

> **Path note:** staff routes are mounted under `/app/*` (`src/App.tsx`), e.g. `/app/ai-insights`, `/app/patients` — the bare `/dashboard`, `/ai-insights` paths in §3.2 below predate that and read as `/app/dashboard` etc. Roles: **Lead Clinician** / **Pharmacist** (see §1), not the `org_admin / analyst / it_admin` set shown here. This section is otherwise as originally written; only the consumer app (§4) was rewritten in v0.3.

### 3.1 Global shell

```
Left nav (role-aware):
  Dashboard
  Datasets
  AI Insights
  Reports
  Audit (org_admin / it_admin only)
  Organization Settings (org_admin only)
  Team / Users (org_admin only)
```

### 3.2 Page tree

```
/login
/mfa

/dashboard                          -- default landing: operational + sales KPI summary
   /dashboard/sales-trends          -- supplement/vitamin sales trend widgets
   /dashboard/data-quality          -- data-quality score overview

/datasets                           -- maps to GET /v1/orgs/:orgId/datasets
   /datasets/new                    -- CSV upload / API source config wizard
   /datasets/:datasetId             -- detail: schema, row count, lineage
   /datasets/:datasetId/quality     -- maps to /datasets/:datasetId/quality-report

/ai-insights                        -- maps to GET /v1/orgs/:orgId/ai/outputs
   /ai-insights/:aiOutputId         -- full explainability view:
                                        WHY / WHAT DATA / WHAT PATTERN /
                                        WHAT CONFIDENCE / WHAT'S MISSING /
                                        ALTERNATIVES / WHAT TO VERIFY
                                        + Accept / Modify / Reject action
                                          (maps to POST .../review)

/reports
   /reports/weekly-summary          -- exportable version of Journey B (PRD §8)

/audit                              -- org_admin / it_admin / Libralytics compliance only
   /audit/access-logs               -- maps to GET /v1/orgs/:orgId/audit/access-logs
   /audit/ai-trail/:aiOutputId      -- maps to GET /v1/orgs/:orgId/audit/ai-trail/:id

/organization
   /organization/settings
   /organization/departments
   /organization/data-retention     -- maps to data_retention_policies
   /organization/consents           -- stubbed in MVP UI, Phase 4+ functional (PRD §6, §14)

/team
   /team/users
   /team/roles-permissions

/models                             -- maps to GET /v1/orgs/:orgId/ai/models
   /models/:modelId                 -- name, version, intended use, risk classification, validation status
```

### 3.3 Patient Management (staff side — the pharmacist/clinician view of patients)

```
/app/patients                       -- List of enrolled patients
   /app/patients/:id                -- Patient detail: WHOOP/Fitbit + hand-scan biometric summary, trend sparklines
/app/ai-insights                    -- The review queue (hand-scan concepts, telemedicine requests) —
   /app/ai-insights/:id                Accept / Modify / Reject, and schedule telemedicine sessions.
                                        Non-actionable audit rows (disclaimer_acknowledgement,
                                        data_source_consent) are filtered out of this queue.
```

---

## 4. Patient Consumer App (hyg-3.vercel.app/client — PRD §6A)

A preventive wellness tracker for the end user. No login/MFA (Phase 1 — `patientId` in `localStorage`). Every risk-bearing AI output is pharmacist-gated before it appears here. Routes are defined in `src/App.tsx`; each is a lazy-loaded page under `ClientLayout`.

```
/client                             -- redirects to /client/onboard
/client/onboard                     -- sign-up + PDPA consent (Onboarding)
/client/dashboard                   -- home: telemedicine alerts, check-in card, wearables panel,
                                       Wellness Overview, health trend chart, and — once a pharmacist
                                       has approved a hand scan — the "Today" plan card + the labelled
                                       report (FACT / INFERENCE / RECOMMENDATION / UNCERTAIN, each with
                                       a "why this label?" explainer). First-view disclaimer modal
                                       gates the first Tier B+ report.
/client/scan                        -- hand-scan capture (HandScanner)
/client/checkin                     -- one-question wellness + optional adherence check-in
/client/plan                        -- "Today's Plan" detail: Morning / Evening tabs, numbered steps
                                       from real data (meal slots + pharmacist-reviewed supplements).
                                       No paywall.
/client/care                        -- Care Actions: "Talk to a Pharmacist" (async) +
                                       "Book a Telemedicine Consult" (external hand-off). Every request
                                       is audit-logged via /v1/telemedicine/request-review.
/client/sources                     -- Connected Data Sources: WHOOP / Fitbit / InBody behind one
                                       ProviderConnector registry. Full consent scope shown + an
                                       explicit per-source consent checkbox before Connect. Disconnect
                                       withdraws consent for that source only.
/client/wearables/callback          -- OAuth return landing (WHOOP / Fitbit)
```

**Backing endpoints:** `/v1/onboard`, `/v1/analysis/hand-scan`, `/v1/recommendations/:patientId/{latest,pending}`, `/v1/checkins`, `/v1/wearables/{status,sources,biometric-summary,:provider/*,connectors/:provider/*}`, `/v1/telemedicine/{request-review,alerts,disclaimer-status,disclaimer-ack}`.

**Deferred (PRD §6A.3):** an Insights category-tile hub and a goal-chip Products browse tab — both would render as empty shells against current data, so neither has a route yet.

---

## 5. Every AI-Insight Page Follows One Layout Contract

To keep the "no black box" principle enforceable in the UI, not just the API, every `/ai-insights/:id` detail page renders the same fixed sections, in this order, regardless of insight type:

1. Headline (FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY badge)
2. Supporting data (linked to source dataset/records)
3. Confidence
4. What's missing
5. Alternatives (if any)
6. What a professional should verify
7. Review action bar (Accept / Modify / Reject) — writes to `ai_output_audit`

If any field is `not_available` from the API, the page shows that explicitly rather than hiding the section — matches ai-agent-architecture.md §3.

---

## 6. Information Architecture Rationale

- **Datasets is separated from AI Insights** so a partner's IT/data lead can trust the ingestion layer independently of trusting the AI layer — supports the "partner-controlled data" trust narrative from PRD §8-equivalent positioning.
- **Audit is a first-class nav item**, not buried in settings — matches the "auditable AI system" requirement (master instructions §11) and is the single strongest trust-building screen to show a skeptical hospital/pharmacy IT lead during a pilot demo.
- **Models page exists even in MVP** with only 2–3 low-risk models registered — establishes the governance habit (name/version/risk classification/validation status) from day one so it doesn't need retrofitting when Phase 4+ models are added.

---

*See also: prd.md (§6A for the consumer app), database-schema.md, api-architecture.md, ai-agent-architecture.md, mvp-roadmap.md, decisions.md, MVP-LAUNCH-CHECKLIST.md*

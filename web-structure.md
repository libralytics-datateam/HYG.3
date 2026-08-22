# HYG.3 — Web Structure

**Covers:** public marketing site + authenticated web app (dashboard). MVP-scoped — no patient-facing pages, per PRD §6/§13.

---

## 1. Structure Principles

- Marketing site and app are **separate concerns**: marketing sells the vision (Wellness Before Illness), the app delivers only what MVP actually does (sales/operational intelligence on supplement & vitamin data). Marketing copy must not promise features the app doesn't have yet (e.g. no "AI predicts your vitamin deficiency" messaging — conflicts with PRD §13).
- App navigation is **role-aware**: what a nav item shows depends on the user's role/permissions (org_admin, analyst, it_admin), not one fixed menu for everyone.
- Every authenticated page maps to an endpoint group already defined in `api-architecture.md` — no page should exist that has no backing API.

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

## 3. Authenticated App (app.hyg3.[domain])

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

### 3.3 Patient Management

```
/patients                           -- List of enrolled clients
   /patients/:id                    -- Client detail view, showing WHOOP/Scanner data
   /patients/:id/concepts/pending   -- Pharmacist review queue for AI recommendations
```

---

## 4. Patient Portal (app.hyg3.[domain]/client)

The patient portal allows end-users to connect their wearable devices and view their pharmacist-approved custom vitamin concepts.

```
/client/login
/client/mfa
/client/dashboard                   -- View current vitamin concept and adherence
/client/integrations                -- Connect WHOOP or other wearable devices
```

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

*See also: PRD.md, database-schema.md, api-architecture.md, ai-agent-architecture.md, mvp-roadmap.md*

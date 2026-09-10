# HYG.3 — MVP Roadmap

This roadmap reflects the expanded scope of HYG.3, transitioning from a pure B2B operational analytics tool to a B2B2C patient-facing wellness platform.

---

## Phase 1: Operational Core (Month 1)
**Goal:** Establish trust with pilot partners using existing, non-sensitive data.

* **Data Engineering:** Ingest supplement sales CSVs and API exports.
* **Catalog Management:** Ingest Pharmaceutical/Vitamin catalog data.
* **Platform:** Organization tenant setup, RBAC (Role-Based Access Control).
* **AI:** Basic operational insights (Sales Trends, Anomaly Detection, Data Quality).
* **UI:** Admin Dashboards, Datasets View, AI Insights list.

---

## Phase 2: Audit & Explainability (Month 2)
**Goal:** Prove the AI is safe, trackable, and not a "black box".

* **Platform:** Implement full `ai_outputs` audit trail — done (Audit Logs page, `reviewedById` non-spoofable).
* **UI:** Build the fixed-layout Explainability View (Headline, Data, Confidence, Missing, Alternatives) — done as FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY panels per `prd.md` §6.4's actual labeling standard.
* **UI:** Build the Review Action Bar (Accept/Modify/Reject) — done (2026-08-27). Modify requires a reviewer note explaining what needs to change.
* **Compliance:** Exportable weekly summaries for partner IT/Admin teams — done (`Reports.tsx`, real JSON export).

---

## Phase 3: Patient Onboarding & PDPA (Month 3)
**Goal:** Safely introduce patient identities and obtain explicit consent.

* **Legal:** Finalize Data Processing Agreements (DPA) and explicit consent forms under Thai PDPA — **still a launch blocker** (`prd.md` §15 Q5, `MVP-LAUNCH-CHECKLIST.md`).
* **Database:** Implement `patients` table — done.
* **API:** Patient enrollment endpoints — done (`/v1/onboard`, no patient auth yet — Phase 1 `patientId`-in-`localStorage` model).
* **UI (Admin):** Patient Management dashboard for clinic/pharmacy staff — done.
* **UI (Client):** Initial Patient Portal + consent flows — done, no login (Phase 1 model).
* **Disclaimer / consent (2026-09-10):** two-step first-view disclaimer modal, shown once per report category before the first Tier B+ report, logged as an auditable `disclaimer_acknowledgement` event; step-2 CTA routes to Care Actions. See `decisions.md` "Consumer-app UX adaptation" and `prd.md` §6A.

---

## Phase 4: Biometric Integration (Month 4)
**Goal:** Connect external data sources to patient profiles.

* **Integrations:** WHOOP OAuth flow — done (2026-08-27). Fitbit OAuth — done (2026-08-28). Daily webhook ingestion — investigated, not built; blocked on the real webhook payload spec (see `MVP-LAUNCH-CHECKLIST.md` §8). On-demand sync ("Sync Now") is real and working today.
* **Integrations:** Hand Scanner data ingestion endpoints (Antioxidant scores) — done.
* **Abstraction (2026-09-10):** the per-provider integrations now sit behind one `ProviderConnector` registry (`server/services/providerConnector.ts`) — WHOOP/Fitbit as descriptors keeping their bespoke OAuth routes, InBody as the first full connector (cloud sync, API key). Adds **per-source consent** recorded at connection time as an auditable `data_source_consent` event, revocable independently (`prd.md` §6A hard gate d). See `decisions.md` "ProviderConnector interface".
* **Database:** Time-series storage for `biometric_readings` — done (`BiometricReading`, populated by hand-scan, WHOOP, Fitbit, and InBody sync).
* **UI (Client):** "Connected Data Sources" screen (`/client/sources`) — done. Shows each source's full consent scope + an explicit per-source consent checkbox before Connect; disconnect withdraws consent for that source only.

---

## Phase 5: Custom Vitamin Concepts (Month 5 - Expanded MVP Target)
**Goal:** Generate personalized, safe supplement recommendations based on biometric data.

* **Data layer (2026-08-28):** Biometric side ready — `GET /v1/patients/:id/biometric-summary` aggregates real accumulated signal (hand scans + WHOOP + a new patient self-report check-in, see below). Product-catalog side is genuinely empty (0 rows, not even seed data) — needs a real sourcing decision, most likely a pilot partner's actual catalog, not fabricated placeholder data. See `decisions.md`.
* **Data gathering (2026-08-28):** Added a self-report symptom/wellness check-in (`/client/checkin`) — direct patient-reported data (fatigue, sleep, mood, etc.) rather than inferred from wearable signals the way the old gated model did. Stored the same way as everything else (`BiometricReading`, no schema change). See `decisions.md`'s "More data gathering" entry for the full prioritized list (outcome tracking, adherence tracking, lab integration — in that order, none of the latter three built yet).
* **AI:** Build the Recommendation Engine (mapping biometrics to the product catalog) — **still no generation code written.** Scoping is done: `decisions.md`'s "Recommendation Engine Scoping" entry (2026-08-28) tiers every candidate recommendation type (A = safe rules-based nudges, B = needs pharmacist review, C = quarantined deficiency/condition inference) and specifies the checkpoint each tier needs before it can ship. **That scoping surfaced an urgent, separate finding: the existing hand-scan → `NutritionRecommendation` flow is already live in production and already does what Tier B/C describe as needing a gate — with no gate.** See that entry's open questions before writing any recommendation code, including for this flow's existing behavior.
* **Safety:** Implement strict guardrails preventing disease-treatment claims — the four hard gates (no "medical grade" language / Tier B → pharmacist touchpoint before checkout / FACT-INFERENCE-RECOMMENDATION-UNCERTAIN labelling + explainability / consent per data source) are enforced in shipped code as of 2026-09-10. See `prd.md` §6A.2, `MVP-LAUNCH-CHECKLIST.md` §19–§23.
* **Workflow:** Pharmacist review queue (Concepts must be approved before client visibility) — done (`hand_scan_vitamin_concept` gate, 2026-08-28).
* **UI (Client):** The personalized dashboard showing the approved concept — done, and extended 2026-09-10 with: a "Today" plan card + `/client/plan` detail (Morning/Evening steps, no paywall), the `InsightLabel` FACT/INFERENCE/RECOMMENDATION/UNCERTAIN tags with a "why this label?" explainer on every report section, the "AI-suggested · pharmacist-reviewed" commerce framing, and the `/client/care` Care Actions screen. Deferred: an Insights category-tile hub and a goal-chip Products browse tab — both would be empty shells against current data (`prd.md` §6A.3).
* **Face-scan skin & beauty analysis (2026-09-10, v1.3.0):** `/client/face-scan` — a facial skin-wellness scan (the reference face-care app's core mechanic). Built as a twin of the hand-scan gate: skin scores + observations + AM/PM skincare routine immediate; inferred deficiencies + recommended supplements withheld as a pending `face_scan_skin_concept` until a pharmacist Accepts. Four `skin_*` biometric metrics feed the existing trend charts. Distinct from the excluded face-zone-photo-to-internal-systems pattern. See `decisions.md` "Face-scan / Skin Beauty analysis".

---

## Phase 6+ (Future Outlook)
* Automated supplement pack fulfillment.
* Integration with EMRs (Electronic Medical Records).
* Pharmacogenomics (DNA-based recommendations).

---

## Phase 7+: Medical-Grade Preventive Health Platform (Long-Term Vision)
**Status:** north-star direction, not scoped or committed. See `prd.md` §14 for the full framing, including the two hard gates (human specialist review + FDA/Thai FDA certification) that apply to every step below.

* Lifespan & preventive tracking — continuous longevity-oriented monitoring, not point-in-time snapshots.
* Cancer detection signals — early-warning screening, gated entirely behind medical device certification and clinical validation.
* Personalized healthcare — guidance beyond supplements, still under licensed clinical review.
* Microbiome intelligence — gut microbiome data as an additional input alongside biometrics and hand-scan signals.
* Human-in-the-loop specialist/doctor review at every clinically-adjacent step, structured like telemedicine but preventive rather than reactive.

Public-facing `/roadmap` marketing page was removed (2026-08-27) — decided to prioritize actually building real data infrastructure (see `data/DATA_PROVENANCE.md` "Path forward") over publishing an aspirational vision page, especially given the underlying vitamin-prediction data was found to be illegitimate around the same time. Revisit publishing a public narrative once there's real progress to show.

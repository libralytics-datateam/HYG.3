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

* **Legal:** Finalize Data Processing Agreements (DPA) and explicit consent forms under Thai PDPA.
* **Database:** Implement `patients` table.
* **API:** Patient enrollment endpoints.
* **UI (Admin):** Patient Management dashboard for clinic/pharmacy staff.
* **UI (Client):** Initial Patient Portal login and consent flows.

---

## Phase 4: Biometric Integration (Month 4)
**Goal:** Connect external data sources to patient profiles.

* **Integrations:** WHOOP OAuth flow — done (2026-08-27). Daily webhook ingestion — investigated, not built; blocked on the real webhook payload spec (see `MVP-LAUNCH-CHECKLIST.md` §8). On-demand sync ("Sync Now") is real and working today.
* **Integrations:** Hand Scanner data ingestion endpoints (Antioxidant scores) — done.
* **Database:** Time-series storage for `biometric_readings` — done (`BiometricReading`, populated by both hand-scan and WHOOP sync).
* **UI (Client):** "Connect Wearables" screen in the Patient Portal — done (`WhoopConnectCard`, plus a first-class option at onboarding completion).

---

## Phase 5: Custom Vitamin Concepts (Month 5 - Expanded MVP Target)
**Goal:** Generate personalized, safe supplement recommendations based on biometric data.

* **Data layer (2026-08-28):** Biometric side ready — `GET /v1/patients/:id/biometric-summary` aggregates real accumulated signal (hand scans + WHOOP). Product-catalog side is genuinely empty (0 rows, not even seed data) — needs a real sourcing decision, most likely a pilot partner's actual catalog, not fabricated placeholder data. See `decisions.md`.
* **AI:** Build the Recommendation Engine (mapping biometrics to the product catalog) — **not started, deliberately.** This is the step that caused every compliance problem found this session (the gated fake prediction model, the false marketing claims). Needs a scoping conversation before any code, not another unilateral build.
* **Safety:** Implement strict guardrails preventing disease-treatment claims.
* **Workflow:** Pharmacist review queue (Concepts must be approved before client visibility).
* **UI (Client):** The personalized Dashboard showing the active, approved Custom Vitamin Concept.

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

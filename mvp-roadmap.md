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

* **Platform:** Implement full `ai_outputs` audit trail.
* **UI:** Build the fixed-layout Explainability View (Headline, Data, Confidence, Missing, Alternatives).
* **UI:** Build the Review Action Bar (Accept/Modify/Reject).
* **Compliance:** Exportable weekly summaries for partner IT/Admin teams.

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

* **Integrations:** WHOOP OAuth flow and daily webhook ingestion (HRV, Sleep, Recovery, Strain).
* **Integrations:** Hand Scanner data ingestion endpoints (Antioxidant scores).
* **Database:** Time-series storage for `biometric_readings`.
* **UI (Client):** "Connect Wearables" screen in the Patient Portal.

---

## Phase 5: Custom Vitamin Concepts (Month 5 - Expanded MVP Target)
**Goal:** Generate personalized, safe supplement recommendations based on biometric data.

* **AI:** Build the Recommendation Engine (mapping biometrics to the product catalog).
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

Public-facing narrative for this phase lives at `/roadmap` on the marketing site — kept clearly labeled as vision, not shipped capability.

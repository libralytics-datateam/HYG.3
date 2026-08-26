# HYG.3 — Product Requirements Document (PRD)

**Product brand:** HYG.3 — *Wellness Before Illness*
**Product line (MVP):** Vitamin & Supplement Intelligence
**Legal entity / parent:** Libralytics Co., Ltd. (Libralytics Health AI division)
**Status:** Draft v0.2 — for internal review
**Doc type:** MVP-scoped PRD (not full LIBRA HEALTH OS)

> Naming note: HYG.3 is the external product brand (derived from Hygeia, Ὑγίεια, goddess of prevention). Internal/legal references to "Libralytics Health AI" and "Libra Health Intelligence" remain valid as the company/division name in contracts, DPAs, and legal docs. HYG.3 is what customers and users see.

---

## 1. Executive Summary

Libralytics is expanding from general BI/data engineering into healthcare as a **data + AI intelligence layer**, not a hospital, EMR replacement, or pharma company. Under the HYG.3 brand, the MVP is a single deployable module — the **AI Health Intelligence Assistant**, scoped to **vitamin, supplement, and pharmacy operational data** — sold to one real pilot partner (pharmacy group, wellness business, or hospital pharmacy department), proving that Libralytics can turn a partner's existing operational data into measurable, trustworthy intelligence without taking ownership of patient data.

**North star:** Does this move Libralytics closer to becoming the trusted intelligence layer between traditional healthcare and AI?

---

## 2. Problem Statement

Pharmacies, wellness businesses, and hospital pharmacy/supplement operations generate transaction, inventory, and catalog data but lack the internal data engineering and AI capacity to turn it into decisions — what's selling, what's trending, where data quality is weak, where demand signals exist. They are wary of vendors who want to centralize or "own" their data, and they cannot adopt anything that introduces clinical liability without professional (pharmacist) oversight.

Libralytics' opportunity is to sell **low-risk, high-value operational and commercial intelligence first** on vitamin/supplement data, establish trust and technical integration, then progressively move toward pharmacist-supported personalized wellness recommendations — never bypassing human clinical/pharmacist authority, and never presenting itself as a diagnostic tool.

---

## 3. Market Opportunity (assumption-flagged)

- **ASSUMPTION:** Thai pharmacies, supplement retailers, and wellness businesses are underserved by affordable, modular AI/analytics tooling; validate with 5–10 discovery interviews before committing engineering resources.
- **FACT:** Libralytics already has commercial relationships and technical delivery experience in BI/data engineering/CRM — this is the credible entry wedge.
- **RECOMMENDATION:** Target pharmacy groups and supplement/wellness retailers first — smaller procurement cycles than hospitals, real data-quality and sales-intelligence pain, and a natural bridge to the Phase 5/6 Wellness Pharmacy roadmap.

---

## 4. Target Customer Profiles

| Segment | Pain | Entry wedge | Risk level |
|---|---|---|---|
| Pharmacy / pharmacy group | Manual transaction analysis, low personalization, messy SKU/catalog data | Supplement & drug sales analytics → later Wellness Pharmacy | Low → Medium |
| Wellness / supplement retailer | Wants "AI-powered" positioning, has sales + lifestyle data | Sales trend + demand insight (non-clinical) | Low |
| Hospital pharmacy department | Fragmented inventory/dispensing data, manual reporting | Operational dashboards, data quality scoring | Low |
| Laboratory | Manual data intake, no trend detection | Data quality scoring, anomaly detection on ops data | Low |
| Private hospital (general) | Fragmented operational data | Patient flow / appointment analytics (secondary, Phase 3) | Low |

Clinical decision support, diagnosis-adjacent, and prescribing use cases are explicitly **out of MVP scope** — see §6 and §13 for how this applies specifically to the vitamin-deficiency-prediction dataset under evaluation.

---

## 5. Core Product Principle Applied

For every proposed feature, this PRD answers, in order: what problem → what data → is it legal/safe → who is accountable → where does AI add value → how is it validated. Features that cannot answer these are cut from MVP.

---

## 6. MVP Definition

**MVP = HYG.3 AI Health Intelligence Assistant**, deployed for one pilot partner, covering:

1. **Health Data Engine (subset):** ingest CSV/API exports of **supplement sales data** and **pharmaceutical/vitamin catalog data** — operational and commercial, not patient-linked clinical records in v1.
2. **Consent & Privacy Engine (subset):** organization-level data isolation, role-based access, access logging, data retention config — full consent-management UI is Phase 2+.
3. **AI Health Intelligence Engine (subset):** sales trend detection, anomaly detection, SKU/catalog data-quality scoring, demand pattern summarization — explicitly no diagnosis, no prescribing, no deficiency prediction served to end users.
4. **Human-in-the-loop:** every AI output labeled FACT / INFERENCE / RECOMMENDATION / UNCERTAINTY, with reviewer attribution recorded.
5. **Dashboards:** sales/operational KPIs for pharmacy/wellness administrators.

**MVP test datasets under evaluation (see §13 for scope ruling per dataset):**
- *Supplement Sales Data* — **in scope**, operational/commercial, drives §6.1 and §6.3 directly.
- *Pharmaceutical Drugs and Vitamins Dataset* — **in scope as reference/catalog data** (product info, not patient-linked).
- *Vitamin Deficiency Disease Prediction Dataset* — **out of scope for any served feature**; may be used internally for exploratory/PROTOTYPE-labeled research only, never exposed as a product prediction in MVP (see §13).

**Explicitly excluded from MVP:** patient-facing app, wearable ingestion, genomics, federated learning, personalized pharmacist recommendations, RAG over clinical literature, any deficiency/disease prediction feature. These are Phase 3+.

---

## 7. User Personas

- **Pharmacy/Wellness Business Owner or Admin** — wants sales visibility, inventory/demand insight, no new liability.
- **IT/Data Lead at partner org** — gatekeeper; cares about integration effort, security posture, data control.
- **Pharmacist** (Phase 5+) — needs decision support that respects professional authority, not replacement.
- **Clinician/Hospital Administrator** (secondary, Phase 3) — operational analytics use case.
- **Libralytics Account/Success team** — needs a defensible audit trail to show partners exactly what the AI did and why.

---

## 8. Core User Journeys (MVP)

**Journey A — Onboarding a partner org**
Sign data processing agreement → configure organization tenant → connect data source (supplement sales CSV/API, vitamin/drug catalog) → data validated & quality-scored → dashboard live.

**Journey B — Weekly sales/operational insight**
New sales data lands → normalization → AI generates trend/anomaly summary (e.g. "Vitamin D3 sales up 22% MoM," "SKU catalog has 8% missing dosage fields") labeled FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY → admin reviews in dashboard → optional export/report.

**Journey C — Audit review**
Compliance/IT lead queries: "What did the AI say about X, when, based on what data, who saw it?" → full audit trail returned.

---

## 9. Non-Functional Requirements

- Multi-tenant isolation (org → department → user → role → permission → data), enforced at the data layer, not just application layer.
- Encryption in transit and at rest.
- Full audit logging of data access and AI outputs.
- No production secrets in source; secrets manager required.
- Every AI output traceable to model/version/timestamp/source data.

---

## 10. Regulatory & Privacy Posture (flagged for legal review)

- **ASSUMPTION, not fact:** This PRD assumes Thai PDPA applies as the primary framework given Libralytics' Thai entity, plus potential Thai FDA rules if supplement/drug-claim-adjacent features are added later. **This must be validated by qualified Thai legal/privacy counsel before any patient-identifiable data is processed** — nothing in this document constitutes legal advice.
- Consent does not automatically legitimize every use; purpose limitation applies per data flow (see privacy.md).
- MVP avoids PDPA/medical-device complexity by starting with **de-identified sales and catalog data**, not clinical patient records — this is a deliberate scope decision to reduce regulatory surface area for the pilot.
- **New for this scope:** supplement/vitamin marketing and AI-generated sales insight must avoid making or implying health claims (e.g. "this product treats deficiency") — flagged as a Thai FDA / advertising-regulation review item, not assumed safe by default.

---

## 11. Commercial Model (MVP)

- One-time implementation/integration fee.
- Monthly SaaS platform fee (per-org).
- Optional: AI usage tier for advanced analytics.
- No pricing tied to patient data volume/access — avoids incentive misalignment.

---

## 12. Success Criteria (Pilot)

| Category | Metric |
|---|---|
| Pharmacy/Wellness partner | Admin time saved on reporting (hrs/week); dashboard adoption rate |
| Data | Data quality score improvement on sales/catalog data; ingestion error rate |
| AI | Human override/correction rate; zero clinical-safety or health-claim incidents (by design, since MVP is non-clinical, non-diagnostic) |
| Business | Signed pilot → paid contract conversion |

---

## 13. Out of Scope / Explicit Non-Goals for MVP

- No diagnosis, prescribing, or clinical decision support.
- **No vitamin/nutrient deficiency prediction served as a product feature.** The Vitamin Deficiency Disease Prediction Dataset may be used only for internal, PROTOTYPE-labeled research/exploration (e.g. understanding feature relationships, data structure), never wired into a user-facing output, dashboard, or recommendation. Turning this into a real feature is a deliberate scope-expansion decision requiring the full checklist in §5 plus clinical/regulatory review — not something that happens because the dataset was available.
- No health claims attached to supplement sales insight (e.g. AI must not imply a product treats or prevents a condition).
- No patient-facing chat or app.
- No centralization of identifiable clinical records without a validated legal basis and partner sign-off.
- No wearable/genomic ingestion.
- No autonomous actions — every AI output is advisory and reviewed.

---

## 14. Long-Term Vision — Medical-Grade Preventive Health Platform (Beyond MVP, Beyond Phase 6)

**Status: north-star vision, not a scoped feature.** Nothing in this section is committed engineering work, and none of it changes §6 (MVP Definition) or §13 (Out of Scope) — it exists so that near-term architecture and partner conversations don't foreclose this direction. See `mvp-roadmap.md` Phase 7+ for the same vision in roadmap form.

**The progression:**

Wellness tracking (MVP) → **Medical-grade tracker** → **Lifespan** (longevity-oriented monitoring, not just point-in-time wellness) → **Preventive care** (shift from reactive treatment to continuous risk monitoring) → **Cancer detection** (early-warning screening signals) → **Personalized healthcare** (recommendations tailored beyond supplements — full health guidance) → **Microbiome** (gut/microbiome analysis as a data input alongside biometrics and hand-scan signals).

**Two hard requirements gate every step of this progression, not just the end state:**

1. **Human-in-the-loop specialist/doctor, structured like telemedicine but preventive rather than reactive.** Today's telemedicine model is "patient is sick → sees a doctor remotely." This vision requires the inverse: a licensed physician or specialist reviewing AI-surfaced preventive signals (including anything cancer-detection-adjacent) *before* they reach a patient, the same clinical-authority principle already in §5 and §6.4 (FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY labeling, reviewer attribution) — just extended to licensed medical review, not pharmacist review of supplement concepts. No AI output in this category should ever reach a patient unreviewed.
2. **FDA (and Thai FDA / medical device) certification.** Any feature that detects, screens for, or implies risk of a specific disease (cancer above all) is medical-device and diagnostic territory, not wellness-app territory. This is categorically different from the MVP's current regulatory posture (§10, §13 — deliberately non-diagnostic, de-identified operational data). Realistically this means: medical device classification review (likely Class II/III depending on modality), clinical validation studies, a completely separate regulatory workstream from the current PDPA/advertising-claims review, and probably a different corporate/liability structure than the current SaaS commercial model (§11).

**Why this belongs in the PRD now, even unscoped:** so that data model, consent architecture, and partner conversations can leave room for it (e.g. not architecting patient data in a way that would need to be rebuilt) without treating it as anything the current team is building. Do not let this section justify scope creep into the MVP — every item here requires its own dedicated regulatory, clinical, and legal workstream before a single line of product engineering starts.

---

## 15. Open Questions Requiring Stakeholder Input

1. Which pilot partner (pharmacy group, supplement retailer, or wellness business) is realistically committable in the next 60–90 days?
2. Can the three test datasets (Supplement Sales, Pharmaceutical & Vitamins, Vitamin Deficiency Prediction) be confirmed as either real partner data or clearly-labeled public/synthetic data — this changes what governance applies?
3. Who at Libralytics owns the legal/privacy and Thai FDA advertising-claims review before any pilot data or AI-generated sales copy goes live?
4. Explicit decision needed: does the Vitamin Deficiency Disease Prediction dataset stay research-only indefinitely, or is there a roadmap intent to build a governed clinical feature from it later (Phase 5+)? Record the answer in decisions.md either way.

---

*Companion documents: database-schema.md, api-architecture.md, ai-agent-architecture.md, mvp-roadmap.md, web-structure.md*

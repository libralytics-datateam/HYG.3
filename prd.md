# HYG.3 — Product Requirements Document (PRD)

**Product brand:** HYG.3 — *Wellness Before Illness*
**Product line (MVP):** Vitamin & Supplement Intelligence
**Legal entity / parent:** Libralytics Co., Ltd. (Libralytics Health AI division)
**Status:** Draft v0.3 — for internal review
**Doc type:** MVP-scoped PRD (not full LIBRA HEALTH OS)

> Naming note: HYG.3 is the external product brand (derived from Hygeia, Ὑγίεια, goddess of prevention). Internal/legal references to "Libralytics Health AI" and "Libra Health Intelligence" remain valid as the company/division name in contracts, DPAs, and legal docs. HYG.3 is what customers and users see.

> **v0.3 scope note (2026-09-10):** the product built since v0.2 now includes a **patient-facing consumer wellness app** — hand-scan nutrition analysis → pharmacist review → personalised daily plan, wearable ingestion (WHOOP / Fitbit / InBody), and a telemedicine hand-off. This was *excluded* from the v0.2 MVP and reached the codebase through a series of individually-scoped decisions, each with a pharmacist-in-the-loop gate — see `decisions.md` and `MVP-LAUNCH-CHECKLIST.md`. **§6A** below documents it as it now stands; **§6, §7, §8, §10, §13** are revised so the PRD no longer describes it as excluded. The B2B operational-analytics MVP (§6) is unchanged and remains the commercial entry wedge. Doc drift between this PRD and the shipped product is the same class of risk that let `POST /v1/ai/predict` go live in violation of §13 (caught 2026-08-27) — this revision closes it for the consumer app.

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
- *Supplement Sales Data* — **in scope**, operational/commercial, drives §6.1 and §6.3 directly. Confirmed public/synthetic-style demo data, not a real partner's actual sales — see `decisions.md`.
- *Pharmaceutical Drugs and Vitamins Dataset* — **scoping error, not usable as described.** This was assumed to be tabular catalog/product-info data; it's actually a 51k-image pill/box-photo classification dataset of Philippine OTC drug brands. It cannot drive §6.1/§6.3 catalog data-quality scoring — there's no tabular product data in it. A real catalog data source (from an actual pilot partner, or a different public dataset) is still needed if this feature ships. See `decisions.md`.
- *Vitamin Deficiency Disease Prediction Dataset* — **out of scope for any served feature**; may be used internally for exploratory/PROTOTYPE-labeled research only, never exposed as a product prediction in MVP (see §13).

**Was "explicitly excluded from MVP" in v0.2, now built (see §6A):** patient-facing app, wearable ingestion, personalised pharmacist-reviewed recommendations. Each shipped through its own scoped decision with a pharmacist-in-the-loop gate — none is autonomous, none serves a diagnosis.

**Still excluded from MVP:** genomics, federated learning, RAG over clinical literature, and any nutrient/disease **deficiency prediction served as a product output** — the deficiency-prediction model remains code-gated (`POST /v1/ai/predict` → 503), see §13. These are Phase 3+.

---

## 6A. Patient-Facing Consumer App (built since v0.2 — not in the original MVP)

**Status: built and deployed to a live test environment** (`hyg-3.vercel.app` / `hyg3-backend.onrender.com`), not yet in front of real users. It reached the codebase through individually-scoped decisions in `decisions.md` (hand-scan gate 2026-08-28; wearables — checklist §8, §11; telemedicine 2026-09-04; consumer-UX adaptation 2026-09-10) and is tracked in `MVP-LAUNCH-CHECKLIST.md` §8–§23. Documented here so the PRD matches the product. The launch blockers that remain are legal/business, not code: Thai FDA review, DPA sign-off, PDPA consent wording by Thai counsel, demo-credential rotation.

**What it is:** a preventive wellness tracker for a health-curious consumer — browsing their own signals, a personalised daily plan, matched supplement commerce, progress tracking — with a **pharmacist standing between every risk-bearing AI output and the user**. It is explicitly not a diagnostic tool and carries no "medical grade" language.

### 6A.1 Capabilities

1. **Hand-scan nutrition analysis.** A photo-based scan (`claudeService.ts`, Claude as the vision model; honest simulated fallback when no key is set) returns a wellness score + raw visual observations (shown immediately — direct observations, not claims) plus a deficiency inference + supplement/dosage suggestions + meal plan, which are **withheld** until a pharmacist Accepts — routed through the `hand_scan_vitamin_concept` → `CustomVitaminConcept` review pipeline (`decisions.md`, "Hand-scan gate").
2. **Connected data sources.** WHOOP + Fitbit (real OAuth 2.0) and InBody (cloud API key) behind one `ProviderConnector` registry; per-source consent recorded at connection time as an auditable event and revocable independently (`decisions.md`, "ProviderConnector interface").
3. **Health trends.** Metric trend charts (recovery, sleep, HRV, antioxidant/wellness score, self-reported energy, adherence) on the patient's own dashboard; threshold-band alerts draw on the exact guidance source the pharmacist side uses (`healthThresholds.ts`).
4. **First-view disclaimer.** A two-step modal shown once per report category before the first Tier B+ report — what this is / isn't, do not start-stop-change treatment without a professional, then "share with a pharmacist" routing to Care Actions. Dismissal logged per user per category as an auditable event; re-surfaces on a material report-version change.
5. **Care Actions.** A persistent screen reachable from any Tier B+ surface: "Talk to a Pharmacist" (async in-app consult) and "Book a Telemedicine Consult" (external licensed-provider hand-off). Every request writes an audit record through the same review pipeline: recommendation → reviewer → decision → outcome.
6. **Self-report check-in.** A one-question wellness check-in plus an optional adherence question (shown only when a plan exists), feeding the trend history.
7. **Face-scan skin & beauty analysis.** A photo-based facial scan (`claudeService.ts`, same Claude-vision + simulated-fallback pattern as the hand scan) returns skin hydration / radiance / texture / elasticity scores, direct facial observations, an eye-contour note, and a general AM/PM skincare routine — all shown immediately. Inferred nutrient deficiencies and recommended foods/supplements are **withheld** until a pharmacist Accepts, through the same `face_scan_skin_concept` → `CustomVitaminConcept` review pipeline (hard gate b). Four `skin_*` metrics feed the trend charts. This is a skin/beauty analysis, distinct from the excluded face-zone-photo-to-internal-systems pattern (§6A.4). See `decisions.md`, "Face-scan / Skin Beauty analysis".

### 6A.2 The four hard gates (enforced in shipped code, not just stated)

| Gate | How it is enforced |
|---|---|
| **(a)** No diagnosis or "medical grade" language anywhere in UI copy | last user-facing "medical-grade" string removed 2026-09-10; hand-scan output is framed as "wellness", never diagnostic |
| **(b)** Every supplement-specific / deficiency-adjacent recommendation is Tier B/C and passes a pharmacist-review touchpoint before checkout or action — never a direct add-to-cart | `NutritionRecommendation` is created only *after* a pharmacist Accepts; the face-scan `/latest` endpoint withholds its deficiency + supplement fields until `concept.status === 'approved'`; `productMatch.ts` invents no "% match"; the report carries an "AI-suggested · pharmacist-reviewed" tag and a persistent "talk to a pharmacist" link on every supplement step |
| **(c)** Every AI-generated insight labelled FACT / INFERENCE / RECOMMENDATION / UNCERTAIN, with an explainability affordance | `InsightLabel` component — colour-coded tag + a "why this label?" explainer — on every section of the patient report; this extends the §6.4 reviewer-side labelling discipline to the patient's own view (reviewer side uses "UNCERTAINTY", patient side "UNCERTAIN" — same category) |
| **(d)** Consent is per data source, at connection time, and revocable independently | a `data_source_consent` audit row per provider; connecting one source never implies consent for another; disconnecting withdraws consent for that source only |

### 6A.3 Deliberately deferred (documented, not skipped)

- **Insights category-tile hub** (Nutrition / Sleep / Stress / …) — needs a second real report type or it renders as empty tiles, which breaks this codebase's honest-empty-state rule. The gate-(c) labelling + explainability shipped on the one report that has real data.
- **Goal-chip Products browse tab** — `Product` has 0 rows in production and there is no patient-facing catalog endpoint; ships with a real catalogue. The gate-(b) commerce framing shipped on the report itself.
- **Free / premium tier split** — the reference app's "blurred until unlocked / Unlock My Full Plan" paywall was omitted; HYG.3 has no subscription tiers and adding one is a separate commercial decision (§11).

### 6A.4 Excluded, and staying excluded

No video-lesson / course library, no points/coins gamification, no free-form clinical chatbot, no diagnosis, no deficiency/disease prediction served as an output (the WHOOP-based prediction model stays code-gated — §13), no genomics.

**Reworded 2026-09-10:** the earlier "no face-zone-photo interaction pattern" exclusion meant *no repurposing the reference app's tap-a-facial-zone UI to represent internal organs / body systems* — that stays excluded. It did **not** rule out a genuine skin-surface analysis: the face-scan skin & beauty capability (§6A.1 item 7) analyses visible skin only, carries the same hard gates, and is a deliberate user-initiated addition.

---

## 7. User Personas

- **Pharmacy/Wellness Business Owner or Admin** — wants sales visibility, inventory/demand insight, no new liability.
- **IT/Data Lead at partner org** — gatekeeper; cares about integration effort, security posture, data control.
- **Pharmacist** (now MVP, via the consumer app — §6A) — reviews every Tier B/C AI concept (hand-scan deficiency inference, supplement + dosage suggestions, meal plan) before it reaches a patient: Accept / Modify / Reject, with reviewer attribution recorded. Not replaced by AI; the app is built so nothing risk-bearing ships without this step.
- **Patient / app user** (now MVP, via the consumer app — §6A) — a health-curious consumer using hand-scan plus connected wearables to track preventive wellness signals. Never shown a diagnosis; always routed to a pharmacist before acting on a supplement suggestion.
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

**Journey D — Patient hand-scan to daily plan (consumer app, §6A)**
Patient signs up (PDPA consent) → hand scan → wellness score + raw observations shown immediately → deficiency inference + supplement suggestions + meal plan created as a *pending* concept → pharmacist Accepts / Modifies / Rejects (attribution recorded) → on Accept, the patient's "Today's Plan" and labelled report (FACT / INFERENCE / RECOMMENDATION / UNCERTAIN, each with a "why this label?" explainer) become visible → the first-view disclaimer modal gates the first Tier B+ report → "Talk to a pharmacist" is one tap from every supplement step.

**Journey E — Connecting a data source (consumer app, §6A)**
Patient opens Connected Data Sources → picks WHOOP / Fitbit / InBody → sees that source's full consent scope (what data, what for, how long) → gives explicit per-source consent → connects (OAuth or API key) → trends appear on their dashboard → disconnecting withdraws consent for that source only, leaving every other source untouched.

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
- **Updated for §6A (consumer app):** the patient-facing app processes **patient-identifiable data** — accounts, hand-scan photos, wearable biometrics, self-reported symptoms. The v0.2 "de-identified sales and catalog data only" simplification no longer covers the whole product. PDPA applies in full to the consumer app; a Data Processing Agreement and PDPA-compliant consent wording reviewed by qualified Thai counsel are **launch blockers**, not deferrable (`MVP-LAUNCH-CHECKLIST.md`). Per-source wearable consent is already implemented at the application layer (hard gate (d), §6A.2) and every AI output has a reviewer/audit trail (§9) — the legal review is what remains, not the mechanism.

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
| AI | Human override/correction rate; zero clinical-safety or health-claim incidents (by design — no output serves a diagnosis, and every Tier B/C consumer-app output is pharmacist-gated, §6A.2) |
| Consumer app (§6A) | Pharmacist review turnaround on hand-scan concepts; % of Tier B suggestions where the patient uses the "talk to a pharmacist" path; zero Tier B/C outputs reaching a patient un-reviewed (must be 0 — it is a hard gate, not a target) |
| Business | Signed pilot → paid contract conversion |

---

## 13. Out of Scope / Explicit Non-Goals for MVP

> **Revised in v0.3.** Two former non-goals — "No patient-facing chat or app" and "No wearable/genomic ingestion" — were overtaken by the consumer app (§6A). They are rewritten below to say what is *actually* still out of scope. Everything else in this section stands and is still enforced.

- No diagnosis, prescribing, or clinical decision support.
- **No vitamin/nutrient deficiency prediction served as a product feature.** The Vitamin Deficiency Disease Prediction Dataset may be used only for internal, PROTOTYPE-labeled research/exploration (e.g. understanding feature relationships, data structure), never wired into a user-facing output, dashboard, or recommendation. Turning this into a real feature is a deliberate scope-expansion decision requiring the full checklist in §5 plus clinical/regulatory review — not something that happens because the dataset was available. **Enforced, not just stated:** `POST /v1/ai/predict` was found live in violation of this rule (2026-08-27) and has been gated at the code level (returns 503) — see `data/DATA_PROVENANCE.md` for the full data-legitimacy assessment. The underlying dataset is synthetic (procedurally-generated, not real patient data) with a publicly-documented faulty-validation issue, and the runtime WHOOP-to-symptom feature mapping is also an unvalidated invented heuristic. This resolves Open Question #4 below: the answer is research-only, enforced, until real clinically-sourced data exists.
- No health claims attached to supplement sales insight or to supplement suggestions in the consumer app (e.g. AI must not imply a product treats or prevents a condition — enforced as hard gate (a)/(b), §6A.2).
- **No free-form patient-facing clinical chatbot.** *(Revised: the patient-facing **app** now exists — §6A — non-diagnostic and pharmacist-gated. What stays out of scope is a conversational clinical assistant / open-ended medical Q&A.)*
- No centralization of identifiable clinical records without a validated legal basis and partner sign-off.
- **No genomic ingestion; no wearable ingestion without per-source consent.** *(Revised: WHOOP / Fitbit / InBody ingestion is built — §6A — behind consent recorded per source at connection time, hard gate (d). Genomics remains fully out of scope.)*
- No autonomous actions — every AI output is advisory and reviewed. In the consumer app this is structural: every Tier B/C output is created as a *pending* concept and is invisible to the patient until a pharmacist Accepts it (§6A.1, §6A.2).

---

## 14. Long-Term Vision — Medical-Grade Preventive Health Platform (Beyond MVP, Beyond Phase 6)

**Status: north-star vision, not a scoped feature.** Nothing in this section is committed engineering work, and none of it changes §6 (MVP Definition) or §13 (Out of Scope) — it exists so that near-term architecture and partner conversations don't foreclose this direction. See `mvp-roadmap.md` Phase 7+ for the same vision in roadmap form.

**The progression:**

Wellness tracking (MVP) → **Medical-grade tracker** → **Lifespan** (longevity-oriented monitoring, not just point-in-time wellness) → **Preventive care** (shift from reactive treatment to continuous risk monitoring) → **Cancer detection** (early-warning screening signals) → **Personalized healthcare** (recommendations tailored beyond supplements — full health guidance) → **Microbiome** (gut/microbiome analysis as a data input alongside biometrics and hand-scan signals).

**Two hard requirements gate every step of this progression, not just the end state:**

1. **Human-in-the-loop specialist/doctor, structured like telemedicine but preventive rather than reactive.** Today's telemedicine model is "patient is sick → sees a doctor remotely." This vision requires the inverse: a licensed physician or specialist reviewing AI-surfaced preventive signals (including anything cancer-detection-adjacent) *before* they reach a patient, the same clinical-authority principle already in §5 and §6.4 (FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY labeling, reviewer attribution) — just extended to licensed medical review, not pharmacist review of supplement concepts. No AI output in this category should ever reach a patient unreviewed. *(§6A's pharmacist-review gate — pending concept, invisible until Accepted, reviewer attribution recorded — is the first working instance of this pattern at the pharmacist tier; the medical-review tier would be the same shape with a licensed physician as the reviewer.)*
2. **FDA (and Thai FDA / medical device) certification.** Any feature that detects, screens for, or implies risk of a specific disease (cancer above all) is medical-device and diagnostic territory, not wellness-app territory. This is categorically different from the MVP's current regulatory posture (§10, §13 — deliberately non-diagnostic, de-identified operational data). Realistically this means: medical device classification review (likely Class II/III depending on modality), clinical validation studies, a completely separate regulatory workstream from the current PDPA/advertising-claims review, and probably a different corporate/liability structure than the current SaaS commercial model (§11).

**Why this belongs in the PRD now, even unscoped:** so that data model, consent architecture, and partner conversations can leave room for it (e.g. not architecting patient data in a way that would need to be rebuilt) without treating it as anything the current team is building. Do not let this section justify scope creep into the MVP — every item here requires its own dedicated regulatory, clinical, and legal workstream before a single line of product engineering starts.

---

## 15. Open Questions Requiring Stakeholder Input

Answers to these, once settled, are logged in `decisions.md` rather than edited in place here — check there for the current status of each.

1. Which pilot partner (pharmacy group, supplement retailer, or wellness business) is realistically committable in the next 60–90 days? — **OPEN**, see `decisions.md`.
2. Can the three test datasets (Supplement Sales, Pharmaceutical & Vitamins, Vitamin Deficiency Prediction) be confirmed as either real partner data or clearly-labeled public/synthetic data — this changes what governance applies? — **Answered**, see `decisions.md`. Note: this surfaced a scoping error in §6 below, not just a provenance answer.
3. Who at Libralytics owns the legal/privacy and Thai FDA advertising-claims review before any pilot data or AI-generated sales copy goes live? — **OPEN**, see `decisions.md`.
4. ~~Explicit decision needed: does the Vitamin Deficiency Disease Prediction dataset stay research-only indefinitely, or is there a roadmap intent to build a governed clinical feature from it later (Phase 5+)?~~ — **Answered**, see `decisions.md`.
5. **New (v0.3):** the consumer app (§6A) is built and deployed to a test environment but is **not cleared for real users**. Its four launch blockers are all legal/business: (a) Thai FDA review of the hand-scan → supplement-suggestion flow; (b) a signed DPA covering patient-identifiable data; (c) PDPA consent wording drafted/reviewed by Thai counsel; (d) demo-credential rotation. Who owns each, and what is the go/no-go decision date? — **OPEN**, track in `decisions.md` + `MVP-LAUNCH-CHECKLIST.md`.

---

*Companion documents: database-schema.md, api-architecture.md, ai-agent-architecture.md, mvp-roadmap.md, web-structure.md, decisions.md, MVP-LAUNCH-CHECKLIST.md, data/DATA_PROVENANCE.md*

> **web-structure.md is stale** as of this revision — it still says "no patient-facing pages" while a full `/client` portal exists (§6A). Update it alongside this PRD.

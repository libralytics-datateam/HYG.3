# HYG.3 — Decisions Log

Tracks product/scope decisions referenced from `prd.md`, in the order they were made. Each entry: the question, the answer, the date, who/what settled it, and where the evidence lives. Add to this file — don't restate its history — when a new decision is made.

---

## Pilot partner selection

**Question** (`prd.md` §15.1): Which pilot partner (pharmacy group, supplement retailer, or wellness business) is realistically committable in the next 60–90 days?

**Status: OPEN — not yet answered.** No partner name, org, or negotiation status has been recorded anywhere in this repo as of 2026-08-27. This is a business-development status that lives outside the codebase — record it here as soon as there's an answer, even a partial one ("in talks with X, nothing signed").

---

## Vitamin Deficiency Disease Prediction dataset: research-only

**Question** (`prd.md` §15.4, originally): Does the Vitamin Deficiency Disease Prediction dataset stay research-only indefinitely, or is there roadmap intent to build a governed clinical feature from it later?

**Decision: Research-only, enforced at the code level.** `POST /v1/ai/predict` returns 503 unconditionally.

**Date:** 2026-08-27
**Why:** Investigated the underlying data directly (not just the PRD's existing caution) and found it fails any reasonable medical-grade bar: the training data is synthetic/procedurally-generated (confirmed via floating-point generation artifacts in the raw CSV), a public Kaggle kernel already documents that the dataset's widely-cited 97% F1 score is a validation-methodology artifact, and the runtime WHOOP-to-symptom feature mapping in `server/ml/predict.py` is a second, independent, never-validated heuristic layered on top.
**Evidence:** `data/DATA_PROVENANCE.md` (full assessment), `server/routes/ai.ts` (the gate itself), `prd.md` §13.
**Revisit when:** real, clinically-sourced, properly-licensed training data exists — see `data/DATA_PROVENANCE.md` "Path forward" for what that requires (explicit research-use consent, clinical validation, the same specialist/FDA gates as everything else diagnosis-adjacent).

---

## Public `/roadmap` vision page: built, then removed

**Decision:** A marketing page describing the long-term medical-grade vision (lifespan tracking → preventive care → cancer detection → personalized healthcare → microbiome) was built, then removed the same day.

**Date:** 2026-08-27
**Why:** Decided to prioritize actually building real infrastructure over publishing an aspirational page — especially given the Vitamin Deficiency dataset was found illegitimate the same day (above). Publishing a "cancer detection" vision page while sitting on a debunked prediction model risked the wrong signal. The vision itself is still recorded — see `prd.md` §14 and `mvp-roadmap.md` Phase 7+ — just not as a public-facing page yet.
**Revisit when:** there's real progress to show (see `data/DATA_PROVENANCE.md` "Path forward" and the `GET /v1/stats/data-readiness` counts on the admin Models page) — not before.

---

## Supplement Sales / Pharmaceutical & Vitamins dataset provenance

**Question** (`prd.md` §15.2): Can the Supplement Sales Data and Pharmaceutical Drugs and Vitamins datasets be confirmed as real partner data or clearly-labeled public/synthetic data?

**Status: ANSWERED 2026-08-27.** Neither is real partner data, and one isn't usable for its described purpose at all:
- **Supplement Sales Data**: confirmed public/synthetic-style demo data (generic Canada/UK/USA e-commerce activity, no Thailand presence, no tie to any real business). Structurally clean, fine for prototyping dashboard UI, not representative of an actual pilot partner.
- **Pharmaceutical Drugs and Vitamins Dataset V2**: turns out to be a 51,104-image pill/box-photo classification dataset of Philippine OTC drug brands, not the tabular catalog/product-info data `prd.md` §6 assumed it was. It cannot serve the SKU catalog use case in §6.1/§6.3 regardless of legitimacy — this was a dataset-selection mismatch, not just a provenance question.
- Also found, while checking: a fourth resource (`utkarshsaxenadn/drugs-and-vitamins-classification`) turns out to be a third party's pretrained CNN model file, not a dataset. Unused by any code path; recommend leaving it unused rather than trying to vet an opaque black-box model with no visible training methodology.

**Evidence:** `data/DATA_PROVENANCE.md` "Assessment of the other three resources."

---

## Legal/privacy/Thai FDA review ownership

**Question** (`prd.md` §15.3): Who at Libralytics owns the legal/privacy and Thai FDA advertising-claims review before any pilot data or AI-generated sales copy goes live?

**Status: OPEN — not yet answered.**

---

## Wearable integration: WHOOP now, Apple Watch deferred

**Question:** User asked to link WHOOP or Apple Watch data for deeper analysis — which, and how much?

**Status: ANSWERED 2026-08-27.** Build WHOOP as a real OAuth 2.0 integration now (`server/services/whoopService.ts`, `server/routes/wearables.ts`, `WhoopConnectCard`); defer Apple Watch. Reason: they're not the same kind of work. WHOOP has a public server-callable OAuth API. Apple HealthKit has no cloud API at all — the only paths in are a native iOS companion app (this project has none) or a paid third-party aggregator (Terra/Vital/Spike), which is a bigger product/vendor decision, not scoped here. Building a WHOOP-shaped "connect" button for Apple would have been fake, the same category of problem as everything else in this log.

Needs a real WHOOP developer account (register free at https://developer.whoop.com) and `WHOOP_CLIENT_ID`/`WHOOP_CLIENT_SECRET`/`WHOOP_REDIRECT_URI` set as real Render secrets before it does anything in production — currently `whoopConfigured: false`, and the UI says so honestly instead of failing silently.

**Also found in the process:** 4 live pages (`/how-it-works`, `/product`, `/trust`, and `PrivacyPolicy`) making claims that didn't match reality — a working Apple Health integration that was never built at all, a "live" prediction engine that's actually the model gated in `data/DATA_PROVENANCE.md`, and (most seriously) the Trust Center claiming "fully HIPAA compliant" infrastructure — wrong jurisdiction entirely; this is a Thai company under PDPA, not a US HIPAA-covered entity, no BAA or HIPAA audit exists. All four rewritten to state only what's true. See `MVP-LAUNCH-CHECKLIST.md` §8 for the full list.

**Evidence:** `server/services/whoopService.ts`, `server/routes/wearables.ts`, `MVP-LAUNCH-CHECKLIST.md` §8.

---

## Phase 5 data layer: built the biometric side, product catalog remains unresolved

**Question:** `mvp-roadmap.md` Phase 5 needs "biometrics mapped to the product catalog." What data actually exists to build that on?

**Status: PARTIALLY ANSWERED 2026-08-28.** The biometric side is real and ready: hand scans now write to `BiometricReading` (they never did before — `server/routes/handscan.ts`, `metricType: 'antioxidant_score'`), and a new `GET /v1/patients/:id/biometric-summary` aggregates real accumulated signal (latest value, trend, reading count per metric) from both hand scans and WHOOP. Surfaced on the admin `PatientDetail` page. No recommendation logic was built on top of this — that still needs its own scoping conversation.

**The product-catalog side has zero real data**, and this wasn't a gap I could close by building more: `Product` (schema: sku/name/category/ingredients/dosageForm) has **0 rows** — not even seed data. The one Kaggle resource that looked like it might cover this (`Pharmaceutical Drugs and Vitamins Dataset V2`) turned out to be 51,104 product-packaging *photos*, not a tabular catalog — see `data/DATA_PROVENANCE.md`. There is currently no source, real or synthetic, for what a Thai pharmacy's actual SKU catalog looks like. This needs an actual sourcing decision (a partner's real catalog export, once a pilot partner is chosen — see the still-open "Pilot partner selection" entry above) — not something to fabricate placeholder rows for.

**Also found and fixed while building this:** `hyg3_app` can't `ALTER TABLE` on existing tables, not just `CREATE TABLE` — confirmed via a failed `prisma db push` (`must be owner of table AiOutput`). More restrictive than previously documented; see the correction in `MVP-LAUNCH-CHECKLIST.md` §4.

**Evidence:** `server/routes/handscan.ts`, `server/routes/patients.ts` (`biometric-summary`), `src/pages/App/PatientDetail.tsx`, `MVP-LAUNCH-CHECKLIST.md` §4 and §8.

---

## More data gathering for better analysis: self-report check-in built, ranked ahead of adherence tracking and lab integration

**Question:** User asked whether more data should be gathered from patients to improve analysis quality.

**Status: ANSWERED 2026-08-28.** Recommended and built, in priority order: (1) a structured self-report symptom/wellness check-in — built now, see `MVP-LAUNCH-CHECKLIST.md` §9; (2) outcome tracking over time (does a recommendation actually help?) — not built, needs a design decision on cadence/UX; (3) supplement adherence tracking — deprioritized, typically low compliance in consumer apps; (4) lab results — real ground truth, but a clinical-lab partnership is a much bigger lift than anything else here (WHOOP's own spec has a "Partner" API for exactly this — lab requisitions via a company called Unilabs — worth remembering if a lab partnership is ever pursued).

Deliberately did not reach for another public dataset to fill this gap — every one of the above should come from this product's own patients, with real consent, which is the same lesson `data/DATA_PROVENANCE.md` already drew from the original vitamin-deficiency dataset.

**Evidence:** `server/routes/checkins.ts`, `src/pages/Client/CheckIn.tsx`, `MVP-LAUNCH-CHECKLIST.md` §9.

**Follow-up, 2026-08-28: outcome tracking (item 2 on that list) built.** Trend history (up to 20 points) now flows from both hand-scan/WHOOP data and the new self-report check-ins into a real sparkline, visible to both the clinician (`PatientDetail`) and the patient themselves (`CheckInCard`). Scoped deliberately narrow: this shows *whether a metric is trending*, not *whether a specific recommendation caused it* — tying a trend to a recommendation's timing needs real longitudinal data to do responsibly, which doesn't exist yet.

**Follow-up, 2026-08-28: adherence tracking (item 3) built.** One question added to the existing check-in — "did you follow your recommended plan?" (Yes/Partially/No) — shown only when a recommendation actually exists. Deliberately not a per-supplement checklist; kept to the smallest real question given self-logged adherence's known compliance problems in consumer apps. Lab integration (item 4) remains unbuilt — it's a clinical-lab partnership decision, not a code task.

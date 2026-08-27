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

**Status: OPEN — partially assessed.** Only the Vitamin Deficiency dataset was investigated (see above). These two were explicitly out of scope for that review. Given the same "Kaggle dataset assumed legitimate without checking" pattern applied to the vitamin data, the same check is worth running here before either dataset is presented to a real pilot partner as a demo data source.

---

## Legal/privacy/Thai FDA review ownership

**Question** (`prd.md` §15.3): Who at Libralytics owns the legal/privacy and Thai FDA advertising-claims review before any pilot data or AI-generated sales copy goes live?

**Status: OPEN — not yet answered.**

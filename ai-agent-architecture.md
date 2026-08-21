# HYG.3 — AI Agent Architecture

This document describes the AI models and intelligent agents powering the HYG.3 intelligence layer, encompassing both the operational B2B insights and the clinical/B2B2C custom vitamin concepts (expanded scope).

---

## 1. Core AI Principles

- **No Black Box:** Every AI output must explain *WHY* a decision or inference was made.
- **Human-in-the-Loop:** All high-impact AI outputs, particularly patient-facing vitamin concepts, MUST be approved by a human professional (pharmacist/clinician) before actioning.
- **Traceability:** Every AI output is recorded in `ai_outputs` and linked to the source dataset, user/patient, and model version.

---

## 2. Agent Topologies

### 2.1 Operational Intelligence Agents (MVP Core)

These agents run asynchronously against pharmacy/wellness operational data.

- **Sales Trend Agent:** Analyzes transaction data for seasonal spikes, MoM changes, and demand signals.
- **Data Quality Agent:** Scans SKU/catalog data for missing dosage fields, inconsistent naming, or anomalous categorization.
- **Anomaly Detection Agent:** Detects unusual volume drops or spikes in specific supplement categories.

**Output Format Constraint:** FACT, INFERENCE, RECOMMENDATION, or UNCERTAINTY.

### 2.2 Recommendation Engine: Custom Vitamin Concepts (Expanded Scope)

This agent bridges the gap between patient biometric data and the operational catalog to generate personalized wellness recommendations.

#### Inputs:
1. **Patient Biometric Baseline (Time-Series):**
   - WHOOP Data: HRV, Sleep Score, Recovery Score, Daily Strain (last 14-30 days).
   - Hand Scanner Data: Antioxidant score, carotenoid levels.
2. **Product Catalog:**
   - Active SKUs available at the partner organization.
   - Known supplement ingredients, dosage forms, and categorizations.
3. **Safety Guardrails:**
   - Pre-programmed constraints prohibiting recommendations that imply disease treatment.

#### Processing Steps:
1. **Biometric Synthesis:** The agent summarizes the patient's current wellness state (e.g., "Consistently low recovery, moderate sleep debt, low antioxidant score").
2. **Catalog Matching:** The agent cross-references the synthesis with the available SKU catalog to find supplements addressing the identified gaps (e.g., Magnesium for sleep/recovery, Vitamin C/E for antioxidants).
3. **Concept Generation:** The agent structures a proposed supplement stack.
4. **Explainability Generation:** The agent drafts a `rationale_summary` detailing *why* these SKUs were selected based on the WHOOP and Scanner data.

#### Outputs:
A proposed `Custom Vitamin Concept` record, marked as `pending_pharmacist_review`.

#### Human Review (Critical):
A pharmacist or clinician MUST review this concept. They can Accept, Modify (change SKUs/dosages), or Reject it. Only after approval is the concept visible to the patient in the Client Portal.

---

## 3. Handling Missing Data (The Layout Contract)

If data is missing (e.g., a patient hasn't synced their WHOOP strap in 3 days, or the Hand Scanner API is down), the AI Agents must fail gracefully:
1. **Explicit Identification:** Note the missing data in the "What's missing" section of the AI output.
2. **Confidence Downgrade:** Lower the confidence score of the generated concept or insight.
3. **Human Delegation:** If missing data exceeds a threshold, the agent aborts and flags the record for manual pharmacist intervention.

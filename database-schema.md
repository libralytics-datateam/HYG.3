# HYG.3 — Database Schema

This document outlines the core database structure for HYG.3, incorporating the original operational MVP scope plus the expanded patient-facing scope (WHOOP and Hand Scanner integrations).

---

## 1. Multi-Tenancy & Operational Core

### `organizations`
* `id` (uuid, pk)
* `name` (varchar)
* `type` (enum: pharmacy, wellness_retailer, hospital)
* `created_at` (timestamp)

### `users`
* `id` (uuid, pk)
* `org_id` (uuid, fk -> organizations.id)
* `email` (varchar, unique)
* `role` (enum: org_admin, analyst, pharmacist, it_admin)
* `created_at` (timestamp)

### `datasets`
* `id` (uuid, pk)
* `org_id` (uuid, fk -> organizations.id)
* `name` (varchar)
* `type` (enum: sales_export, api_stream, catalog)
* `quality_score` (int)

### `ai_outputs` (The Audit Trail)
* `id` (uuid, pk)
* `org_id` (uuid, fk -> organizations.id)
* `type` (enum: sales_trend, anomaly, data_quality, vitamin_concept)
* `content` (jsonb)
* `confidence_score` (float)
* `model_version` (varchar)
* `review_status` (enum: pending, accepted, modified, rejected)
* `reviewed_by` (uuid, fk -> users.id, nullable)
* `created_at` (timestamp)

---

## 2. Product Catalog

### `products`
* `id` (uuid, pk)
* `org_id` (uuid, fk -> organizations.id)
* `sku` (varchar)
* `name` (varchar)
* `category` (varchar: vitamin, mineral, supplement)
* `ingredients` (jsonb)
* `dosage_form` (varchar)

---

## 3. Patient & Biometric Engine (Expanded Scope)

### `patients`
* `id` (uuid, pk)
* `org_id` (uuid, fk -> organizations.id)
* `first_name` (varchar)
* `last_name` (varchar)
* `email` (varchar, unique)
* `pdpa_consent_status` (boolean)
* `consent_timestamp` (timestamp)

### `wearable_connections`
* `id` (uuid, pk)
* `patient_id` (uuid, fk -> patients.id)
* `provider` (enum: whoop)
* `access_token` (varchar, encrypted)
* `refresh_token` (varchar, encrypted)
* `expires_at` (timestamp)

### `biometric_readings` (Time-Series)
* `id` (uuid, pk)
* `patient_id` (uuid, fk -> patients.id)
* `source` (enum: whoop, hand_scanner, manual)
* `metric_type` (enum: hrv, sleep_score, recovery_score, strain, antioxidant_score)
* `value` (float)
* `recorded_at` (timestamp)

### `custom_vitamin_concepts`
* `id` (uuid, pk)
* `patient_id` (uuid, fk -> patients.id)
* `generated_at` (timestamp)
* `status` (enum: pending_pharmacist_review, approved, rejected)
* `recommended_skus` (jsonb: array of products.id)
* `rationale_summary` (text)
* `ai_output_id` (uuid, fk -> ai_outputs.id) - Links back to the explainability and audit trail.

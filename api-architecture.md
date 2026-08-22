# HYG.3 — API Architecture

All endpoints will be prefixed with `/v1`. The system uses role-based access control (RBAC) enforced at the API gateway layer.

---

## 1. Organizations & Users (Operational MVP Core)

### Organizations
- `GET /v1/orgs` (Libralytics Admin only)
- `GET /v1/orgs/:orgId`
- `PUT /v1/orgs/:orgId/settings`

### Users
- `GET /v1/orgs/:orgId/users`
- `POST /v1/orgs/:orgId/users`
- `DELETE /v1/orgs/:orgId/users/:userId`

---

## 2. Datasets & Ingestion (Operational MVP Core)

- `GET /v1/orgs/:orgId/datasets`
- `POST /v1/orgs/:orgId/datasets` (Create a new dataset ingestion job via CSV upload or API source)
- `GET /v1/orgs/:orgId/datasets/:datasetId`
- `GET /v1/orgs/:orgId/datasets/:datasetId/quality-report` (Data quality AI scoring)

---

## 3. AI Insights & Audit (Operational MVP Core)

- `GET /v1/orgs/:orgId/ai/outputs` (List AI generated insights)
- `GET /v1/orgs/:orgId/ai/outputs/:id` (Full explainability view)
- `POST /v1/orgs/:orgId/ai/outputs/:id/review` (Accept, Modify, or Reject AI output)
- `GET /v1/orgs/:orgId/audit/access-logs` (Audit trailing)
- `GET /v1/orgs/:orgId/audit/ai-trail/:id` (Audit of specific AI decision lifecycle)
- `GET /v1/orgs/:orgId/ai/models` (Registered models overview)

---

## 4. Patient Management (Expanded Scope)

- `GET /v1/orgs/:orgId/patients` (List enrolled patients)
- `POST /v1/orgs/:orgId/patients` (Enroll a new patient, record PDPA consent)
- `GET /v1/orgs/:orgId/patients/:id` (Patient profile and biometric summary)
- `PUT /v1/orgs/:orgId/patients/:id`

---

## 5. Wearables & Biometrics (Expanded Scope)

### Wearable OAuth (Client/Patient Facing)
- `GET /v1/patients/:id/integrations/whoop/auth` (Redirects to WHOOP OAuth consent screen)
- `GET /v1/integrations/whoop/callback` (OAuth callback handler to exchange tokens)
- `DELETE /v1/patients/:id/integrations/whoop` (Revoke access)

### Webhooks
- `POST /v1/webhooks/whoop` (Receives daily biometric payloads: recovery, strain, sleep from WHOOP API)

### Hand Scanner Integration
- `POST /v1/patients/:id/scans` (Ingest manual or API-driven hand scanner results e.g. antioxidant scores)
- `GET /v1/patients/:id/scans`

---

## 6. Custom Vitamin Concepts (Expanded Scope)

### Generation
- `POST /v1/patients/:id/vitamin-concepts/generate` (Trigger the Recommendation Engine to analyze biometrics and propose a custom concept)

### Pharmacist Review & Action
- `GET /v1/orgs/:orgId/patients/:patientId/vitamin-concepts/pending`
- `POST /v1/orgs/:orgId/patients/:patientId/vitamin-concepts/:conceptId/review` (Pharmacist Accepts/Modifies/Rejects the AI concept)

### Client/Patient Fetch
- `GET /v1/patients/:id/vitamin-concepts/current` (Client views their active, approved vitamin concept in the Client Portal)

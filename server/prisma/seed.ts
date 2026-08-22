import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Demo-only password for seeded accounts — rotate before any real pilot data touches this DB.
const DEMO_PASSWORD = 'password123';

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Libralytics Clinic',
      type: 'clinic',
    }
  });

  // 2. Create Users (Clinicians)
  const drChen = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'sarah@libralytics.com',
      passwordHash,
      role: 'Lead Clinician'
    }
  });

  const drWebb = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'marcus@libralytics.com',
      passwordHash,
      role: 'Pharmacist'
    }
  });

  // 3. Create Patients
  const patient1 = await prisma.patient.create({
    data: {
      orgId: org.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      pdpaConsentStatus: true,
      consentTimestamp: new Date()
    }
  });

  const patient2 = await prisma.patient.create({
    data: {
      orgId: org.id,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      pdpaConsentStatus: true,
      consentTimestamp: new Date()
    }
  });

  // 4. Create AI Outputs (Insights)
  const aiOutput1 = await prisma.aiOutput.create({
    data: {
      orgId: org.id,
      type: 'vitamin_concept',
      content: JSON.stringify({
        prediction: "Vitamin D Deficiency",
        mapped_features: { has_fatigue: 1, has_muscle_weakness: 0, has_bone_pain: 1 }
      }),
      confidenceScore: 0.92,
      modelVersion: 'rf-v1',
      reviewStatus: 'pending'
    }
  });

  const aiOutput2 = await prisma.aiOutput.create({
    data: {
      orgId: org.id,
      type: 'vitamin_concept',
      content: JSON.stringify({
        prediction: "Healthy",
        mapped_features: { has_fatigue: 0, has_muscle_weakness: 0, has_bone_pain: 0 }
      }),
      confidenceScore: 0.85,
      modelVersion: 'rf-v1',
      reviewStatus: 'accepted',
      reviewedById: drChen.id
    }
  });

  // 5. Create Custom Vitamin Concepts (Formulations)
  await prisma.customVitaminConcept.create({
    data: {
      patientId: patient1.id,
      status: 'pending_pharmacist_review',
      recommendedSkus: JSON.stringify(["SKU-VITD-2000", "SKU-MAG-200"]),
      rationaleSummary: 'AI identified severe Vitamin D deficiency based on high fatigue and bone pain.',
      aiOutputId: aiOutput1.id
    }
  });

  await prisma.customVitaminConcept.create({
    data: {
      patientId: patient2.id,
      status: 'approved',
      recommendedSkus: JSON.stringify(["SKU-MULTI-100", "SKU-OMEGA-3"]),
      rationaleSummary: 'Baseline health metrics look good. Recommended general maintenance blend.',
      aiOutputId: aiOutput2.id
    }
  });

  // 6. Create Datasets
  await prisma.dataset.create({
    data: {
      orgId: org.id,
      name: 'Clinical Baseline 2025',
      type: 'clinical_export',
      qualityScore: 98
    }
  });

  await prisma.dataset.create({
    data: {
      orgId: org.id,
      name: 'Wearable Sync V2',
      type: 'api_stream',
      qualityScore: 85
    }
  });

  console.log('Seeding complete!');
  console.log('Test Organization ID:', org.id);
  console.log('Test Patient ID:', patient1.id);
  console.log('Demo login: sarah@libralytics.com / marcus@libralytics.com — password:', DEMO_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

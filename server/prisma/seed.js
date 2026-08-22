import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the database...');

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Bangkok Wellness Pharmacy Group',
      type: 'pharmacy',
    },
  });

  // 2. Create Users
  await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'admin@hyg3.health',
      role: 'org_admin',
    },
  });

  await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'analyst@hyg3.health',
      role: 'analyst',
    },
  });

  // 3. Create Patients
  const patient1 = await prisma.patient.create({
    data: {
      orgId: org.id,
      firstName: 'Nara',
      lastName: 'Thanakit',
      email: 'nara.t@example.com',
      pdpaConsentStatus: true,
      consentTimestamp: new Date(),
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      orgId: org.id,
      firstName: 'Somchai',
      lastName: 'Panich',
      email: 'somchai.p@example.com',
      pdpaConsentStatus: true,
      consentTimestamp: new Date(),
    },
  });

  // 4. Datasets — Phase 1 operational data sources
  await prisma.dataset.create({
    data: {
      orgId: org.id,
      name: 'Supplement Sales — Q3 2025',
      type: 'sales_export',
      rowCount: 24187,
      qualityScore: 88,
    },
  });

  await prisma.dataset.create({
    data: {
      orgId: org.id,
      name: 'Pharmaceutical & Vitamin Catalog 2025',
      type: 'catalog',
      rowCount: 3842,
      qualityScore: 92,
    },
  });

  await prisma.dataset.create({
    data: {
      orgId: org.id,
      name: 'Pharmacy Transactions — August 2026',
      type: 'api_stream',
      rowCount: 5610,
      qualityScore: 74,
    },
  });

  await prisma.dataset.create({
    data: {
      orgId: org.id,
      name: 'Wearable Biometric Sync — Pilot Cohort',
      type: 'api_stream',
      rowCount: 1290,
      qualityScore: 61,
    },
  });

  // 5. Product Catalog
  await prisma.product.create({
    data: {
      orgId: org.id,
      sku: 'VIT-D3-2000',
      name: 'Vitamin D3 2000 IU',
      category: 'vitamin',
      ingredients: JSON.stringify([{ name: 'Cholecalciferol', amount: '50mcg' }]),
      dosageForm: 'capsule',
    },
  });

  await prisma.product.create({
    data: {
      orgId: org.id,
      sku: 'MAG-GLY-200',
      name: 'Magnesium Glycinate 200mg',
      category: 'mineral',
      ingredients: JSON.stringify([{ name: 'Magnesium Bisglycinate', amount: '200mg' }]),
      dosageForm: 'capsule',
    },
  });

  await prisma.product.create({
    data: {
      orgId: org.id,
      sku: 'OMG-3-1000',
      name: 'Omega-3 Fish Oil 1000mg',
      category: 'supplement',
      ingredients: JSON.stringify([{ name: 'EPA', amount: '360mg' }, { name: 'DHA', amount: '240mg' }]),
      dosageForm: 'softgel',
    },
  });

  await prisma.product.create({
    data: {
      orgId: org.id,
      sku: 'VIT-C-500',
      name: 'Vitamin C 500mg',
      category: 'vitamin',
      ingredients: JSON.stringify([{ name: 'Ascorbic Acid', amount: '500mg' }]),
      dosageForm: 'tablet',
    },
  });

  await prisma.product.create({
    data: {
      orgId: org.id,
      sku: 'VIT-B12-1000',
      name: 'Methylcobalamin B12 1000mcg',
      category: 'vitamin',
      ingredients: JSON.stringify([{ name: 'Methylcobalamin', amount: '1000mcg' }]),
      dosageForm: 'sublingual',
    },
  });

  // 6. Biometric Readings
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    await prisma.biometricReading.create({
      data: {
        patientId: patient1.id,
        source: 'whoop',
        metricType: 'sleep_score',
        value: Math.floor(Math.random() * 30) + 58,
        recordedAt: date,
      },
    });
    await prisma.biometricReading.create({
      data: {
        patientId: patient1.id,
        source: 'whoop',
        metricType: 'recovery_score',
        value: Math.floor(Math.random() * 40) + 35,
        recordedAt: date,
      },
    });
  }

  // 7. AI Outputs — mix of statuses for realistic dashboard
  const aiOut1 = await prisma.aiOutput.create({
    data: {
      orgId: org.id,
      type: 'sales_trend',
      content: JSON.stringify({
        prediction: 'Vitamin D',
        headline: 'Vitamin D3 sales up 22% MoM',
        trend: 'upward',
        change: '+22%',
        period: 'July → August 2026',
        supporting_skus: ['VIT-D3-2000'],
        confidence_reason: 'Consistent weekly uplift across 3 pharmacy branches'
      }),
      confidenceScore: 0.91,
      modelVersion: 'hyg-v1',
      reviewStatus: 'pending',
    },
  });

  const aiOut2 = await prisma.aiOutput.create({
    data: {
      orgId: org.id,
      type: 'anomaly',
      content: JSON.stringify({
        prediction: 'Magnesium',
        headline: 'Abnormal return rate spike on MAG-GLY-200',
        anomaly_type: 'return_rate',
        value: '14.2%',
        expected: '3.1%',
        confidence_reason: 'Exceeds 3-sigma threshold vs. 6-month baseline'
      }),
      confidenceScore: 0.87,
      modelVersion: 'hyg-v1',
      reviewStatus: 'pending',
    },
  });

  const aiOut3 = await prisma.aiOutput.create({
    data: {
      orgId: org.id,
      type: 'data_quality',
      content: JSON.stringify({
        prediction: 'Iron',
        headline: 'Catalog missing dosage info on 8% of SKUs',
        affected_rows: 307,
        total_rows: 3842,
        missing_fields: ['dosageForm', 'ingredients'],
        confidence_reason: 'Direct field-null scan of catalog dataset'
      }),
      confidenceScore: 0.99,
      modelVersion: 'hyg-v1',
      reviewStatus: 'accepted',
    },
  });

  const aiOut4 = await prisma.aiOutput.create({
    data: {
      orgId: org.id,
      type: 'sales_trend',
      content: JSON.stringify({
        prediction: 'Vitamin B12',
        headline: 'Omega-3 demand signal trending — restock advisory',
        trend: 'upward',
        change: '+11%',
        period: 'Last 14 days',
        confidence_reason: 'Cross-branch inventory depletion rate'
      }),
      confidenceScore: 0.78,
      modelVersion: 'hyg-v1',
      reviewStatus: 'rejected',
    },
  });

  // 8. Link Concepts to patients
  await prisma.customVitaminConcept.create({
    data: {
      patientId: patient1.id,
      aiOutputId: aiOut1.id,
      status: 'pending_pharmacist_review',
      recommendedSkus: JSON.stringify(['VIT-D3-2000', 'MAG-GLY-200']),
      rationaleSummary: 'Low sleep and recovery scores suggest magnesium deficiency. Added Vitamin D3 as seasonal baseline given Q3 sales trend data.',
    },
  });

  await prisma.customVitaminConcept.create({
    data: {
      patientId: patient2.id,
      aiOutputId: aiOut2.id,
      status: 'pending_pharmacist_review',
      recommendedSkus: JSON.stringify(['OMG-3-1000', 'VIT-C-500']),
      rationaleSummary: 'Elevated oxidative stress markers. Omega-3 and antioxidant Vitamin C protocol recommended.',
    },
  });

  await prisma.customVitaminConcept.create({
    data: {
      patientId: patient1.id,
      aiOutputId: aiOut3.id,
      status: 'approved',
      recommendedSkus: JSON.stringify(['VIT-B12-1000']),
      rationaleSummary: 'Fatigue + sleep disruption pattern. B12 methylcobalamin formulation approved by pharmacist.',
    },
  });

  await prisma.customVitaminConcept.create({
    data: {
      patientId: patient2.id,
      aiOutputId: aiOut4.id,
      status: 'rejected',
      recommendedSkus: JSON.stringify(['OMG-3-1000']),
      rationaleSummary: 'Insufficient biometric history. Insight rejected — requires 30-day data window minimum.',
    },
  });

  console.log('✅ Seeding completed successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

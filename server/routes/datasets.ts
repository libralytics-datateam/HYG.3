import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /v1/datasets — list all datasets for the org
router.get('/', async (_req, res) => {
  try {
    const datasets = await prisma.dataset.findMany({
      include: { organization: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    const data = datasets.map(ds => ({
      id: ds.id,
      name: ds.name,
      type: ds.type,
      rowCount: ds.rowCount,
      qualityScore: ds.qualityScore,
      qualityLabel:
        ds.qualityScore >= 80 ? 'Good' :
        ds.qualityScore >= 60 ? 'Fair' : 'Poor',
      lastUpdated: ds.updatedAt,
      orgName: ds.organization.name
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

// POST /v1/datasets — register a new dataset (CSV upload stub)
router.post('/', async (req, res) => {
  try {
    const { name, type, rowCount = 0 } = req.body;

    if (!name || !type) {
      res.status(400).json({ error: 'name and type are required' });
      return;
    }

    const org = await prisma.organization.findFirst();
    if (!org) {
      res.status(500).json({ error: 'No organization found' });
      return;
    }

    const dataset = await prisma.dataset.create({
      data: {
        orgId: org.id,
        name,
        type,
        rowCount: Number(rowCount),
        qualityScore: 0, // Will be computed after ingestion
      }
    });

    res.status(201).json({ success: true, data: dataset });
  } catch (error) {
    console.error('Error creating dataset:', error);
    res.status(500).json({ error: 'Failed to create dataset' });
  }
});

// GET /v1/datasets/:id — single dataset detail
router.get('/:id', async (req, res) => {
  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: req.params['id'] },
      include: { organization: { select: { name: true } } }
    });

    if (!dataset) {
      res.status(404).json({ error: 'Dataset not found' });
      return;
    }

    res.json({ success: true, data: dataset });
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
});

export default router;

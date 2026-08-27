import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { prisma } from '../db';
import { isSalesShaped, scoreQuality, computeSalesInsight } from '../services/datasetAnalysis';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /v1/datasets — list all datasets for the caller's org
router.get('/', async (req, res) => {
  try {
    const datasets = await prisma.dataset.findMany({
      where: { orgId: req.user!.orgId },
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

// POST /v1/datasets — register a dataset. If a CSV file is attached
// (multipart field "file"), it's actually parsed: rowCount and
// qualityScore are computed from real row validity, and — when the
// columns look like sales data — a genuine trend/anomaly AiOutput is
// created from the parsed rows. The file itself is not persisted; only
// the computed summary is (no DB permission to add a raw-rows table —
// see data/DATA_PROVENANCE.md "Path forward" for the same constraint
// elsewhere).
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      res.status(400).json({ error: 'name and type are required' });
      return;
    }

    let rowCount = Number(req.body.rowCount) || 0;
    let qualityScore = 0;
    let insight: ReturnType<typeof computeSalesInsight> = null;

    if (req.file) {
      let rows: Record<string, string>[];
      try {
        rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
      } catch {
        res.status(400).json({ error: 'Could not parse file as CSV' });
        return;
      }

      const columns = rows.length > 0 ? Object.keys(rows[0]!) : [];
      const scored = scoreQuality(rows, columns);
      rowCount = scored.rowCount;
      qualityScore = scored.qualityScore;

      if (isSalesShaped(columns)) {
        insight = computeSalesInsight(rows);
      }
    }

    const dataset = await prisma.dataset.create({
      data: {
        orgId: req.user!.orgId,
        name,
        type,
        rowCount,
        qualityScore,
      }
    });

    if (insight) {
      await prisma.aiOutput.create({
        data: {
          orgId: req.user!.orgId,
          type: 'sales_trend',
          content: JSON.stringify({
            headline: insight.headline,
            prediction: insight.headline,
            fact: insight.fact,
            inference: insight.inference,
            recommendation: insight.recommendation,
            uncertainty: insight.uncertainty,
            sourceDatasetId: dataset.id,
          }),
          confidenceScore: insight.confidence,
          modelVersion: 'sales-trend-v1',
          reviewStatus: 'pending',
        }
      });
    }

    res.status(201).json({ success: true, data: dataset, insightGenerated: !!insight });
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

    if (!dataset || dataset.orgId !== req.user!.orgId) {
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

import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { prisma } from '../db';
import { parseIngredients } from '../services/productMatch';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /v1/products — list supplement/vitamin product catalog for the caller's org
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { orgId: req.user!.orgId },
      orderBy: { category: 'asc' }
    });

    const data = products.map(p => {
      const { list, price, currency, purchaseUrl } = parseIngredients(p.ingredients);
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        dosageForm: p.dosageForm,
        ingredients: list,
        price,
        currency,
        purchaseUrl,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /v1/products/upload — real CSV ingestion (multipart field "file"),
// same pattern as datasets.ts's upload. This is deliberately just the
// catalog *infrastructure* — no product rows exist until a real file is
// uploaded here. Never seeded with invented products/prices; the empty
// state (0 rows) documented in decisions.md/MVP-LAUNCH-CHECKLIST.md stays
// accurate until an actual pilot partner or licensed dataset provides one.
//
// Expected columns: sku, name, category, dosageForm, ingredients
// (semicolon-separated within the cell, e.g. "Vitamin D3; Cholecalciferol"),
// and optionally price, currency, purchaseUrl — all three genuinely
// optional (a partner may have a catalog with no public pricing yet).
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'A CSV file is required (multipart field "file")' });
      return;
    }

    let rows: Record<string, string>[];
    try {
      rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
    } catch {
      res.status(400).json({ error: 'Could not parse file as CSV' });
      return;
    }

    const required = ['sku', 'name', 'category', 'dosageForm'];
    const columns = rows.length > 0 ? Object.keys(rows[0]!) : [];
    const missingColumns = required.filter((c) => !columns.includes(c));
    if (missingColumns.length > 0) {
      res.status(400).json({ error: `Missing required column(s): ${missingColumns.join(', ')}` });
      return;
    }

    const toInsert: { orgId: string; sku: string; name: string; category: string; dosageForm: string; ingredients: string }[] = [];
    let skipped = 0;

    for (const row of rows) {
      if (!row['sku']?.trim() || !row['name']?.trim() || !row['category']?.trim() || !row['dosageForm']?.trim()) {
        skipped++;
        continue;
      }
      const priceRaw = row['price']?.trim();
      const price = priceRaw ? Number(priceRaw) : null;
      const ingredients = {
        list: row['ingredients'] ? row['ingredients'].split(';').map((s) => s.trim()).filter(Boolean) : [],
        price: price != null && !Number.isNaN(price) ? price : null,
        currency: row['currency']?.trim() || null,
        purchaseUrl: row['purchaseUrl']?.trim() || null,
      };
      toInsert.push({
        orgId: req.user!.orgId,
        sku: row['sku'].trim(),
        name: row['name'].trim(),
        category: row['category'].trim(),
        dosageForm: row['dosageForm'].trim(),
        ingredients: JSON.stringify(ingredients),
      });
    }

    if (toInsert.length > 0) {
      await prisma.product.createMany({ data: toInsert });
    }

    res.status(201).json({
      success: true,
      data: { totalRows: rows.length, inserted: toInsert.length, skipped },
    });
  } catch (error) {
    console.error('Error uploading product catalog:', error);
    res.status(500).json({ error: 'Failed to upload product catalog' });
  }
});

export default router;

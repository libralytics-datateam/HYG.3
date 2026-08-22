import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /v1/products — list supplement/vitamin product catalog for the caller's org
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { orgId: req.user!.orgId },
      orderBy: { category: 'asc' }
    });

    const data = products.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      dosageForm: p.dosageForm,
      ingredients: JSON.parse(p.ingredients)
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

export default router;

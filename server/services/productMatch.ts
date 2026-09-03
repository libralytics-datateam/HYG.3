import { prisma } from '../db';

interface Vitamin {
  name: string;
  dosage: string;
  reason: string;
  [key: string]: unknown;
}

interface ProductIngredients {
  list: string[];
  price: number | null;
  currency: string | null;
  purchaseUrl: string | null;
}

export function parseIngredients(raw: string): ProductIngredients {
  try {
    const parsed = JSON.parse(raw);
    // Back-compat: older/simpler shape was just a plain string array.
    if (Array.isArray(parsed)) return { list: parsed, price: null, currency: null, purchaseUrl: null };
    return {
      list: Array.isArray(parsed.list) ? parsed.list : [],
      price: typeof parsed.price === 'number' ? parsed.price : null,
      currency: typeof parsed.currency === 'string' ? parsed.currency : null,
      purchaseUrl: typeof parsed.purchaseUrl === 'string' ? parsed.purchaseUrl : null,
    };
  } catch {
    return { list: [], price: null, currency: null, purchaseUrl: null };
  }
}

// Matches an AI-suggested vitamin (free-text name, e.g. "Vitamin D3") against
// the org's real Product catalog by loose case-insensitive substring overlap
// on the name. Deliberately simple — no fuzzy-matching library, no invented
// confidence score for the match itself. Returns the vitamins array
// unchanged (same shape, same order) except each entry gains a `product`
// key: null when nothing in the catalog matches (the common case today,
// since Product has 0 rows until a real partner/CSV upload exists), or the
// real sku/name/price/purchaseUrl when it does.
export async function matchVitaminsToProducts(orgId: string, vitamins: Vitamin[]): Promise<Vitamin[]> {
  if (vitamins.length === 0) return vitamins;

  const products = await prisma.product.findMany({ where: { orgId } });
  if (products.length === 0) return vitamins.map((v) => ({ ...v, product: null }));

  return vitamins.map((v) => {
    const needle = v.name.toLowerCase().trim();
    const match = products.find((p) => {
      const hay = p.name.toLowerCase();
      return hay.includes(needle) || needle.includes(hay);
    });
    if (!match) return { ...v, product: null };

    const { price, currency, purchaseUrl } = parseIngredients(match.ingredients);
    return {
      ...v,
      product: {
        sku: match.sku,
        name: match.name,
        price,
        currency,
        purchaseUrl,
      },
    };
  });
}

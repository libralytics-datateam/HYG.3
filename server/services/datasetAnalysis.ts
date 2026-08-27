// Real (not fabricated) analysis of an uploaded CSV dataset: a data-quality
// score computed from actual row validity, plus — when the columns look
// like sales data — a genuine trend/anomaly insight computed from the
// parsed rows. Nothing here is a placeholder number.

export interface QualityResult {
  rowCount: number;
  qualityScore: number; // 0-100, based on real row validity
}

export interface SalesInsight {
  headline: string;
  fact: string;
  inference: string;
  recommendation: string;
  uncertainty: string;
  confidence: number;
}

const REQUIRED_SALES_COLUMNS = ['Date', 'Product Name', 'Units Sold', 'Revenue'];

export function isSalesShaped(columns: string[]): boolean {
  return REQUIRED_SALES_COLUMNS.every((col) => columns.includes(col));
}

export function scoreQuality(rows: Record<string, string>[], columns: string[]): QualityResult {
  if (rows.length === 0) return { rowCount: 0, qualityScore: 0 };

  let validRows = 0;
  for (const row of rows) {
    const hasAllFields = columns.every((col) => row[col] !== undefined && row[col] !== '');
    const numericFieldsOk = ['Units Sold', 'Price', 'Revenue', 'Units Returned']
      .filter((col) => columns.includes(col))
      .every((col) => {
        const n = Number(row[col]);
        return !Number.isNaN(n) && n >= 0;
      });
    if (hasAllFields && numericFieldsOk) validRows++;
  }

  return {
    rowCount: rows.length,
    qualityScore: Math.round((validRows / rows.length) * 100),
  };
}

export function computeSalesInsight(rows: Record<string, string>[]): SalesInsight | null {
  if (rows.length < 10) return null; // not enough data to say anything meaningful

  // Revenue by product
  const revenueByProduct = new Map<string, number>();
  const unitsByProduct = new Map<string, number>();
  const returnedByProduct = new Map<string, number>();
  // Revenue by calendar month (YYYY-MM), to compare the two most recent months present
  const revenueByMonth = new Map<string, number>();

  for (const row of rows) {
    const product = row['Product Name'] || 'Unknown';
    const revenue = Number(row['Revenue']) || 0;
    const units = Number(row['Units Sold']) || 0;
    const returned = Number(row['Units Returned']) || 0;
    const date = row['Date'] || '';
    const month = date.slice(0, 7); // 'YYYY-MM'

    revenueByProduct.set(product, (revenueByProduct.get(product) || 0) + revenue);
    unitsByProduct.set(product, (unitsByProduct.get(product) || 0) + units);
    returnedByProduct.set(product, (returnedByProduct.get(product) || 0) + returned);
    if (month.length === 7) revenueByMonth.set(month, (revenueByMonth.get(month) || 0) + revenue);
  }

  const topProduct = [...revenueByProduct.entries()].sort((a, b) => b[1] - a[1])[0];

  // Highest return-rate product (min 20 units sold so the rate isn't noise)
  const returnRates = [...unitsByProduct.entries()]
    .filter(([, units]) => units >= 20)
    .map(([product, units]) => ({
      product,
      rate: (returnedByProduct.get(product) || 0) / units,
    }))
    .sort((a, b) => b.rate - a.rate);
  const worstReturns = returnRates[0];

  const months = [...revenueByMonth.keys()].sort();
  let momText = 'not enough monthly coverage to compute a month-over-month change';
  if (months.length >= 2) {
    const lastMonth = months[months.length - 1]!;
    const prevMonth = months[months.length - 2]!;
    const lastRevenue = revenueByMonth.get(lastMonth)!;
    const prevRevenue = revenueByMonth.get(prevMonth)!;
    const pctChange = prevRevenue > 0 ? ((lastRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    momText = `revenue moved ${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}% from ${prevMonth} to ${lastMonth}`;
  }

  const factParts = [`Top revenue product: ${topProduct?.[0] ?? 'n/a'} ($${(topProduct?.[1] ?? 0).toFixed(2)})`, momText];
  if (worstReturns) {
    factParts.push(`Highest return rate: ${worstReturns.product} at ${(worstReturns.rate * 100).toFixed(1)}%`);
  }

  return {
    headline: `Sales trend summary across ${rows.length} rows`,
    fact: factParts.join('. '),
    inference: months.length >= 2
      ? 'Revenue trend direction is computed directly from the uploaded rows, not modeled or predicted.'
      : 'This upload does not span enough distinct months to infer a trend direction.',
    recommendation: worstReturns && worstReturns.rate > 0.05
      ? `Review ${worstReturns.product}'s return rate before restocking.`
      : 'No return-rate anomalies above the review threshold in this upload.',
    uncertainty: `Based on ${rows.length} rows from a single upload — not statistically validated, and this dataset is public/demo data, not a confirmed real partner's sales (see data/DATA_PROVENANCE.md).`,
    confidence: rows.length >= 100 ? 0.7 : 0.5,
  };
}

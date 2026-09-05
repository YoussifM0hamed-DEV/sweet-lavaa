/**
 * All monetary maths lives here so the server is the single source of truth for
 * prices, discounts, delivery fees and totals.
 */

/** Round to 2 decimals without floating point drift. */
export const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/** The price a customer actually pays for one unit of a product. */
export const effectiveUnitPrice = (product) => {
  const base = Number(product.price) || 0;
  const sale = Number(product.discountPrice) || 0;
  if (sale > 0 && sale < base) return round2(sale);
  return round2(base);
};

export const discountPercentage = (product) => {
  const base = Number(product.price) || 0;
  const sale = Number(product.discountPrice) || 0;
  if (!base || !sale || sale >= base) return 0;
  return Math.round(((base - sale) / base) * 100);
};

export const sumLineTotals = (lines) => round2(lines.reduce((total, line) => total + line.lineTotal, 0));

export default { round2, effectiveUnitPrice, discountPercentage, sumLineTotals };

/** Shared product-shape helpers so cards, details and cart agree on the maths. */

export const finalPrice = (product) => {
  if (!product) return 0;
  const price = Number(product.price) || 0;
  const sale = Number(product.discountPrice) || 0;
  return sale > 0 && sale < price ? sale : price;
};

export const hasDiscount = (product) =>
  Boolean(product && product.discountPrice > 0 && product.discountPrice < product.price);

export const discountPercent = (product) => {
  if (!hasDiscount(product)) return 0;
  return Math.round(((product.price - product.discountPrice) / product.price) * 100);
};

export const stockStatus = (product) => {
  if (!product) return 'out_of_stock';
  if (product.trackInventory === false) return 'in_stock';
  if ((product.stock ?? 0) <= 0) return 'out_of_stock';
  if ((product.stock ?? 0) <= (product.lowStockThreshold ?? 5)) return 'low_stock';
  return 'in_stock';
};

export const isInStock = (product) => stockStatus(product) !== 'out_of_stock';

export const productImage = (product, index = 0) => {
  if (!product?.images?.length) return '';
  const primary = product.images.find((image) => image.isPrimary);
  if (index === 0 && primary) return primary.url;
  return product.images[index]?.url || product.images[0]?.url || '';
};

/**
 * Requests a smaller, auto-formatted render from Cloudinary.
 * Non-Cloudinary URLs are returned untouched.
 */
export const optimizedImage = (url, width = 600) => {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

export const productBadges = (product) => {
  const badges = [];
  if (hasDiscount(product)) badges.push({ label: `-${discountPercent(product)}%`, tone: 'sale' });
  if (product?.isBestSeller) badges.push({ label: 'Best seller', tone: 'best' });
  else if (product?.isNewArrival) badges.push({ label: 'New', tone: 'new' });
  if (product?.isSeasonal) badges.push({ label: 'Seasonal', tone: 'new' });
  return badges.slice(0, 2);
};

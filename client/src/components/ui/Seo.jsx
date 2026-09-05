import { Helmet } from 'react-helmet-async';
import { useSettings } from '../../context/SettingsContext.jsx';

/**
 * Per-page SEO. Falls back to the store-wide meta configured in the admin
 * dashboard, and emits Open Graph plus optional product structured data.
 */
const Seo = ({ title, description, image, type = 'website', noIndex = false, product, canonical }) => {
  const { settings, storeName } = useSettings();

  const pageTitle = title ? `${title} · ${storeName}` : settings.seo?.metaTitle || storeName;
  const pageDescription = description || settings.seo?.metaDescription || settings.store?.description || '';
  const pageImage = image || settings.store?.logo?.url || '';
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const structuredData = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.shortDescription || pageDescription,
        image: product.images?.map((entry) => entry.url) || [],
        sku: product.sku || undefined,
        brand: { '@type': 'Brand', name: storeName },
        ...(product.ratingCount > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.ratingAverage,
                reviewCount: product.ratingCount,
              },
            }
          : {}),
        offers: {
          '@type': 'Offer',
          price: product.discountPrice > 0 && product.discountPrice < product.price ? product.discountPrice : product.price,
          priceCurrency: settings.commerce?.currency || 'EGP',
          availability: (product.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url,
        },
      }
    : null;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {settings.seo?.keywords && <meta name="keywords" content={settings.seo.keywords} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={storeName} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      {pageImage && <meta property="og:image" content={pageImage} />}
      {url && <meta property="og:url" content={url} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {pageImage && <meta name="twitter:image" content={pageImage} />}

      {structuredData && <script type="application/ld+json">{JSON.stringify(structuredData)}</script>}
    </Helmet>
  );
};

export default Seo;

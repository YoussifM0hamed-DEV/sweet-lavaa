/**
 * Editorial imagery for sections that are not driven by the product catalogue.
 * SmartImage falls back to a branded gradient if any of these fail to load.
 */
const unsplash = (id, width = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

export const IMAGE_URLS = {
  heroMain: unsplash('1565958011703-44f9829ba187', 1000),
  heroSideOne: unsplash('1499636136210-6f4ee915583e', 500),
  heroSideTwo: unsplash('1533134242443-d4fd215305ad', 500),
  promoBanner: unsplash('1549007994-cb92caebd54b', 1400),
  offerCake: unsplash('1578985545062-69928b1d9587', 800),
  offerBox: unsplash('1512058564366-18510be2db19', 800),
  aboutStory: unsplash('1509440159596-0249088772ff', 1000),
  aboutKitchen: unsplash('1556910103-1c02745aae4d', 1000),
  contactShop: unsplash('1517433670267-08bbd4be890f', 1000),
};

export default IMAGE_URLS;

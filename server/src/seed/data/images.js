/**
 * Photography used for the development catalogue.
 * These are remote Unsplash URLs — the storefront falls back to a branded
 * gradient placeholder if any of them fail to load, so the UI never breaks.
 */
const unsplash = (id, width = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

export const IMAGES = {
  chocolateCake: unsplash('1565958011703-44f9829ba187'),
  redVelvet: unsplash('1586788680434-30d324b2d46f'),
  carrotCake: unsplash('1621303837174-89787a7d4729'),
  lotusCake: unsplash('1578985545062-69928b1d9587'),
  pistachioCake: unsplash('1519869325930-281384150729'),
  birthdayCake: unsplash('1558636508-e0db3814bd1d'),

  chocolateChip: unsplash('1499636136210-6f4ee915583e'),
  doubleChocolate: unsplash('1590080875515-8a3a8dc5735e'),
  oatmeal: unsplash('1558961363-fa8fdf82db35'),
  macarons: unsplash('1569864358642-9d1684040f43'),

  classicCheesecake: unsplash('1533134242443-d4fd215305ad'),
  berryCheesecake: unsplash('1567327613485-fbc7bf196198'),
  lotusCheesecake: unsplash('1524351199678-941a58a3df50'),

  vanillaCupcake: unsplash('1486427944299-d1955d23e34d'),
  redVelvetCupcake: unsplash('1614707267537-b85aaf00c4b7'),
  chocolateCupcake: unsplash('1519869325930-281384150729'),

  fudgeBrownie: unsplash('1606313564200-e75d5e30476c'),
  walnutBrownie: unsplash('1541599468348-e96984315921'),
  blondie: unsplash('1590080875515-8a3a8dc5735e'),

  glazedDonut: unsplash('1551024506-0bccd828d307'),
  chocolateDonut: unsplash('1527515637462-cff94eecc1ac'),
  filledDonut: unsplash('1587314168485-3236d6710814'),

  tiramisu: unsplash('1571877227200-a0d98ea607e9'),
  pudding: unsplash('1488477181946-6428a0291777'),
  eclair: unsplash('1550617931-e17a7b70dce2'),

  giftBoxLarge: unsplash('1549007994-cb92caebd54b'),
  giftBoxSmall: unsplash('1481391319762-47dff72954d9'),
  corporateBox: unsplash('1607478900766-efe13248b125'),

  ramadanBox: unsplash('1512058564366-18510be2db19'),
  festiveCake: unsplash('1512910539040-b3e59db73df8'),

  categoryCakes: unsplash('1578985545062-69928b1d9587', 900),
  categoryCookies: unsplash('1499636136210-6f4ee915583e', 900),
  categoryCheesecake: unsplash('1533134242443-d4fd215305ad', 900),
  categoryCupcakes: unsplash('1486427944299-d1955d23e34d', 900),
  categoryBrownies: unsplash('1606313564200-e75d5e30476c', 900),
  categoryDonuts: unsplash('1551024506-0bccd828d307', 900),
  categoryDesserts: unsplash('1571877227200-a0d98ea607e9', 900),
  categoryGifts: unsplash('1549007994-cb92caebd54b', 900),
  categorySeasonal: unsplash('1512058564366-18510be2db19', 900),
};

export default IMAGES;

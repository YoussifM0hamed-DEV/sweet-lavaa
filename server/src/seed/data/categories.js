import { IMAGES } from './images.js';

export const categories = [
  {
    name: 'Cakes',
    tagline: 'Layered, generous, unforgettable',
    description:
      'Tall celebration cakes built on butter sponge, silky ganache and fillings we make from scratch every morning.',
    image: { url: IMAGES.categoryCakes, alt: 'Sliced chocolate layer cake' },
    displayOrder: 1,
    isFeatured: true,
  },
  {
    name: 'Cookies',
    tagline: 'Crisp edges, molten middles',
    description: 'Thick bakery-style cookies baked in small batches so they reach you the day they are made.',
    image: { url: IMAGES.categoryCookies, alt: 'Chocolate chip cookies on parchment' },
    displayOrder: 2,
    isFeatured: true,
  },
  {
    name: 'Cheesecakes',
    tagline: 'Slow baked, impossibly creamy',
    description: 'Real cream cheese, a buttery biscuit base and a two-hour bake. Nothing rushed, nothing artificial.',
    image: { url: IMAGES.categoryCheesecake, alt: 'Classic New York cheesecake' },
    displayOrder: 3,
    isFeatured: true,
  },
  {
    name: 'Cupcakes',
    tagline: 'Small format, full flavour',
    description: 'Perfectly portioned cakes topped with buttercream we whip fresh for every order.',
    image: { url: IMAGES.categoryCupcakes, alt: 'Vanilla cupcakes with buttercream' },
    displayOrder: 4,
    isFeatured: true,
  },
  {
    name: 'Brownies',
    tagline: 'Dense, fudgy, serious chocolate',
    description: 'Belgian dark chocolate baked low and slow for a crackled top and a centre that stays molten.',
    image: { url: IMAGES.categoryBrownies, alt: 'Stack of fudge brownies' },
    displayOrder: 5,
    isFeatured: true,
  },
  {
    name: 'Donuts',
    tagline: 'Proofed overnight, fried at dawn',
    description: 'Brioche dough rested for twelve hours, fried fresh and finished by hand.',
    image: { url: IMAGES.categoryDonuts, alt: 'Glazed donuts' },
    displayOrder: 6,
    isFeatured: true,
  },
  {
    name: 'Desserts',
    tagline: 'Spoon-ready indulgence',
    description: 'Tiramisu, puddings and patisserie classics packed to travel beautifully.',
    image: { url: IMAGES.categoryDesserts, alt: 'Tiramisu in a glass' },
    displayOrder: 7,
  },
  {
    name: 'Gift Boxes',
    tagline: 'Ready to give, impossible to resist',
    description: 'Curated assortments in our signature cream and chocolate packaging, with a handwritten card.',
    image: { url: IMAGES.categoryGifts, alt: 'Sweet gift box tied with ribbon' },
    displayOrder: 8,
    isFeatured: true,
  },
  {
    name: 'Seasonal',
    tagline: 'Here for a moment, remembered all year',
    description: 'Limited runs built around the season — Ramadan, Eid, winter spices and summer fruit.',
    image: { url: IMAGES.categorySeasonal, alt: 'Festive seasonal sweets box' },
    displayOrder: 9,
  },
];

export default categories;

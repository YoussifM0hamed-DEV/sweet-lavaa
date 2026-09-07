/* eslint-disable no-console */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import {
  User, Category, Product, Coupon, DeliveryZone, Review, Order, Cart, Wishlist, Setting, Newsletter, ContactMessage,
} from '../models/index.js';
import { categories as categorySeed } from './data/categories.js';
import { products as productSeed } from './data/products.js';
import { deliveryZones as zoneSeed } from './data/deliveryZones.js';
import { coupons as couponSeed } from './data/coupons.js';
import { toSlug } from '../utils/slug.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { ROLES, ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../config/constants.js';
import logger from '../utils/logger.js';

const COLLECTIONS = [User, Category, Product, Coupon, DeliveryZone, Review, Order, Cart, Wishlist, Setting, Newsletter, ContactMessage];

const wipe = async () => {
  await Promise.all(COLLECTIONS.map((Model) => Model.deleteMany({})));
  logger.info('Existing data cleared.');
};

const sample = (array) => array[Math.floor(Math.random() * array.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const CUSTOMERS = [
  { firstName: 'Nour', lastName: 'Hassan', email: 'nour.hassan@example.com', phone: '01001234567' },
  { firstName: 'Youssef', lastName: 'Kamal', email: 'youssef.kamal@example.com', phone: '01112345678' },
  { firstName: 'Salma', lastName: 'Ibrahim', email: 'salma.ibrahim@example.com', phone: '01223456789' },
  { firstName: 'Omar', lastName: 'Fathy', email: 'omar.fathy@example.com', phone: '01034567890' },
  { firstName: 'Mariam', lastName: 'Adel', email: 'mariam.adel@example.com', phone: '01145678901' },
  { firstName: 'Karim', lastName: 'Sobhy', email: 'karim.sobhy@example.com', phone: '01256789012' },
  { firstName: 'Hana', lastName: 'Zaki', email: 'hana.zaki@example.com', phone: '01067890123' },
  { firstName: 'Tarek', lastName: 'Mansour', email: 'tarek.mansour@example.com', phone: '01178901234' },
];

const REVIEW_TEXT = [
  { rating: 5, title: 'Exactly as described', comment: 'Arrived warm and the centre really does pour. Ordered again the same week.' },
  { rating: 5, title: 'Best in Cairo', comment: 'I have tried most bakeries in New Cairo and nothing comes close to this. The packaging is beautiful too.' },
  { rating: 4, title: 'Very good', comment: 'Delicious and clearly fresh. A little sweeter than I expected but everyone at the table finished theirs.' },
  { rating: 5, title: 'Worth every pound', comment: 'Ordered for my mother birthday and it was the highlight of the evening. Delivery was on time.' },
  { rating: 5, title: 'Repeat customer now', comment: 'Third order this month. Consistent quality every single time, which is rare.' },
  { rating: 4, title: 'Great, will reorder', comment: 'Texture was perfect. I wish the box was slightly bigger for the price, but no complaints on taste.' },
  { rating: 5, title: 'Gift went down well', comment: 'Sent this as a thank you to a colleague and got a phone call about it. Handwritten card was a nice touch.' },
  { rating: 3, title: 'Good but arrived late', comment: 'The sweets themselves were lovely. Delivery ran about an hour past the window.' },
];

const seedSettings = async () => {
  await Setting.create({
    key: 'general',
    store: {
      name: 'Sweet Lava',
      tagline: 'Handcrafted sweets, baked fresh every morning.',
      description:
        'Sweet Lava is a premium bakery in New Cairo crafting cakes, cookies, cheesecakes and desserts with real butter, Belgian chocolate and a great deal of patience.',
    },
    contact: {
      phone: '+20 100 555 0199',
      whatsapp: '+20 100 555 0199',
      email: 'hello@sweetlava.com',
      address: '12 Waterway Drive, New Cairo, Cairo, Egypt',
      workingHours: 'Daily 10:00 — 23:00',
    },
    social: {
      facebook: 'https://facebook.com/sweetlava',
      instagram: 'https://instagram.com/sweetlava',
      tiktok: 'https://tiktok.com/@sweetlava',
    },
    commerce: {
      currency: 'EGP',
      currencySymbol: 'EGP',
      minimumOrderAmount: 150,
      allowCashOnDelivery: true,
      lowStockThreshold: 5,
    },
    announcement: {
      enabled: true,
      text: 'Free delivery on orders over 800 EGP — use code SWEET10 for 10% off your first box.',
      link: '/products',
    },
  });
  logger.info('Store settings created.');
};

const seedUsers = async () => {
  const admin = await User.create({
    firstName: 'Sweet',
    lastName: 'Lava',
    email: env.seed.adminEmail,
    phone: '01005550199',
    password: env.seed.adminPassword,
    role: ROLES.SUPER_ADMIN,
    isEmailVerified: true,
  });

  const manager = await User.create({
    firstName: 'Layla',
    lastName: 'Mostafa',
    email: 'manager@sweetlava.com',
    phone: '01005550188',
    password: env.seed.adminPassword,
    role: ROLES.MANAGER,
    isEmailVerified: true,
  });

  const support = await User.create({
    firstName: 'Ahmed',
    lastName: 'Rashad',
    email: 'support@sweetlava.com',
    phone: '01005550177',
    password: env.seed.adminPassword,
    role: ROLES.SUPPORT,
    isEmailVerified: true,
  });

  const customers = await Promise.all(
    CUSTOMERS.map((customer, index) =>
      User.create({
        ...customer,
        password: 'Customer@123',
        role: ROLES.CUSTOMER,
        isEmailVerified: true,
        createdAt: daysAgo(randomInt(10, 180)),
        addresses: [
          {
            label: 'Home',
            fullName: `${customer.firstName} ${customer.lastName}`,
            phone: customer.phone,
            governorate: 'Cairo',
            city: 'New Cairo',
            district: `District ${index + 1}`,
            street: `${randomInt(1, 90)} Street ${randomInt(1, 20)}`,
            building: String(randomInt(1, 30)),
            apartment: String(randomInt(1, 12)),
            isDefault: true,
          },
        ],
      }),
    ),
  );

  logger.info(`Users created: 1 super admin, 1 manager, 1 support, ${customers.length} customers.`);
  return { admin, manager, support, customers };
};

const seedCatalogue = async () => {
  const categories = await Category.create(
    categorySeed.map((category) => ({ ...category, slug: toSlug(category.name) })),
  );
  const categoryByName = new Map(categories.map((category) => [category.name, category]));
  logger.info(`Categories created: ${categories.length}.`);

  const products = await Product.create(
    productSeed.map((product, index) => {
      const category = categoryByName.get(product.category);
      if (!category) throw new Error(`Unknown category "${product.category}" for product "${product.name}".`);

      return {
        ...product,
        category: category._id,
        slug: toSlug(product.name),
        sku: `SL-${String(index + 1).padStart(4, '0')}`,
        seo: {
          title: `${product.name} | Sweet Lava`,
          description: product.shortDescription,
        },
        createdAt: daysAgo(randomInt(1, 120)),
      };
    }),
  );

  logger.info(`Products created: ${products.length}.`);
  return { categories, products };
};

/** Builds a realistic order history so the dashboard charts have data. */
const seedOrders = async ({ customers, products, zones, categories }) => {
  const categoryNameById = new Map(categories.map((category) => [String(category._id), category.name]));

  const orders = [];
  const statuses = [
    ORDER_STATUS.DELIVERED, ORDER_STATUS.DELIVERED, ORDER_STATUS.DELIVERED,
    ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.PREPARING, ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PENDING, ORDER_STATUS.CANCELLED,
  ];

  for (let index = 0; index < 60; index += 1) {
    const customer = sample(customers);
    const zone = sample(zones.filter((entry) => entry.isActive));
    const status = sample(statuses);
    const createdAt = daysAgo(randomInt(0, 75));

    const lineCount = randomInt(1, 4);
    const chosen = [];
    while (chosen.length < lineCount) {
      const product = sample(products);
      if (!chosen.some((entry) => String(entry._id) === String(product._id))) chosen.push(product);
    }

    const items = chosen.map((product) => {
      const quantity = randomInt(1, 3);
      const unitPrice = product.discountPrice > 0 && product.discountPrice < product.price ? product.discountPrice : product.price;
      return {
        product: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images[0]?.url || '',
        category: product.category,
        categoryName: categoryNameById.get(String(product.category)) || '',
        variant: { id: null, name: '' },
        unitPrice,
        originalPrice: product.price,
        quantity,
        lineTotal: Math.round(unitPrice * quantity * 100) / 100,
      };
    });

    const subtotal = Math.round(items.reduce((total, item) => total + item.lineTotal, 0) * 100) / 100;
    const freeDelivery = zone.freeDeliveryThreshold > 0 && subtotal >= zone.freeDeliveryThreshold;
    const deliveryFee = freeDelivery ? 0 : zone.deliveryFee;
    const discount = index % 5 === 0 ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    const total = Math.round((subtotal - discount + deliveryFee) * 100) / 100;

    const isPaid = status === ORDER_STATUS.DELIVERED || (status !== ORDER_STATUS.CANCELLED && index % 3 !== 0);
    const address = customer.addresses[0];

    orders.push({
      orderNumber: generateOrderNumber(),
      user: customer._id,
      items,
      contact: {
        fullName: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
      },
      shippingAddress: {
        governorate: address.governorate,
        city: address.city,
        district: address.district,
        street: address.street,
        building: address.building,
        apartment: address.apartment,
      },
      deliveryZone: { zone: zone._id, name: zone.name, fee: deliveryFee, estimatedTime: zone.estimatedTime },
      coupon: discount > 0 ? { coupon: null, code: 'SWEET10', discountType: 'percentage', discountValue: 10 } : {},
      pricing: { subtotal, discount, deliveryFee, tax: 0, total, currency: 'EGP' },
      payment: {
        method: PAYMENT_METHODS.COD,
        status: status === ORDER_STATUS.CANCELLED ? PAYMENT_STATUS.FAILED : isPaid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
        provider: 'cash',
        transactionId: isPaid ? `TXN${randomInt(100000, 999999)}` : null,
        paidAt: isPaid ? createdAt : null,
      },
      status,
      statusHistory: [{ status: ORDER_STATUS.PENDING, changedAt: createdAt, note: 'Order placed.' }],
      inventoryApplied: status !== ORDER_STATUS.CANCELLED,
      deliveredAt: status === ORDER_STATUS.DELIVERED ? new Date(createdAt.getTime() + 36e5 * 30) : undefined,
      createdAt,
      updatedAt: createdAt,
    });
  }

  const created = await Order.insertMany(orders);
  logger.info(`Orders created: ${created.length}.`);
  return created;
};

/** Reviews are only attached to products the customer actually received. */
const seedReviews = async ({ orders, customers }) => {
  const delivered = orders.filter((order) => order.status === ORDER_STATUS.DELIVERED);
  const seen = new Set();
  const reviews = [];

  delivered.forEach((order) => {
    order.items.forEach((item) => {
      const key = `${order.user}-${item.product}`;
      if (seen.has(key) || Math.random() > 0.55) return;
      seen.add(key);

      const template = sample(REVIEW_TEXT);
      reviews.push({
        product: item.product,
        user: order.user,
        order: order._id,
        rating: template.rating,
        title: template.title,
        comment: template.comment,
        isVerifiedPurchase: true,
        status: 'approved',
        createdAt: daysAgo(randomInt(1, 40)),
      });
    });
  });

  if (reviews.length) await Review.insertMany(reviews);

  // Recompute the denormalised rating fields from the reviews we just wrote.
  const aggregated = await Review.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$product', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Promise.all(
    aggregated.map((entry) =>
      Product.findByIdAndUpdate(entry._id, {
        ratingAverage: Math.round(entry.average * 10) / 10,
        ratingCount: entry.count,
      }),
    ),
  );

  logger.info(`Reviews created: ${reviews.length}.`);
  return reviews;
};

const seedEngagement = async ({ customers }) => {
  await Newsletter.insertMany(
    customers.slice(0, 5).map((customer) => ({ email: customer.email, source: 'homepage' })),
  );

  await ContactMessage.insertMany([
    {
      name: 'Dina Farouk',
      email: 'dina.farouk@example.com',
      phone: '01098765432',
      subject: 'Wedding order — 200 guests',
      message:
        'Hello, I am getting married in November and would love to discuss a dessert table for around 200 guests. Do you handle events of this size?',
      status: 'new',
    },
    {
      name: 'Mohamed Selim',
      email: 'mohamed.selim@example.com',
      subject: 'Allergen question',
      message: 'Are any of your brownies made in a nut-free environment? My son has a severe nut allergy.',
      status: 'new',
    },
    {
      name: 'Aya Mahmoud',
      email: 'aya.mahmoud@example.com',
      subject: 'Thank you',
      message: 'Just wanted to say the Lotus cake for my daughter birthday was perfect. Everyone asked where it was from.',
      status: 'replied',
    },
  ]);

  logger.info('Newsletter subscribers and contact messages created.');
};

const run = async () => {
  const destroyOnly = process.argv.includes('--destroy');

  await connectDatabase();

  if (destroyOnly) {
    await wipe();
    logger.success('Database emptied.');
    await disconnectDatabase();
    return;
  }

  console.log('');
  logger.info('Seeding Sweet Lava...');

  await wipe();
  await seedSettings();

  const { customers } = await seedUsers();
  const { products, categories } = await seedCatalogue();

  const zones = await DeliveryZone.create(zoneSeed);
  logger.info(`Delivery zones created: ${zones.length}.`);

  const coupons = await Coupon.create(couponSeed);
  logger.info(`Coupons created: ${coupons.length}.`);

  const orders = await seedOrders({ customers, products, zones, categories });
  await seedReviews({ orders, customers });
  await seedEngagement({ customers });

  console.log('');
  logger.success('Seed complete.');
  console.log('');
  console.log('  Admin      ', env.seed.adminEmail, '/', env.seed.adminPassword);
  console.log('  Manager     manager@sweetlava.com /', env.seed.adminPassword);
  console.log('  Support     support@sweetlava.com /', env.seed.adminPassword);
  console.log('  Customer    nour.hassan@example.com / Customer@123');
  console.log('');

  await disconnectDatabase();
};

run().catch(async (error) => {
  logger.error(`Seeding failed: ${error.message}`);
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});

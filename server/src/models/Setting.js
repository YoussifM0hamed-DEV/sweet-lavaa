import mongoose from 'mongoose';

/** Single-document store for storefront configuration editable by admins. */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'general', unique: true, index: true },
    store: {
      name: { type: String, default: 'Sweet Lava' },
      tagline: { type: String, default: 'Handcrafted sweets, baked fresh every morning.' },
      description: {
        type: String,
        default: 'Sweet Lava is a premium bakery crafting cakes, cookies and desserts with real butter, Belgian chocolate and a lot of patience.',
      },
      logo: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
      favicon: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
    },
    contact: {
      phone: { type: String, default: '+20 100 000 0000' },
      whatsapp: { type: String, default: '' },
      email: { type: String, default: 'hello@sweetlava.com' },
      address: { type: String, default: 'New Cairo, Cairo, Egypt' },
      workingHours: { type: String, default: 'Daily 10:00 — 23:00' },
      mapUrl: { type: String, default: '' },
    },
    social: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      x: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },
    commerce: {
      currency: { type: String, default: 'EGP' },
      currencySymbol: { type: String, default: 'EGP' },
      minimumOrderAmount: { type: Number, default: 0, min: 0 },
      taxEnabled: { type: Boolean, default: false },
      taxRate: { type: Number, default: 0, min: 0, max: 100 },
      taxIncludedInPrice: { type: Boolean, default: true },
      allowCashOnDelivery: { type: Boolean, default: true },
      allowGuestCheckout: { type: Boolean, default: false },
      lowStockThreshold: { type: Number, default: 5 },
    },
    delivery: {
      info: { type: String, default: 'Same-day delivery across Cairo for orders placed before 4 PM.' },
      preparationNote: { type: String, default: 'Custom cakes need 48 hours notice.' },
    },
    announcement: {
      enabled: { type: Boolean, default: true },
      text: { type: String, default: 'Free delivery on orders over 800 EGP — use code SWEET10 for 10% off.' },
      link: { type: String, default: '/products' },
    },
    seo: {
      metaTitle: { type: String, default: 'Sweet Lava — Premium Handcrafted Sweets & Bakery' },
      metaDescription: {
        type: String,
        default: 'Order premium cakes, cookies, cheesecakes, brownies and gift boxes from Sweet Lava. Baked fresh daily, delivered across Cairo.',
      },
      keywords: { type: String, default: 'bakery, cakes, cookies, cheesecake, desserts, Cairo, delivery' },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

/** Always returns a settings document, creating the defaults on first call. */
settingSchema.statics.getSettings = async function getSettings() {
  let settings = await this.findOne({ key: 'general' });
  if (!settings) settings = await this.create({ key: 'general' });
  return settings;
};

export const Setting = mongoose.model('Setting', settingSchema);
export default Setting;

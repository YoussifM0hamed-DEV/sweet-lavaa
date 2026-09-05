import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { ROLES, ROLE_PERMISSIONS } from '../config/constants.js';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home', maxlength: 40 },
    fullName: { type: String, trim: true, required: true, maxlength: 120 },
    phone: { type: String, trim: true, required: true, maxlength: 25 },
    governorate: { type: String, trim: true, default: '' },
    deliveryZone: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryZone' },
    city: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    street: { type: String, trim: true, required: true },
    building: { type: String, trim: true, default: '' },
    apartment: { type: String, trim: true, default: '' },
    floor: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, maxlength: 400, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required.'], trim: true, maxlength: 60 },
    lastName: { type: String, required: [true, 'Last name is required.'], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email address.'],
    },
    phone: { type: String, trim: true, maxlength: 25, default: '' },
    password: { type: String, minlength: 8, select: false },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    /** Extra permissions on top of the role's defaults. */
    extraPermissions: [{ type: String }],
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, index: true, sparse: true },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    addresses: [addressSchema],
    /** Bumped on password change / forced logout to invalidate issued JWTs. */
    tokenVersion: { type: Number, default: 0 },
    passwordChangedAt: Date,
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: Date,
    /** Denormalised order stats, refreshed when an order is paid/delivered. */
    stats: {
      ordersCount: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_doc, ret) => {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.__v;
      return ret;
    } },
    toObject: { virtuals: true },
  },
);

userSchema.index({ createdAt: -1 });
userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.virtual('permissions').get(function permissions() {
  return [...new Set([...(ROLE_PERMISSIONS[this.role] || []), ...(this.extraPermissions || [])])];
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
    this.tokenVersion += 1;
  }
  return next();
});

/** Guarantees exactly one default address. */
userSchema.pre('save', function normaliseAddresses(next) {
  if (!this.isModified('addresses') || !this.addresses?.length) return next();
  const defaults = this.addresses.filter((address) => address.isDefault);
  if (defaults.length === 0) {
    this.addresses[0].isDefault = true;
  } else if (defaults.length > 1) {
    const keep = defaults[defaults.length - 1];
    this.addresses.forEach((address) => {
      address.isDefault = address === keep;
    });
  }
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.hasPermission = function hasPermission(permission) {
  return this.permissions.includes(permission);
};

export const User = mongoose.model('User', userSchema);
export default User;

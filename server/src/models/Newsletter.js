import mongoose from 'mongoose';
import validator from 'validator';

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email address.'],
    },
    isSubscribed: { type: Boolean, default: true },
    source: { type: String, default: 'homepage' },
    unsubscribedAt: Date,
  },
  { timestamps: true },
);

export const Newsletter = mongoose.model('Newsletter', newsletterSchema);
export default Newsletter;

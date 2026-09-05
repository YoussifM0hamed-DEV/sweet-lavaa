import { Newsletter, ContactMessage } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse.js';

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const existing = await Newsletter.findOne({ email: req.body.email });

  if (existing) {
    if (existing.isSubscribed) {
      return sendSuccess(res, { message: 'You are already on the list. Sweet things are coming!' });
    }
    existing.isSubscribed = true;
    existing.unsubscribedAt = undefined;
    await existing.save();
    return sendSuccess(res, { message: 'Welcome back! You are subscribed again.' });
  }

  await Newsletter.create(req.body);
  return sendSuccess(res, { status: 201, message: 'You are on the list! Check your inbox for sweet deals.' });
});

export const unsubscribeNewsletter = asyncHandler(async (req, res) => {
  const subscriber = await Newsletter.findOne({ email: req.body.email });
  if (!subscriber) throw ApiError.notFound('This email is not subscribed.');

  subscriber.isSubscribed = false;
  subscriber.unsubscribedAt = new Date();
  await subscriber.save();

  return sendSuccess(res, { message: 'You have been unsubscribed.' });
});

export const submitContactMessage = asyncHandler(async (req, res) => {
  await ContactMessage.create(req.body);
  return sendSuccess(res, {
    status: 201,
    message: 'Thank you for reaching out. Our team will reply within one business day.',
  });
});

export const adminListMessages = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const [messages, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ContactMessage.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: { messages }, meta: buildPaginationMeta({ page, limit, total }) });
});

export const updateMessageStatus = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, handledBy: req.user._id },
    { new: true },
  );
  if (!message) throw ApiError.notFound('Message not found.');

  return sendSuccess(res, { message: 'Message updated.', data: { contactMessage: message } });
});

export const adminListSubscribers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Number(req.query.limit) || 50);

  const [subscribers, total] = await Promise.all([
    Newsletter.find({ isSubscribed: true }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Newsletter.countDocuments({ isSubscribed: true }),
  ]);

  return sendSuccess(res, { data: { subscribers }, meta: buildPaginationMeta({ page, limit, total }) });
});

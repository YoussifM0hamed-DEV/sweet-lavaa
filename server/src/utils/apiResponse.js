export const sendSuccess = (res, { data = null, message = undefined, meta = undefined, status = 200 } = {}) =>
  res.status(status).json({
    success: true,
    ...(message ? { message } : {}),
    data,
    ...(meta ? { meta } : {}),
  });

export const sendCreated = (res, payload) => sendSuccess(res, { ...payload, status: 201 });

export const buildPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

export default { sendSuccess, sendCreated, buildPaginationMeta };

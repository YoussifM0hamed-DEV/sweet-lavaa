/** Normalises pagination params coming from the query string. */
export const parsePagination = (query, { defaultLimit = 12, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

/** Escapes a user supplied string before it is used inside a RegExp. */
export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildSort = (sortKey, map, fallback) => map[sortKey] || fallback;

export default { parsePagination, escapeRegex, buildSort };

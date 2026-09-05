import slugify from 'slugify';

export const toSlug = (value) =>
  slugify(String(value || ''), { lower: true, strict: true, trim: true, remove: /[*+~.()'"!:@]/g });

/** Ensures slug uniqueness within a collection by appending an incrementing suffix. */
export const uniqueSlug = async (Model, value, excludeId = null) => {
  const base = toSlug(value) || 'item';
  let candidate = base;
  let counter = 2;
  /* eslint-disable no-await-in-loop */
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Model.findOne(query).select('_id').lean();
    if (!existing) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
};

export default { toSlug, uniqueSlug };

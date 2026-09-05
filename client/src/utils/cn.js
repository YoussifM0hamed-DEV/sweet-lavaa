/** Tiny classname joiner — keeps conditional Tailwind readable. */
export const cn = (...values) => values.filter(Boolean).join(' ');

export default cn;

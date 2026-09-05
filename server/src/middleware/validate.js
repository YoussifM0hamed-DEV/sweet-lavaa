import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';

/**
 * Validates and REPLACES req.body / req.query / req.params with the parsed
 * result, so controllers only ever see sanitised, typed input.
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query ?? {});
    if (schemas.params) req.params = schemas.params.parse(req.params ?? {});
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      return next(ApiError.unprocessable(details[0]?.message || 'Please check the submitted values.', details));
    }
    return next(error);
  }
};

export default validate;

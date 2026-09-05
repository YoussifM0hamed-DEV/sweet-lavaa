/** Operational error carrying an HTTP status code the error handler can trust. */
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Invalid request.', details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'You need to sign in to continue.') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action.') {
    return new ApiError(403, message);
  }

  static notFound(message = 'The requested resource was not found.') {
    return new ApiError(404, message);
  }

  static conflict(message = 'This resource already exists.') {
    return new ApiError(409, message);
  }

  static unprocessable(message = 'The request could not be processed.', details) {
    return new ApiError(422, message, details);
  }

  static tooMany(message = 'Too many requests. Please slow down.') {
    return new ApiError(429, message);
  }

  static internal(message = 'Something went wrong on our side.') {
    return new ApiError(500, message);
  }
}

export default ApiError;

export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export class ValidationError extends ApiError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message) {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message) {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends ApiError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export default {
  ApiError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
};

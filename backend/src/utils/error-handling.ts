export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Correctly capture stack trace in V8 environments (Chrome, Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the name property to the class name
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400); // Bad Request
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class FileSizeError extends AppError {
  constructor(maxSize: number) {
    super(`File size exceeds maximum allowed size of ${maxSize} bytes`, 413); // Payload Too Large
    Object.setPrototypeOf(this, FileSizeError.prototype);
  }
}

export class FileTypeNotSupportedError extends AppError {
  constructor(allowedTypes: string[]) {
    super(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`, 415); // Unsupported Media Type
    Object.setPrototypeOf(this, FileTypeNotSupportedError.prototype);
  }
}

/**
 * Generic error handler for Express middleware
 */
export const errorHandler = (
  err: Error,
  req: any,
  res: any,
  next: any
): void => {
  let error: ApiError = err;

  if (!(error instanceof AppError)) {
    error = new InternalServerError(err.message || 'Internal server error');
  }

  // Send error response
  res.status(error.statusCode).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);

    // Application specific logging, throwing an error, or other logic here
    process.exit(1); // Exit the process to avoid undefined behavior
  });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);

    // Application specific logging, throwing an error, or other logic here
    process.exit(1); // Exit the process to avoid undefined behavior
  });
};

/**
 * Format error response
 */
export const formatErrorResponse = (error: ApiError) => {
  return {
    error: error.message,
    code: error.statusCode,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
};
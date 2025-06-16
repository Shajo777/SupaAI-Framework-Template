export enum AppErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  NOT_FOUND = "NOT_FOUND",
  DATABASE_ERROR = "DATABASE_ERROR",
}

export interface AppErrorDetails {
  message: string;
  code: AppErrorCode;
  context?: Record<string, unknown>;
}

export function throwAppError(details: AppErrorDetails, error: unknown = "") {
  const errorMessage = error instanceof Error ? error.message : String(error);

  throw new AppError(
    `${details.message}: ${error ?? errorMessage}`,
    details.code,
    details.context ? { ...details.context, error } : { error },
  );
}

export function handleAppError(
  error: unknown,
  fallbackDetails: AppErrorDetails,
): never {
  if (error instanceof AppError) {
    throw error;
  }

  if (error instanceof Error) {
    throw throwAppError({
      message: fallbackDetails.message,
      code: fallbackDetails.code,
      context: {
        ...fallbackDetails.context,
        originalMessage: error.message,
        originalStack: error.stack,
      },
    });
  }

  throw throwAppError({
    message: fallbackDetails.message,
    code: fallbackDetails.code,
    context: {
      ...fallbackDetails.context,
      originalError: error,
    },
  });
}

export class AppError extends Error {
  code: AppErrorCode;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    code: AppErrorCode = AppErrorCode.INTERNAL_ERROR,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.context = context;
  }
}

// Helper function to map AppErrorCode to HTTP status code
export function getStatusCodeForError(code: AppErrorCode): number {
  switch (code) {
    case AppErrorCode.UNAUTHORIZED:
      return 401;
    case AppErrorCode.VALIDATION_ERROR:
      return 400;
    case AppErrorCode.NOT_FOUND:
      return 404;
    case AppErrorCode.DATABASE_ERROR:
      return 503;
    case AppErrorCode.INTERNAL_ERROR:
    default:
      return 500;
  }
}

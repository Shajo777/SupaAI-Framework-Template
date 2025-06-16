import { z } from "zod";

/**
 * Generic validation function for request parameters
 * @param body The request body to validate
 * @param schema The Zod argsSchema to validate against
 * @returns An object with success status and either validated data or error details
 */
export function validateRequestParams<T extends z.ZodType>(
  body: unknown,
  schema: T,
): ValidationResult<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      error: result.error.format(),
    } as ValidationResult<T>;
  }
  return {
    success: true,
    data: result.data,
  } as ValidationResult<T>;
}

/**
 * Type for successful validation result
 */
export type ValidationSuccess<T> = {
  success: true;
  data: T;
};

/**
 * Type for failed validation result
 */
export type ValidationError<T = unknown> = {
  success: false;
  error: z.ZodFormattedError<T>;
};

/**
 * Union type for validation result
 * T can be either a type or a Zod argsSchema
 */
export type ValidationResult<T> = T extends z.ZodType
  ? ValidationSuccess<z.infer<T>> | ValidationError
  : ValidationSuccess<T> | ValidationError;

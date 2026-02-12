import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: Record<string, string[]>;
  timestamp?: string;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Common API errors
export const ApiErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
} as const;

/**
 * Convert Zod validation errors to a flat object
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  // Defensive check: ensure error and error.errors exist
  if (!error || !Array.isArray(error.errors)) {
    return formatted;
  }
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });
  
  return formatted;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };
  
  if (details) {
    response.details = details;
  }
  
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle API errors and return standardized response
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error);
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return createErrorResponse(
      400,
      ApiErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      formatZodErrors(error)
    );
  }
  
  // Handle custom API errors
  if (error instanceof ApiError) {
    return createErrorResponse(
      error.statusCode,
      error.code,
      error.message,
      error.details
    );
  }
  
  // Handle MongoDB duplicate key errors
  if (error instanceof Error && 'code' in error && error.code === 11000) {
    const field = Object.keys((error as any).keyPattern)[0];
    return createErrorResponse(
      409,
      ApiErrorCodes.DUPLICATE_ENTRY,
      `A record with this ${field} already exists`,
      { [field]: [`${field} must be unique`] }
    );
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return createErrorResponse(
      500,
      ApiErrorCodes.INTERNAL_SERVER_ERROR,
      error.message || 'An unexpected error occurred'
    );
  }
  
  // Fallback for unknown errors
  return createErrorResponse(
    500,
    ApiErrorCodes.INTERNAL_SERVER_ERROR,
    'An unexpected error occurred'
  );
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
) {
  return NextResponse.json(data, { status: statusCode });
}

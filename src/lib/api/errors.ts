import { AxiosError } from 'axios';

/** Normalised error thrown by every service call. */
export class ApiError extends Error {
  status: number;
  code?: string;
  /** Field-level validation errors: { phone: 'Invalid phone number' } */
  fieldErrors?: Record<string, string>;

  constructor(message: string, status = 0, code?: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof AxiosError) {
      const status = error.response?.status ?? 0;
      const body = error.response?.data as
        | { message?: string; error?: string; code?: string; errors?: Record<string, string | string[]> }
        | undefined;

      const fieldErrors = body?.errors
        ? Object.fromEntries(Object.entries(body.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
        : undefined;

      let message = body?.message || body?.error;
      if (!message) {
        if (error.code === 'ECONNABORTED') message = 'The request timed out. Please check your connection.';
        else if (!error.response) message = 'Network error. Please check your internet connection.';
        else if (status >= 500) message = 'Something went wrong on our side. Please try again.';
        else message = 'Request failed.';
      }
      return new ApiError(message, status, body?.code, fieldErrors);
    }
    return new ApiError(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export function getErrorMessage(error: unknown): string {
  return ApiError.from(error).message;
}

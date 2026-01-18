import * as crypto from 'crypto';
import type {
  IExecuteFunctions,
  IWebhookFunctions,
  IHookFunctions,
  IHttpRequestMethods,
  IDataObject,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import {
  API_BASE_URL,
  DEFAULT_PAGE_SIZE,
  MAX_RETRIES,
  RETRY_DELAY_MS,
  RATE_LIMIT_DELAY_MS,
} from './constants';
import type { LemonSqueezyResponse } from './types';

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate ISO 8601 date format
 */
export function isValidIsoDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('-');
}

/**
 * Validate that a value is a positive integer
 */
export function isPositiveInteger(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Validate field with specific type and throw descriptive error
 */
export function validateField(
  fieldName: string,
  value: unknown,
  validationType: 'email' | 'url' | 'date' | 'positiveInteger' | 'required',
): void {
  if (validationType === 'required') {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${fieldName} is required`);
    }
    return;
  }

  // Skip validation if value is empty (use 'required' for mandatory fields)
  if (value === undefined || value === null || value === '') {
    return;
  }

  switch (validationType) {
    case 'email':
      if (typeof value !== 'string' || !isValidEmail(value)) {
        throw new Error(`${fieldName} must be a valid email address`);
      }
      break;
    case 'url':
      if (typeof value !== 'string' || !isValidUrl(value)) {
        throw new Error(`${fieldName} must be a valid URL`);
      }
      break;
    case 'date':
      if (typeof value !== 'string' || !isValidIsoDate(value)) {
        throw new Error(`${fieldName} must be a valid ISO 8601 date`);
      }
      break;
    case 'positiveInteger':
      if (!isPositiveInteger(value)) {
        throw new Error(`${fieldName} must be a positive integer`);
      }
      break;
  }
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T = unknown>(jsonString: string, fieldName: string): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    throw new Error(`${fieldName} contains invalid JSON`);
  }
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as { statusCode?: number; response?: { statusCode?: number } };
    return err.statusCode === 429 || err.response?.statusCode === 429;
  }
  return false;
}

/**
 * Check if error is retryable (5xx errors or network errors)
 */
function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as { statusCode?: number; response?: { statusCode?: number }; code?: string };
    const statusCode = err.statusCode || err.response?.statusCode;
    if (statusCode && statusCode >= 500 && statusCode < 600) {
      return true;
    }
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      return true;
    }
  }
  return false;
}

/**
 * Make an authenticated request to the Lemon Squeezy API with retry logic
 */
export async function lemonSqueezyApiRequest(
  this: IExecuteFunctions | IWebhookFunctions | IHookFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  qs: Record<string, string | number> = {},
): Promise<IDataObject> {
  const options: {
    method: IHttpRequestMethods;
    url: string;
    qs: Record<string, string | number>;
    body?: IDataObject;
    json: boolean;
  } = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    qs,
    json: true,
  };

  if (body) {
    options.body = body;
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return (await this.helpers.requestWithAuthentication.call(
        this,
        'lemonSqueezyApi',
        options,
      )) as IDataObject;
    } catch (error) {
      lastError = error;

      if (isRateLimitError(error)) {
        // Wait for rate limit to reset (usually 60 seconds)
        await sleep(RATE_LIMIT_DELAY_MS);
        continue;
      }

      if (isRetryableError(error) && attempt < MAX_RETRIES - 1) {
        // Exponential backoff for retryable errors
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
        continue;
      }

      // Non-retryable error, throw immediately
      throw new NodeApiError(this.getNode(), error as JsonObject, {
        message: getErrorMessage(error),
      });
    }
  }

  // All retries exhausted
  throw new NodeApiError(this.getNode(), lastError as JsonObject, {
    message: getErrorMessage(lastError),
  });
}

/**
 * Make paginated requests to fetch all items
 */
export async function lemonSqueezyApiRequestAllItems(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  qs: Record<string, string | number> = {},
): Promise<IDataObject[]> {
  const returnData: IDataObject[] = [];
  let nextPageUrl: string | null = `${API_BASE_URL}${endpoint}`;

  qs['page[size]'] = DEFAULT_PAGE_SIZE;

  do {
    const options: {
      method: IHttpRequestMethods;
      url: string;
      qs: Record<string, string | number>;
      json: boolean;
    } = {
      method,
      url: nextPageUrl,
      qs: nextPageUrl.includes('?') ? {} : qs,
      json: true,
    };

    let responseData: LemonSqueezyResponse;

    try {
      responseData = (await this.helpers.requestWithAuthentication.call(
        this,
        'lemonSqueezyApi',
        options,
      )) as LemonSqueezyResponse;
    } catch (error) {
      if (isRateLimitError(error)) {
        await sleep(RATE_LIMIT_DELAY_MS);
        continue;
      }
      throw new NodeApiError(this.getNode(), error as JsonObject, {
        message: getErrorMessage(error),
      });
    }

    returnData.push(...(responseData.data as IDataObject[]));
    nextPageUrl = responseData.links?.next || null;
  } while (nextPageUrl);

  return returnData;
}

/**
 * Lemon Squeezy API error codes and their meanings
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad Request: The request was invalid or malformed',
  401: 'Unauthorized: Invalid or missing API key',
  403: 'Forbidden: You do not have permission to access this resource',
  404: 'Not Found: The requested resource does not exist',
  409: 'Conflict: The resource already exists or there is a conflict',
  422: 'Unprocessable Entity: The request data is invalid',
  429: 'Rate Limited: Too many requests. Please wait before retrying',
  500: 'Internal Server Error: Something went wrong on the server',
  502: 'Bad Gateway: The server is temporarily unavailable',
  503: 'Service Unavailable: The API is temporarily unavailable',
};

/**
 * Extract detailed error message from error object
 */
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as {
      message?: string;
      statusCode?: number;
      response?: {
        statusCode?: number;
        body?: {
          errors?: Array<{
            detail?: string;
            title?: string;
            status?: string;
            source?: { pointer?: string };
          }>;
          message?: string;
        };
      };
    };

    const statusCode = err.statusCode || err.response?.statusCode;

    // Check for JSON:API error format
    if (err.response?.body?.errors && err.response.body.errors.length > 0) {
      const apiErrors = err.response.body.errors;
      const errorMessages = apiErrors.map((e) => {
        let msg = e.detail || e.title || 'Unknown error';
        if (e.source?.pointer) {
          msg += ` (field: ${e.source.pointer.replace('/data/attributes/', '')})`;
        }
        return msg;
      });
      return errorMessages.join('; ');
    }

    if (err.response?.body?.message) {
      return err.response.body.message;
    }

    // Use status code mapping
    if (statusCode && ERROR_MESSAGES[statusCode]) {
      return ERROR_MESSAGES[statusCode];
    }

    if (err.message) {
      return err.message;
    }
  }

  return 'An unknown error occurred';
}

/**
 * Validate required fields before making API request
 */
export function validateRequiredFields(
  fields: Record<string, unknown>,
  requiredFields: string[],
): void {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (fields[field] === undefined || fields[field] === null || fields[field] === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Build filter query string parameters
 */
export function buildFilterParams(filters: IDataObject): Record<string, string | number> {
  const qs: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      // Convert camelCase to snake_case for API
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      qs[`filter[${snakeKey}]`] = value as string | number;
    }
  }

  return qs;
}

/**
 * Build JSON:API request body
 */
export function buildJsonApiBody(
  type: string,
  attributes: IDataObject,
  relationships?: Record<string, { type: string; id: string }>,
  id?: string,
): IDataObject {
  const body: IDataObject = {
    data: {
      type,
      attributes,
    },
  };

  if (id) {
    (body.data as IDataObject).id = id;
  }

  if (relationships) {
    const relationshipsObj: IDataObject = {};
    for (const [key, value] of Object.entries(relationships)) {
      relationshipsObj[key] = {
        data: {
          type: value.type,
          id: value.id,
        },
      };
    }
    (body.data as IDataObject).relationships = relationshipsObj;
  }

  return body;
}

/**
 * Parse webhook signature for validation
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

// ============================================================================
// Advanced Query Helpers
// ============================================================================

/**
 * Build query params with relationship expansion (include)
 */
export function buildIncludeParams(includes: string[]): Record<string, string> {
  if (includes.length === 0) {
    return {};
  }
  return { include: includes.join(',') };
}

/**
 * Build advanced filter params with date range support
 */
export function buildAdvancedFilterParams(
  filters: IDataObject,
  options?: {
    dateFields?: string[];
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  },
): Record<string, string | number> {
  const qs: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Convert camelCase to snake_case for API
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

    // Handle date range filters
    if (options?.dateFields?.includes(key)) {
      if (typeof value === 'object' && value !== null) {
        const dateRange = value as { from?: string; to?: string };
        if (dateRange.from) {
          qs[`filter[${snakeKey}_after]`] = dateRange.from;
        }
        if (dateRange.to) {
          qs[`filter[${snakeKey}_before]`] = dateRange.to;
        }
      } else {
        qs[`filter[${snakeKey}]`] = value as string | number;
      }
    } else {
      qs[`filter[${snakeKey}]`] = value as string | number;
    }
  }

  // Add sorting
  if (options?.sortField) {
    const sortPrefix = options.sortDirection === 'desc' ? '-' : '';
    const snakeSortField = options.sortField.replace(/([A-Z])/g, '_$1').toLowerCase();
    qs.sort = `${sortPrefix}${snakeSortField}`;
  }

  return qs;
}

/**
 * Extract data from JSON:API response with proper typing
 */
export function extractResponseData<T = IDataObject>(response: IDataObject): T | T[] | undefined {
  if (!response || typeof response !== 'object') {
    return undefined;
  }
  return response.data as T | T[] | undefined;
}

/**
 * Extract included resources from JSON:API response
 */
export function extractIncludedResources(response: IDataObject): IDataObject[] {
  if (!response || typeof response !== 'object') {
    return [];
  }
  return (response.included as IDataObject[]) || [];
}

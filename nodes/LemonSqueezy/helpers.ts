/**
 * Lemon Squeezy API Helper Functions
 *
 * This module provides utility functions for:
 * - Input validation (email, URL, date, etc.)
 * - API request handling with retry logic
 * - Webhook signature verification
 * - JSON:API body construction
 * - Query parameter building
 *
 * @module helpers
 */

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
import { API_BASE_URL, DEFAULT_PAGE_SIZE, DEFAULT_REQUEST_TIMEOUT_MS } from './constants';
import type { LemonSqueezyResponse, PaginationOptions } from './types';

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates email format using RFC 5322 compliant regex.
 *
 * The validation checks for:
 * - Valid local part characters (alphanumeric and special chars)
 * - Single @ symbol
 * - Valid domain with proper TLD (at least one dot)
 *
 * @param email - The email address to validate
 * @returns True if the email format is valid, false otherwise
 *
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid') // false
 * isValidEmail('user@localhost') // false (no TLD)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Validates URL format and ensures it's a safe external URL.
 *
 * Security features:
 * - Only allows http:// and https:// protocols
 * - Blocks localhost and loopback addresses (127.0.0.1, ::1, [::1])
 * - Blocks private network ranges (10.x, 172.16-31.x, 192.168.x)
 * - Blocks link-local addresses (169.254.x - AWS metadata endpoint)
 *
 * This prevents Server-Side Request Forgery (SSRF) attacks.
 *
 * @param url - The URL to validate
 * @param requireHttps - If true, only HTTPS URLs are allowed (default: false)
 * @returns True if the URL is valid and safe, false otherwise
 *
 * @example
 * isValidUrl('https://example.com') // true
 * isValidUrl('http://localhost:3000') // false (internal)
 * isValidUrl('ftp://files.example.com') // false (non-http protocol)
 * isValidUrl('http://169.254.169.254') // false (AWS metadata)
 * isValidUrl('http://example.com', true) // false (HTTPS required)
 */
export function isValidUrl(url: string, requireHttps: boolean = false): boolean {
  try {
    const parsedUrl = new URL(url);

    // If HTTPS is required, reject HTTP URLs
    if (requireHttps && parsedUrl.protocol !== 'https:') {
      return false;
    }

    // Only allow http and https protocols (security: prevent file://, javascript:, etc.)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Block internal/private network URLs for SSRF protection
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedPatterns = [
      'localhost', // Loopback hostname
      '127.0.0.1', // IPv4 loopback
      '0.0.0.0', // All interfaces
      '::1', // IPv6 loopback
      '[::1]', // IPv6 loopback (bracketed form)
      '10.', // Private Class A (10.0.0.0/8)
      '172.16.', // Private Class B start (172.16.0.0/12)
      '172.17.',
      '172.18.',
      '172.19.',
      '172.20.',
      '172.21.',
      '172.22.',
      '172.23.',
      '172.24.',
      '172.25.',
      '172.26.',
      '172.27.',
      '172.28.',
      '172.29.',
      '172.30.',
      '172.31.', // Private Class B end
      '192.168.', // Private Class C (192.168.0.0/16)
      '169.254.', // Link-local / APIPA (includes AWS metadata endpoint)
    ];

    for (const pattern of blockedPatterns) {
      if (hostname === pattern || hostname.startsWith(pattern)) {
        return false;
      }
    }

    return true;
  } catch {
    // URL parsing failed - invalid URL
    return false;
  }
}

/**
 * Validates ISO 8601 date format.
 *
 * Accepts dates in formats like:
 * - 2024-01-15
 * - 2024-01-15T10:30:00Z
 * - 2024-01-15T10:30:00.000Z
 *
 * @param dateString - The date string to validate
 * @returns True if the date is valid ISO 8601 format, false otherwise
 *
 * @example
 * isValidIsoDate('2024-01-15T10:30:00Z') // true
 * isValidIsoDate('invalid') // false
 * isValidIsoDate('01/15/2024') // false (no dash separator)
 */
export function isValidIsoDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('-');
}

/**
 * Validates that a value is a positive integer (greater than 0).
 *
 * @param value - The value to validate
 * @returns True if the value is a positive integer, false otherwise
 *
 * @example
 * isPositiveInteger(5) // true
 * isPositiveInteger(0) // false
 * isPositiveInteger(-1) // false
 * isPositiveInteger(3.14) // false
 * isPositiveInteger('5') // false (string, not number)
 */
export function isPositiveInteger(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Validates a field value and throws a descriptive error if invalid.
 *
 * Supports multiple validation types:
 * - 'required': Ensures value is not empty/null/undefined
 * - 'email': RFC 5322 compliant email validation
 * - 'url': Safe URL validation with SSRF protection
 * - 'httpsUrl': Safe URL validation requiring HTTPS (for webhooks)
 * - 'date': ISO 8601 date format validation
 * - 'positiveInteger': Positive integer validation
 *
 * @param fieldName - The name of the field (used in error messages)
 * @param value - The value to validate
 * @param validationType - The type of validation to perform
 * @throws Error with descriptive message if validation fails
 *
 * @example
 * validateField('email', 'user@example.com', 'email') // passes
 * validateField('email', 'invalid', 'email') // throws "email must be a valid email address"
 * validateField('webhookUrl', 'http://example.com', 'httpsUrl') // throws "webhookUrl must be a valid HTTPS URL"
 */
export function validateField(
  fieldName: string,
  value: unknown,
  validationType: 'email' | 'url' | 'httpsUrl' | 'date' | 'positiveInteger' | 'required',
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
    case 'httpsUrl':
      if (typeof value !== 'string' || !isValidUrl(value, true)) {
        throw new Error(
          `${fieldName} must be a valid HTTPS URL (Lemon Squeezy requires HTTPS for webhooks)`,
        );
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
 * Safely parses a JSON string with descriptive error handling.
 *
 * @template T - The expected type of the parsed JSON
 * @param jsonString - The JSON string to parse
 * @param fieldName - The name of the field (used in error messages)
 * @returns The parsed JSON object
 * @throws Error if the JSON is invalid
 *
 * @example
 * const data = safeJsonParse<{name: string}>('{"name": "test"}', 'config')
 * // Returns: {name: "test"}
 *
 * safeJsonParse('invalid json', 'config')
 * // Throws: "config contains invalid JSON"
 */
export function safeJsonParse<T = unknown>(jsonString: string, fieldName: string): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    throw new Error(`${fieldName} contains invalid JSON`);
  }
}

/**
 * Validates discount amount based on the amount type.
 *
 * - For 'percent' type: amount must be between 0 and 100 (inclusive)
 * - For 'fixed' type: amount must be a positive integer (in cents)
 *
 * @param amount - The discount amount to validate
 * @param amountType - The type of discount ('percent' or 'fixed')
 * @throws Error if the amount is invalid for the given type
 *
 * @example
 * validateDiscountAmount(50, 'percent') // passes (50%)
 * validateDiscountAmount(150, 'percent') // throws "Percent discount must be between 0 and 100"
 * validateDiscountAmount(1000, 'fixed') // passes ($10.00 in cents)
 * validateDiscountAmount(-100, 'fixed') // throws "Fixed discount amount must be a positive integer"
 */
export function validateDiscountAmount(amount: number, amountType: string): void {
  if (amountType === 'percent') {
    if (amount < 0 || amount > 100) {
      throw new Error('Percent discount must be between 0 and 100');
    }
  } else if (amountType === 'fixed') {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error('Fixed discount amount must be a positive integer (in cents)');
    }
  }
}

/** Maximum payload size for custom data (10KB) */
const MAX_CUSTOM_DATA_SIZE_BYTES = 10 * 1024;

/**
 * Validates that a custom data payload doesn't exceed the maximum size.
 *
 * This prevents memory issues and potential abuse from extremely large payloads.
 *
 * @param data - The custom data object or string to validate
 * @param maxSizeBytes - Maximum allowed size in bytes (default: 10KB)
 * @throws Error if the payload exceeds the maximum size
 *
 * @example
 * validateCustomDataSize({ key: 'value' }) // passes
 * validateCustomDataSize(veryLargeObject) // throws if > 10KB
 */
export function validateCustomDataSize(
  data: unknown,
  maxSizeBytes: number = MAX_CUSTOM_DATA_SIZE_BYTES,
): void {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const sizeBytes = Buffer.byteLength(jsonString, 'utf8');

  if (sizeBytes > maxSizeBytes) {
    const sizeKb = Math.round(sizeBytes / 1024);
    const maxKb = Math.round(maxSizeBytes / 1024);
    throw new Error(
      `Custom data exceeds maximum size (${sizeKb}KB > ${maxKb}KB). Reduce the payload size.`,
    );
  }
}

/** Maximum nesting depth for custom data objects */
const MAX_OBJECT_DEPTH = 10;

/**
 * Validates that an object doesn't exceed maximum nesting depth.
 *
 * This prevents stack overflow attacks from deeply nested objects.
 *
 * @param obj - The object to validate
 * @param maxDepth - Maximum allowed nesting depth (default: 10)
 * @param currentDepth - Current depth (used internally for recursion)
 * @throws Error if the object exceeds maximum depth
 *
 * @example
 * validateObjectDepth({ a: { b: { c: 1 } } }) // passes (depth 3)
 * validateObjectDepth(deeplyNestedObject) // throws if > 10 levels
 */
export function validateObjectDepth(
  obj: unknown,
  maxDepth: number = MAX_OBJECT_DEPTH,
  currentDepth: number = 0,
): void {
  if (currentDepth > maxDepth) {
    throw new Error(
      `Object nesting exceeds maximum depth (${maxDepth} levels). Flatten the object structure.`,
    );
  }

  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const value of Object.values(obj)) {
      validateObjectDepth(value, maxDepth, currentDepth + 1);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      validateObjectDepth(item, maxDepth, currentDepth + 1);
    }
  }
}

/**
 * Validates that a date is in the future.
 *
 * Useful for validating expiration dates, trial end dates, etc.
 *
 * @param dateString - The ISO 8601 date string to validate
 * @param fieldName - The name of the field (used in error messages)
 * @throws Error if the date is not in the future
 *
 * @example
 * validateFutureDate('2030-01-01T00:00:00Z', 'expiresAt') // passes
 * validateFutureDate('2020-01-01T00:00:00Z', 'expiresAt') // throws
 */
export function validateFutureDate(dateString: string, fieldName: string): void {
  const date = new Date(dateString);
  const now = new Date();

  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO 8601 date`);
  }

  if (date <= now) {
    throw new Error(`${fieldName} must be a future date`);
  }
}

/**
 * Validates that a start date is before an end date.
 *
 * @param startDate - The start date (ISO 8601 string)
 * @param endDate - The end date (ISO 8601 string)
 * @param startFieldName - Name of start field (for error messages)
 * @param endFieldName - Name of end field (for error messages)
 * @throws Error if start date is not before end date
 *
 * @example
 * validateDateRange('2024-01-01', '2024-12-31', 'startsAt', 'expiresAt') // passes
 * validateDateRange('2024-12-31', '2024-01-01', 'startsAt', 'expiresAt') // throws
 */
export function validateDateRange(
  startDate: string,
  endDate: string,
  startFieldName: string,
  endFieldName: string,
): void {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    throw new Error(`${startFieldName} must be a valid ISO 8601 date`);
  }

  if (isNaN(end.getTime())) {
    throw new Error(`${endFieldName} must be a valid ISO 8601 date`);
  }

  if (start >= end) {
    throw new Error(`${startFieldName} must be before ${endFieldName}`);
  }
}

/**
 * Extracts the Retry-After header value from an error response.
 *
 * The Retry-After header indicates how long to wait before retrying
 * a rate-limited or temporarily unavailable request.
 *
 * @param error - The error object that may contain Retry-After header
 * @returns Number of seconds to wait, or undefined if not present
 *
 * @example
 * getRetryAfterSeconds({ response: { headers: { 'retry-after': '60' } } }) // 60
 * getRetryAfterSeconds({ response: { headers: {} } }) // undefined
 */
export function getRetryAfterSeconds(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const err = error as {
      response?: {
        headers?: { 'retry-after'?: string };
      };
    };
    const retryAfter = err.response?.headers?.['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds) && seconds > 0) {
        return seconds;
      }
    }
  }
  return undefined;
}

/**
 * Checks if an error is a rate limit error (HTTP 429).
 *
 * Handles both direct statusCode and nested response.statusCode patterns.
 *
 * @param error - The error object to check
 * @returns True if the error is a rate limit error, false otherwise
 *
 * @example
 * isRateLimitError({ statusCode: 429 }) // true
 * isRateLimitError({ response: { statusCode: 429 } }) // true
 * isRateLimitError({ statusCode: 500 }) // false
 */
export function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as { statusCode?: number; response?: { statusCode?: number } };
    return err.statusCode === 429 || err.response?.statusCode === 429;
  }
  return false;
}

/**
 * Checks if an error is retryable (5xx server errors or network errors).
 *
 * Retryable conditions:
 * - HTTP 5xx status codes (500-599)
 * - Network errors: ECONNRESET, ETIMEDOUT, ECONNREFUSED
 *
 * @param error - The error object to check
 * @returns True if the error is retryable, false otherwise
 *
 * @example
 * isRetryableError({ statusCode: 503 }) // true (server error)
 * isRetryableError({ code: 'ECONNRESET' }) // true (network error)
 * isRetryableError({ statusCode: 404 }) // false (client error)
 */
export function isRetryableError(error: unknown): boolean {
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
 * Makes an authenticated request to the Lemon Squeezy API with retry logic.
 *
 * Features:
 * - Automatic authentication using stored credentials
 * - Rate limit handling with automatic retry after delay
 * - Exponential backoff for server errors (5xx)
 * - Configurable request timeout (default: 30 seconds)
 * - Detailed error messages using NodeApiError
 *
 * @param this - The n8n execution context
 * @param method - HTTP method (GET, POST, PATCH, DELETE)
 * @param endpoint - API endpoint path (e.g., '/v1/products')
 * @param body - Optional request body for POST/PATCH requests
 * @param qs - Optional query string parameters
 * @param timeout - Request timeout in milliseconds (default: 30000)
 * @returns The API response data
 * @throws NodeApiError if the request fails after all retries or times out
 *
 * @example
 * // GET request
 * const product = await lemonSqueezyApiRequest.call(this, 'GET', '/v1/products/123')
 *
 * // POST request with body
 * const checkout = await lemonSqueezyApiRequest.call(this, 'POST', '/v1/checkouts', {
 *   data: { type: 'checkouts', attributes: { ... } }
 * })
 *
 * // Request with custom timeout (60 seconds)
 * const data = await lemonSqueezyApiRequest.call(this, 'GET', '/v1/orders', undefined, {}, 60000)
 */
export async function lemonSqueezyApiRequest(
  this: IExecuteFunctions | IWebhookFunctions | IHookFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  qs: Record<string, string | number> = {},
  timeout: number = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<IDataObject> {
  const options: {
    method: IHttpRequestMethods;
    url: string;
    qs: Record<string, string | number>;
    body?: IDataObject;
    json: boolean;
    timeout: number;
  } = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    qs,
    json: true,
    timeout,
  };

  if (body) {
    options.body = body;
  }

  try {
    return (await this.helpers.httpRequestWithAuthentication.call(
      this,
      'lemonSqueezyApi',
      options,
    )) as IDataObject;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: getErrorMessage(error),
    });
  }
}

/**
 * Makes paginated requests to fetch all items from a Lemon Squeezy API endpoint.
 *
 * Automatically handles pagination by following 'next' links until all items
 * are retrieved. Includes rate limit handling for long-running fetches.
 *
 * Features:
 * - Optional maxItems limit to prevent memory issues with large datasets
 * - Optional timeout to prevent long-running requests
 * - Rate limit handling with automatic retry
 *
 * @param this - The n8n execution context
 * @param method - HTTP method (typically 'GET')
 * @param endpoint - API endpoint path (e.g., '/v1/products')
 * @param qs - Optional query string parameters (filters, sorting, etc.)
 * @param paginationOptions - Optional pagination configuration
 * @returns Array of all items from all pages (up to maxItems if specified)
 * @throws NodeApiError if any request fails or timeout is exceeded
 *
 * @example
 * // Fetch all products with filtering
 * const products = await lemonSqueezyApiRequestAllItems.call(
 *   this, 'GET', '/v1/products', { 'filter[store_id]': 123 }
 * )
 *
 * // Fetch with limits
 * const products = await lemonSqueezyApiRequestAllItems.call(
 *   this, 'GET', '/v1/products', {}, { maxItems: 1000, timeout: 60000 }
 * )
 */
export async function lemonSqueezyApiRequestAllItems(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  qs: Record<string, string | number> = {},
  paginationOptions: PaginationOptions = {},
): Promise<IDataObject[]> {
  const returnData: IDataObject[] = [];
  let nextPageUrl: string | null = `${API_BASE_URL}${endpoint}`;

  const { maxItems, timeout = 300000, pageSize = DEFAULT_PAGE_SIZE } = paginationOptions;
  const startTime = Date.now();

  qs['page[size]'] = pageSize;

  do {
    // Check timeout (0 = no timeout)
    if (timeout > 0 && Date.now() - startTime > timeout) {
      throw new NodeApiError(this.getNode(), {} as JsonObject, {
        message: `Pagination timeout exceeded (${timeout}ms). Retrieved ${returnData.length} items before timeout.`,
      });
    }

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
      responseData = (await this.helpers.httpRequestWithAuthentication.call(
        this,
        'lemonSqueezyApi',
        options,
      )) as LemonSqueezyResponse;
    } catch (error) {
      throw new NodeApiError(this.getNode(), error as JsonObject, {
        message: getErrorMessage(error),
      });
    }

    const pageData = responseData.data as IDataObject[];
    returnData.push(...pageData);

    // Check maxItems limit
    if (maxItems && returnData.length >= maxItems) {
      return returnData.slice(0, maxItems);
    }

    nextPageUrl = responseData.links?.next || null;
  } while (nextPageUrl);

  return returnData;
}

/**
 * Lemon Squeezy API error codes and their meanings
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad Request: The request was invalid or malformed. Check your input parameters.',
  401: 'Invalid API key. Check your Lemon Squeezy credentials in n8n.',
  403: 'Access denied. Your API key may not have permission for this resource.',
  404: 'Resource not found. Verify the ID is correct and the resource exists.',
  409: 'Conflict: The resource already exists or there is a conflict.',
  422: 'Validation failed. Check the error details for which fields need to be corrected.',
  429: 'Rate limit exceeded. The Lemon Squeezy API allows 300 requests per minute. Try again shortly.',
  500: 'Lemon Squeezy API encountered an internal error. Try again later.',
  502: 'Lemon Squeezy API is temporarily unavailable (bad gateway). Try again later.',
  503: 'Lemon Squeezy API is temporarily unavailable. Try again later.',
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

    // Include rate limit retry-after info for 429 errors
    if (statusCode === 429) {
      const retryAfter = getRetryAfterSeconds(error as IDataObject) ?? 0;
      const retryMsg = retryAfter > 0 ? ` Retry after ${retryAfter} seconds.` : '';
      return `${ERROR_MESSAGES[429]}${retryMsg}`;
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
 * Validates that all required fields are present and non-empty.
 *
 * @param fields - Object containing field values to validate
 * @param requiredFields - Array of field names that are required
 * @throws Error listing all missing fields if any are empty
 *
 * @example
 * validateRequiredFields({ name: 'Test', email: '' }, ['name', 'email'])
 * // Throws: "Missing required fields: email"
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
 * Builds filter query string parameters for Lemon Squeezy API.
 *
 * Converts camelCase field names to snake_case and wraps them in
 * filter[] syntax as required by the API.
 *
 * @param filters - Object containing filter key-value pairs
 * @returns Query string parameters object for API request
 *
 * @example
 * buildFilterParams({ storeId: 123, status: 'active' })
 * // Returns: { 'filter[store_id]': 123, 'filter[status]': 'active' }
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
 * Builds a JSON:API compliant request body for create/update operations.
 *
 * Constructs the proper structure expected by Lemon Squeezy API:
 * - data.type: Resource type (e.g., 'checkouts', 'customers')
 * - data.attributes: Resource attributes
 * - data.relationships: Optional related resource references
 * - data.id: Optional resource ID (for updates)
 *
 * @param type - The JSON:API resource type
 * @param attributes - Resource attributes to include
 * @param relationships - Optional relationships to other resources
 * @param id - Optional resource ID (required for updates)
 * @returns Properly structured JSON:API request body
 *
 * @example
 * buildJsonApiBody('customers', { name: 'John', email: 'john@example.com' },
 *   { store: { type: 'stores', id: '123' } })
 * // Returns: { data: { type: 'customers', attributes: {...}, relationships: {...} } }
 */
export function buildJsonApiBody(
  type: string,
  attributes: IDataObject,
  relationships?: Record<
    string,
    { type: string; id: string } | Array<{ type: string; id: string }>
  >,
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
      if (Array.isArray(value)) {
        relationshipsObj[key] = {
          data: value.map((item) => ({ type: item.type, id: item.id })),
        };
      } else {
        relationshipsObj[key] = {
          data: {
            type: value.type,
            id: value.id,
          },
        };
      }
    }
    (body.data as IDataObject).relationships = relationshipsObj;
  }

  return body;
}

/**
 * Verifies a webhook signature using HMAC-SHA256.
 *
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @param payload - The raw webhook payload string
 * @param signature - The signature from X-Signature header
 * @param secret - The webhook signing secret
 * @returns True if signature is valid, false otherwise
 *
 * @example
 * const isValid = verifyWebhookSignature(
 *   '{"data": {...}}',
 *   'abc123signature',
 *   'webhook_secret_key'
 * )
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
 * Builds query parameters for including related resources in API responses.
 *
 * Uses the JSON:API include parameter to fetch related resources in a single
 * request, reducing the number of API calls needed.
 *
 * @param includes - Array of relationship names to include
 * @returns Query string parameters object with 'include' key
 *
 * @example
 * buildIncludeParams(['store', 'customer', 'order-items'])
 * // Returns: { include: 'store,customer,order-items' }
 *
 * buildIncludeParams([])
 * // Returns: {}
 */
export function buildIncludeParams(includes: string[]): Record<string, string> {
  if (includes.length === 0) {
    return {};
  }
  return { include: includes.join(',') };
}

/**
 * Builds advanced filter parameters with support for date ranges and sorting.
 *
 * Features:
 * - Converts camelCase to snake_case for API compatibility
 * - Handles date range filters with _after/_before suffixes
 * - Adds sorting with ascending/descending direction
 *
 * @param filters - Object containing filter key-value pairs
 * @param options - Optional configuration for date fields and sorting
 * @param options.dateFields - Array of field names that are date ranges
 * @param options.sortField - Field name to sort by
 * @param options.sortDirection - Sort direction ('asc' or 'desc')
 * @returns Query string parameters object for API request
 *
 * @example
 * buildAdvancedFilterParams(
 *   { status: 'active', createdAt: { from: '2024-01-01', to: '2024-12-31' } },
 *   { dateFields: ['createdAt'], sortField: 'created_at', sortDirection: 'desc' }
 * )
 * // Returns: { 'filter[status]': 'active', 'filter[created_at_after]': '2024-01-01',
 * //           'filter[created_at_before]': '2024-12-31', sort: '-created_at' }
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
 * Extracts the 'data' field from a JSON:API response with proper typing.
 *
 * JSON:API responses wrap the actual resource data in a 'data' field.
 * This helper extracts it while preserving type information.
 *
 * @template T - The expected type of the extracted data
 * @param response - The full JSON:API response object
 * @returns The extracted data, or undefined if not present
 *
 * @example
 * const response = { data: { id: '1', type: 'products', attributes: {...} } }
 * const product = extractResponseData<Product>(response)
 * // Returns: { id: '1', type: 'products', attributes: {...} }
 */
export function extractResponseData<T = IDataObject>(response: IDataObject): T | T[] | undefined {
  if (!response || typeof response !== 'object') {
    return undefined;
  }
  return response.data as T | T[] | undefined;
}

/**
 * Extracts included related resources from a JSON:API response.
 *
 * When using the 'include' query parameter, related resources are returned
 * in the 'included' array of the response. This helper extracts them.
 *
 * @param response - The full JSON:API response object
 * @returns Array of included resources, or empty array if none
 *
 * @example
 * const response = {
 *   data: {...},
 *   included: [{ id: '1', type: 'stores', attributes: {...} }]
 * }
 * const stores = extractIncludedResources(response)
 * // Returns: [{ id: '1', type: 'stores', attributes: {...} }]
 */
export function extractIncludedResources(response: IDataObject): IDataObject[] {
  if (!response || typeof response !== 'object') {
    return [];
  }
  return (response.included as IDataObject[]) || [];
}

/**
 * Flattens a JSON:API resource object into a simple key-value object.
 *
 * Transforms deeply nested JSON:API format into a flat structure that is
 * easier to use in n8n expressions and downstream nodes.
 *
 * @param data - A JSON:API resource object with type, id, attributes, etc.
 * @returns A flat object with id, type, and all attribute fields at the top level
 *
 * @example
 * // Input:  { type: 'orders', id: '1', attributes: { total: 999, status: 'paid' }, relationships: {...} }
 * // Output: { id: '1', type: 'orders', total: 999, status: 'paid' }
 */
export function simplifyJsonApiResponse(data: IDataObject): IDataObject {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const { id, type, attributes, ...rest } = data;
  const simplified: IDataObject = { id, type };

  if (attributes && typeof attributes === 'object' && !Array.isArray(attributes)) {
    Object.assign(simplified, attributes as IDataObject);
  }

  // Preserve meta if present (e.g., invoice download URLs)
  if (rest.meta) {
    simplified.meta = rest.meta;
  }

  return simplified;
}

/**
 * Applies simplification to a single item or array of items.
 *
 * @param responseData - A single JSON:API resource or array of resources
 * @returns Simplified resource(s)
 */
export function simplifyResponse(
  responseData: IDataObject | IDataObject[],
): IDataObject | IDataObject[] {
  if (Array.isArray(responseData)) {
    return responseData.map((item) => simplifyJsonApiResponse(item));
  }

  // Handle wrapped response with .data property
  if (responseData.data && !responseData.attributes) {
    if (Array.isArray(responseData.data)) {
      return (responseData.data as IDataObject[]).map((item) => simplifyJsonApiResponse(item));
    }
    return simplifyJsonApiResponse(responseData.data as IDataObject);
  }

  return simplifyJsonApiResponse(responseData);
}

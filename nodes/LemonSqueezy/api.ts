/**
 * Lemon Squeezy API Request Functions
 *
 * Provides:
 * - Authenticated API requests with error handling
 * - Paginated request handling
 * - Rate limit and retry error detection
 * - Detailed error message extraction
 *
 * @module api
 */

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

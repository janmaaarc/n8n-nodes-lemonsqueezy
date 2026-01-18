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
import { API_BASE_URL, DEFAULT_PAGE_SIZE, MAX_RETRIES, RETRY_DELAY_MS, RATE_LIMIT_DELAY_MS } from './constants';
import type { LemonSqueezyResponse } from './types';

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
      return await this.helpers.requestWithAuthentication.call(
        this,
        'lemonSqueezyApi',
        options,
      ) as IDataObject;
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
      responseData = await this.helpers.requestWithAuthentication.call(
        this,
        'lemonSqueezyApi',
        options,
      ) as LemonSqueezyResponse;
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
 * Extract error message from error object
 */
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as {
      message?: string;
      response?: {
        body?: {
          errors?: Array<{ detail?: string; title?: string }>;
          message?: string;
        };
      };
    };

    // Check for JSON:API error format
    if (err.response?.body?.errors?.[0]) {
      const apiError = err.response.body.errors[0];
      return apiError.detail || apiError.title || 'Unknown API error';
    }

    if (err.response?.body?.message) {
      return err.response.body.message;
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
export function buildFilterParams(
  filters: IDataObject,
): Record<string, string | number> {
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

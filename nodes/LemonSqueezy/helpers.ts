/**
 * Lemon Squeezy Helper Functions
 *
 * Provides:
 * - Query parameter building (filters, sorting, includes)
 * - JSON:API body construction
 * - Webhook signature verification
 * - Response simplification and flattening
 *
 * @module helpers
 */

import * as crypto from 'crypto';
import type { IDataObject } from 'n8n-workflow';

// Re-export validation and API modules for backwards compatibility
export {
  isValidEmail,
  isValidUrl,
  isValidIsoDate,
  isPositiveInteger,
  validateField,
  safeJsonParse,
  validateDiscountAmount,
  validateCustomDataSize,
  validateObjectDepth,
  validateFutureDate,
  validateDateRange,
  validateRequiredFields,
} from './validation';

export {
  getRetryAfterSeconds,
  isRateLimitError,
  isRetryableError,
  lemonSqueezyApiRequest,
  lemonSqueezyApiRequestAllItems,
} from './api';

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
  // Guard: SHA-256 HMAC hex digest is always exactly 64 lowercase hex chars.
  // Reject non-hex or wrong-length signatures before any comparison.
  if (!/^[0-9a-f]{64}$/i.test(signature)) {
    return false;
  }
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
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
 * Flattens included JSON:API resources into relationship keys.
 *
 * When the API returns an `included` array (from ?include= query param),
 * this function matches each relationship reference to its included data
 * and returns an object with relationship names as keys and simplified
 * included resources as values.
 *
 * @param data - The JSON:API resource with relationships
 * @param included - The array of included resources from the response
 * @returns An object mapping relationship names to their simplified included data
 *
 * @example
 * // Input relationships: { store: { data: { type: 'stores', id: '1' } } }
 * // Included: [{ type: 'stores', id: '1', attributes: { name: 'My Store' } }]
 * // Output: { store: { id: '1', type: 'stores', name: 'My Store' } }
 */
export function flattenIncludedResources(data: IDataObject, included: IDataObject[]): IDataObject {
  const relationships = data.relationships as IDataObject | undefined;
  if (!relationships || typeof relationships !== 'object') {
    return {};
  }

  const result: IDataObject = {};

  for (const [relName, relValue] of Object.entries(relationships)) {
    if (!relValue || typeof relValue !== 'object') {
      continue;
    }

    const relData = (relValue as IDataObject).data;
    if (!relData) {
      continue;
    }

    if (Array.isArray(relData)) {
      // Array relationship (e.g., order-items, subscriptions)
      const matched = (relData as IDataObject[])
        .map((ref) => {
          const found = included.find(
            (inc) => inc.type === ref.type && String(inc.id) === String(ref.id),
          );
          return found ? simplifyJsonApiResponse(found) : undefined;
        })
        .filter((item): item is IDataObject => item !== undefined);
      if (matched.length > 0) {
        result[relName] = matched;
      }
    } else {
      // Single relationship (e.g., store, customer)
      const ref = relData as IDataObject;
      const found = included.find(
        (inc) => inc.type === ref.type && String(inc.id) === String(ref.id),
      );
      if (found) {
        result[relName] = simplifyJsonApiResponse(found);
      }
    }
  }

  return result;
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
export function simplifyJsonApiResponse(data: IDataObject, included?: IDataObject[]): IDataObject {
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

  // Flatten included relationships if available
  if (included && included.length > 0 && data.relationships) {
    const flattened = flattenIncludedResources(data, included);
    Object.assign(simplified, flattened);
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

  // Extract included resources from JSON:API response envelope
  const included = Array.isArray(responseData.included)
    ? (responseData.included as IDataObject[])
    : undefined;

  // Handle wrapped response with .data property
  if (responseData.data && !responseData.attributes) {
    if (Array.isArray(responseData.data)) {
      return (responseData.data as IDataObject[]).map((item) =>
        simplifyJsonApiResponse(item, included),
      );
    }
    return simplifyJsonApiResponse(responseData.data as IDataObject, included);
  }

  return simplifyJsonApiResponse(responseData, included);
}

/**
 * Input Validation Functions
 *
 * Provides validation utilities for:
 * - Email format (RFC 5322)
 * - URL safety (SSRF protection)
 * - Date format (ISO 8601)
 * - Numeric ranges
 * - Custom data size and depth limits
 * - Discount amounts
 *
 * @module validation
 */

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

/**
 * Validates that a string is a valid lowercase hex string of the expected length.
 *
 * Used to guard webhook signature values before timing-safe comparison,
 * ensuring the value is exactly 64 hex chars (32 bytes SHA-256 HMAC).
 *
 * @param value - The string to validate
 * @param fieldName - Field name for error messages
 * @param expectedLength - Expected character length (default: 64 for SHA-256 hex)
 * @throws Error if the value is not a valid hex string of the expected length
 *
 * @example
 * validateHexString('abc123...', 'x-signature', 64) // passes
 * validateHexString('not-hex!', 'x-signature', 64)  // throws
 */
export function validateHexString(
  value: string,
  fieldName: string,
  expectedLength: number = 64,
): void {
  const hexRegex = /^[0-9a-f]+$/i;
  if (value.length !== expectedLength || !hexRegex.test(value)) {
    throw new Error(
      `${fieldName} must be a ${expectedLength}-character hex string (received length: ${value.length})`,
    );
  }
}

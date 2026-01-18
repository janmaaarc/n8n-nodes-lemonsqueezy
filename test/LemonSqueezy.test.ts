import * as crypto from 'crypto';
import { describe, it, expect } from 'vitest';
import {
  buildFilterParams,
  buildJsonApiBody,
  validateRequiredFields,
  verifyWebhookSignature,
  isValidEmail,
  isValidUrl,
  isValidIsoDate,
  isPositiveInteger,
  validateField,
  safeJsonParse,
  buildIncludeParams,
  buildAdvancedFilterParams,
  extractResponseData,
  extractIncludedResources,
} from '../nodes/LemonSqueezy/helpers';
import {
  RESOURCE_ENDPOINTS,
  RESOURCE_ID_PARAMS,
  WEBHOOK_EVENTS,
  API_BASE_URL,
  SUBSCRIPTION_STATUSES,
  ORDER_STATUSES,
  CUSTOMER_STATUSES,
  DISCOUNT_AMOUNT_TYPES,
  PAUSE_MODES,
} from '../nodes/LemonSqueezy/constants';

describe('Constants', () => {
  describe('RESOURCE_ENDPOINTS', () => {
    it('should have correct endpoint mappings', () => {
      expect(RESOURCE_ENDPOINTS.product).toBe('products');
      expect(RESOURCE_ENDPOINTS.order).toBe('orders');
      expect(RESOURCE_ENDPOINTS.subscription).toBe('subscriptions');
      expect(RESOURCE_ENDPOINTS.customer).toBe('customers');
      expect(RESOURCE_ENDPOINTS.licenseKey).toBe('license-keys');
      expect(RESOURCE_ENDPOINTS.discount).toBe('discounts');
      expect(RESOURCE_ENDPOINTS.store).toBe('stores');
      expect(RESOURCE_ENDPOINTS.variant).toBe('variants');
      expect(RESOURCE_ENDPOINTS.checkout).toBe('checkouts');
      expect(RESOURCE_ENDPOINTS.webhook).toBe('webhooks');
    });
  });

  describe('RESOURCE_ID_PARAMS', () => {
    it('should have correct ID parameter mappings', () => {
      expect(RESOURCE_ID_PARAMS.product).toBe('productId');
      expect(RESOURCE_ID_PARAMS.customer).toBe('customerId');
      expect(RESOURCE_ID_PARAMS.subscription).toBe('subscriptionId');
    });
  });

  describe('WEBHOOK_EVENTS', () => {
    it('should contain all expected webhook events', () => {
      const eventValues = WEBHOOK_EVENTS.map((e) => e.value);
      expect(eventValues).toContain('order_created');
      expect(eventValues).toContain('subscription_created');
      expect(eventValues).toContain('subscription_cancelled');
      expect(eventValues).toContain('license_key_created');
    });
  });

  describe('API_BASE_URL', () => {
    it('should have correct API base URL', () => {
      expect(API_BASE_URL).toBe('https://api.lemonsqueezy.com/v1');
    });
  });
});

describe('Helpers', () => {
  describe('buildFilterParams', () => {
    it('should convert camelCase filters to snake_case API params', () => {
      const filters = {
        storeId: '123',
        userEmail: 'test@example.com',
      };
      const result = buildFilterParams(filters);
      expect(result['filter[store_id]']).toBe('123');
      expect(result['filter[user_email]']).toBe('test@example.com');
    });

    it('should ignore empty, null, and undefined values', () => {
      const filters = {
        storeId: '123',
        empty: '',
        nullValue: null,
        undefinedValue: undefined,
      };
      const result = buildFilterParams(filters as Record<string, unknown>);
      expect(result['filter[store_id]']).toBe('123');
      expect(result['filter[empty]']).toBeUndefined();
      expect(result['filter[null_value]']).toBeUndefined();
      expect(result['filter[undefined_value]']).toBeUndefined();
    });

    it('should handle numeric values', () => {
      const filters = { limit: 50 };
      const result = buildFilterParams(filters);
      expect(result['filter[limit]']).toBe(50);
    });
  });

  describe('buildJsonApiBody', () => {
    it('should build basic JSON:API body', () => {
      const result = buildJsonApiBody('customers', { name: 'John', email: 'john@example.com' });
      expect(result).toEqual({
        data: {
          type: 'customers',
          attributes: {
            name: 'John',
            email: 'john@example.com',
          },
        },
      });
    });

    it('should include ID when provided', () => {
      const result = buildJsonApiBody('customers', { name: 'John' }, undefined, '123');
      expect((result.data as Record<string, unknown>).id).toBe('123');
    });

    it('should include relationships when provided', () => {
      const result = buildJsonApiBody(
        'customers',
        { name: 'John' },
        { store: { type: 'stores', id: '456' } },
      );
      expect((result.data as Record<string, unknown>).relationships).toEqual({
        store: {
          data: {
            type: 'stores',
            id: '456',
          },
        },
      });
    });
  });

  describe('validateRequiredFields', () => {
    it('should not throw for valid fields', () => {
      expect(() =>
        validateRequiredFields({ name: 'John', email: 'john@example.com' }, ['name', 'email']),
      ).not.toThrow();
    });

    it('should throw for missing fields', () => {
      expect(() => validateRequiredFields({ name: 'John' }, ['name', 'email'])).toThrow(
        'Missing required fields: email',
      );
    });

    it('should throw for empty string fields', () => {
      expect(() =>
        validateRequiredFields({ name: '', email: 'john@example.com' }, ['name', 'email']),
      ).toThrow('Missing required fields: name');
    });

    it('should throw for null fields', () => {
      expect(() =>
        validateRequiredFields({ name: null, email: 'john@example.com' }, ['name', 'email']),
      ).toThrow('Missing required fields: name');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signature', () => {
      const payload = '{"test":"data"}';
      const secret = 'test-secret';
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const result = verifyWebhookSignature(payload, expectedSignature, secret);
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const payload = '{"test":"data"}';
      const secret = 'test-secret';
      const invalidSignature = 'invalid-signature';

      const result = verifyWebhookSignature(payload, invalidSignature, secret);
      expect(result).toBe(false);
    });
  });
});

describe('Types', () => {
  it('should export all necessary types', async () => {
    const types = await import('../nodes/LemonSqueezy/types');
    expect(types).toBeDefined();
  });
});

describe('Validation Helpers', () => {
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user @domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('isValidIsoDate', () => {
    it('should return true for valid ISO dates', () => {
      expect(isValidIsoDate('2024-01-15')).toBe(true);
      expect(isValidIsoDate('2024-01-15T10:30:00Z')).toBe(true);
      expect(isValidIsoDate('2024-01-15T10:30:00.000Z')).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidIsoDate('invalid')).toBe(false);
      expect(isValidIsoDate('01/15/2024')).toBe(false);
      expect(isValidIsoDate('')).toBe(false);
    });
  });

  describe('isPositiveInteger', () => {
    it('should return true for positive integers', () => {
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger(100)).toBe(true);
      expect(isPositiveInteger(999999)).toBe(true);
    });

    it('should return false for non-positive integers', () => {
      expect(isPositiveInteger(0)).toBe(false);
      expect(isPositiveInteger(-1)).toBe(false);
      expect(isPositiveInteger(1.5)).toBe(false);
      expect(isPositiveInteger('1')).toBe(false);
      expect(isPositiveInteger(null)).toBe(false);
    });
  });

  describe('validateField', () => {
    it('should validate required fields', () => {
      expect(() => validateField('name', 'John', 'required')).not.toThrow();
      expect(() => validateField('name', '', 'required')).toThrow('name is required');
      expect(() => validateField('name', null, 'required')).toThrow('name is required');
    });

    it('should validate email fields', () => {
      expect(() => validateField('email', 'test@example.com', 'email')).not.toThrow();
      expect(() => validateField('email', 'invalid', 'email')).toThrow(
        'email must be a valid email address',
      );
    });

    it('should validate URL fields', () => {
      expect(() => validateField('url', 'https://example.com', 'url')).not.toThrow();
      expect(() => validateField('url', 'invalid', 'url')).toThrow('url must be a valid URL');
    });

    it('should skip validation for empty optional fields', () => {
      expect(() => validateField('email', '', 'email')).not.toThrow();
      expect(() => validateField('url', null, 'url')).not.toThrow();
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"key":"value"}', 'data')).toEqual({ key: 'value' });
      expect(safeJsonParse('[1,2,3]', 'array')).toEqual([1, 2, 3]);
    });

    it('should throw descriptive error for invalid JSON', () => {
      expect(() => safeJsonParse('invalid', 'customData')).toThrow(
        'customData contains invalid JSON',
      );
    });
  });
});

describe('Advanced Query Helpers', () => {
  describe('buildIncludeParams', () => {
    it('should build include params for relationships', () => {
      expect(buildIncludeParams(['store', 'product'])).toEqual({
        include: 'store,product',
      });
    });

    it('should return empty object for empty array', () => {
      expect(buildIncludeParams([])).toEqual({});
    });
  });

  describe('buildAdvancedFilterParams', () => {
    it('should build basic filter params', () => {
      const result = buildAdvancedFilterParams({ storeId: '123' });
      expect(result['filter[store_id]']).toBe('123');
    });

    it('should add sorting', () => {
      const result = buildAdvancedFilterParams(
        { storeId: '123' },
        { sortField: 'createdAt', sortDirection: 'desc' },
      );
      expect(result.sort).toBe('-created_at');
    });

    it('should handle ascending sort', () => {
      const result = buildAdvancedFilterParams({}, { sortField: 'name', sortDirection: 'asc' });
      expect(result.sort).toBe('name');
    });
  });

  describe('extractResponseData', () => {
    it('should extract data from response', () => {
      const response = { data: { id: '123', type: 'customers' } };
      expect(extractResponseData(response)).toEqual({ id: '123', type: 'customers' });
    });

    it('should return undefined for invalid response', () => {
      expect(extractResponseData(null as unknown as Record<string, unknown>)).toBeUndefined();
    });
  });

  describe('extractIncludedResources', () => {
    it('should extract included resources', () => {
      const response = {
        data: { id: '123' },
        included: [{ id: '456', type: 'stores' }],
      };
      expect(extractIncludedResources(response)).toEqual([{ id: '456', type: 'stores' }]);
    });

    it('should return empty array if no included', () => {
      const response = { data: { id: '123' } };
      expect(extractIncludedResources(response)).toEqual([]);
    });
  });
});

describe('Additional Constants', () => {
  describe('SUBSCRIPTION_STATUSES', () => {
    it('should contain all subscription statuses', () => {
      const statusValues = SUBSCRIPTION_STATUSES.map((s) => s.value);
      expect(statusValues).toContain('active');
      expect(statusValues).toContain('cancelled');
      expect(statusValues).toContain('paused');
      expect(statusValues).toContain('on_trial');
    });
  });

  describe('ORDER_STATUSES', () => {
    it('should contain all order statuses', () => {
      const statusValues = ORDER_STATUSES.map((s) => s.value);
      expect(statusValues).toContain('paid');
      expect(statusValues).toContain('refunded');
      expect(statusValues).toContain('pending');
    });
  });

  describe('CUSTOMER_STATUSES', () => {
    it('should contain all customer statuses', () => {
      const statusValues = CUSTOMER_STATUSES.map((s) => s.value);
      expect(statusValues).toContain('subscribed');
      expect(statusValues).toContain('archived');
    });
  });

  describe('DISCOUNT_AMOUNT_TYPES', () => {
    it('should contain percent and fixed types', () => {
      const typeValues = DISCOUNT_AMOUNT_TYPES.map((t) => t.value);
      expect(typeValues).toContain('percent');
      expect(typeValues).toContain('fixed');
    });
  });

  describe('PAUSE_MODES', () => {
    it('should contain pause modes', () => {
      const modeValues = PAUSE_MODES.map((m) => m.value);
      expect(modeValues).toContain('void');
      expect(modeValues).toContain('free');
    });
  });
});

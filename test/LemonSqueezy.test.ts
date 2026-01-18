import * as crypto from 'crypto';
import { describe, it, expect } from 'vitest';
import {
  buildFilterParams,
  buildJsonApiBody,
  validateRequiredFields,
  verifyWebhookSignature,
} from '../nodes/LemonSqueezy/helpers';
import {
  RESOURCE_ENDPOINTS,
  RESOURCE_ID_PARAMS,
  WEBHOOK_EVENTS,
  API_BASE_URL,
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
      const result = buildJsonApiBody(
        'customers',
        { name: 'John' },
        undefined,
        '123',
      );
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
        validateRequiredFields(
          { name: 'John', email: 'john@example.com' },
          ['name', 'email'],
        ),
      ).not.toThrow();
    });

    it('should throw for missing fields', () => {
      expect(() =>
        validateRequiredFields({ name: 'John' }, ['name', 'email']),
      ).toThrow('Missing required fields: email');
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
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

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

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
  DEFAULT_PAGE_SIZE,
  MAX_RETRIES,
  RETRY_DELAY_MS,
  RATE_LIMIT_DELAY_MS,
  LICENSE_KEY_STATUSES,
  DISCOUNT_DURATION_TYPES,
  PRODUCT_STATUSES,
  INTERVAL_TYPES,
} from '../nodes/LemonSqueezy/constants';
import { LemonSqueezyApi } from '../credentials/LemonSqueezyApi.credentials';
import { LemonSqueezy } from '../nodes/LemonSqueezy/LemonSqueezy.node';
import { LemonSqueezyTrigger } from '../nodes/LemonSqueezy/LemonSqueezyTrigger.node';

// ============================================================================
// Credential Tests
// ============================================================================

describe('Credentials', () => {
  describe('LemonSqueezyApi', () => {
    const credentials = new LemonSqueezyApi();

    it('should have correct name and displayName', () => {
      expect(credentials.name).toBe('lemonSqueezyApi');
      expect(credentials.displayName).toBe('Lemon Squeezy API');
    });

    it('should have icon defined', () => {
      expect(credentials.icon).toBe('file:lemonSqueezy.svg');
    });

    it('should have documentation URL', () => {
      expect(credentials.documentationUrl).toBe('https://docs.lemonsqueezy.com/api');
    });

    it('should have API key property', () => {
      expect(credentials.properties).toHaveLength(1);
      expect(credentials.properties[0].name).toBe('apiKey');
      expect(credentials.properties[0].type).toBe('string');
      expect(credentials.properties[0].required).toBe(true);
    });

    it('should have password type for API key', () => {
      expect(credentials.properties[0].typeOptions?.password).toBe(true);
    });

    it('should have generic authentication', () => {
      expect(credentials.authenticate.type).toBe('generic');
      expect(credentials.authenticate.properties.headers).toHaveProperty('Authorization');
      expect(credentials.authenticate.properties.headers).toHaveProperty('Accept');
      expect(credentials.authenticate.properties.headers).toHaveProperty('Content-Type');
    });

    it('should have correct test request config', () => {
      expect(credentials.test.request.baseURL).toBe('https://api.lemonsqueezy.com/v1');
      expect(credentials.test.request.url).toBe('/users/me');
    });

    it('should have proper headers for JSON:API', () => {
      const headers = credentials.authenticate.properties.headers as Record<string, string>;
      expect(headers?.Accept).toBe('application/vnd.api+json');
      expect(headers?.['Content-Type']).toBe('application/vnd.api+json');
    });
  });
});

// ============================================================================
// Node Description Tests
// ============================================================================

describe('Node Descriptions', () => {
  describe('LemonSqueezy Node', () => {
    const node = new LemonSqueezy();

    it('should have correct display name', () => {
      expect(node.description.displayName).toBe('Lemon Squeezy');
    });

    it('should have correct node name', () => {
      expect(node.description.name).toBe('lemonSqueezy');
    });

    it('should have version 1', () => {
      expect(node.description.version).toBe(1);
    });

    it('should be in transform group', () => {
      expect(node.description.group).toContain('transform');
    });

    it('should have credential requirement', () => {
      expect(node.description.credentials).toHaveLength(1);
      expect(node.description.credentials?.[0].name).toBe('lemonSqueezyApi');
      expect(node.description.credentials?.[0].required).toBe(true);
    });

    it('should have main input and output', () => {
      expect(node.description.inputs).toContain('main');
      expect(node.description.outputs).toContain('main');
    });

    it('should have icon defined', () => {
      expect(node.description.icon).toBe('file:lemonSqueezy.svg');
    });

    it('should have subtitle with operation and resource', () => {
      expect(node.description.subtitle).toContain('operation');
      expect(node.description.subtitle).toContain('resource');
    });

    it('should have properties defined', () => {
      expect(node.description.properties.length).toBeGreaterThan(0);
    });

    it('should have resource property as first property', () => {
      const resourceProp = node.description.properties[0];
      expect(resourceProp.name).toBe('resource');
      expect(resourceProp.type).toBe('options');
    });

    it('should have all expected resources', () => {
      const resourceProp = node.description.properties[0];
      const resourceValues = resourceProp.options?.map((o) => (o as { value: string }).value) || [];
      expect(resourceValues).toContain('product');
      expect(resourceValues).toContain('order');
      expect(resourceValues).toContain('subscription');
      expect(resourceValues).toContain('customer');
      expect(resourceValues).toContain('licenseKey');
      expect(resourceValues).toContain('discount');
      expect(resourceValues).toContain('checkout');
      expect(resourceValues).toContain('webhook');
      expect(resourceValues).toContain('user');
    });

    it('should have execute method', () => {
      expect(typeof node.execute).toBe('function');
    });
  });

  describe('LemonSqueezyTrigger Node', () => {
    const triggerNode = new LemonSqueezyTrigger();

    it('should have correct display name', () => {
      expect(triggerNode.description.displayName).toBe('Lemon Squeezy Trigger');
    });

    it('should have correct node name', () => {
      expect(triggerNode.description.name).toBe('lemonSqueezyTrigger');
    });

    it('should be in trigger group', () => {
      expect(triggerNode.description.group).toContain('trigger');
    });

    it('should have no inputs', () => {
      expect(triggerNode.description.inputs).toHaveLength(0);
    });

    it('should have main output', () => {
      expect(triggerNode.description.outputs).toContain('main');
    });

    it('should have webhook configuration', () => {
      expect(triggerNode.description.webhooks).toHaveLength(1);
      expect(triggerNode.description.webhooks?.[0].httpMethod).toBe('POST');
      expect(triggerNode.description.webhooks?.[0].path).toBe('webhook');
    });

    it('should have required properties', () => {
      const propNames = triggerNode.description.properties.map((p) => p.name);
      expect(propNames).toContain('storeId');
      expect(propNames).toContain('events');
      expect(propNames).toContain('webhookSecret');
      expect(propNames).toContain('options');
    });

    it('should have events as multiOptions', () => {
      const eventsProp = triggerNode.description.properties.find((p) => p.name === 'events');
      expect(eventsProp?.type).toBe('multiOptions');
      expect(eventsProp?.required).toBe(true);
    });

    it('should have webhookMethods defined', () => {
      expect(triggerNode.webhookMethods).toBeDefined();
      expect(triggerNode.webhookMethods.default).toBeDefined();
      expect(typeof triggerNode.webhookMethods.default.checkExists).toBe('function');
      expect(typeof triggerNode.webhookMethods.default.create).toBe('function');
      expect(typeof triggerNode.webhookMethods.default.delete).toBe('function');
    });

    it('should have webhook method', () => {
      expect(typeof triggerNode.webhook).toBe('function');
    });

    it('should have credential requirement', () => {
      expect(triggerNode.description.credentials).toHaveLength(1);
      expect(triggerNode.description.credentials?.[0].name).toBe('lemonSqueezyApi');
    });
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('Constants', () => {
  describe('API Configuration', () => {
    it('should have correct API base URL', () => {
      expect(API_BASE_URL).toBe('https://api.lemonsqueezy.com/v1');
    });

    it('should have default page size of 100', () => {
      expect(DEFAULT_PAGE_SIZE).toBe(100);
    });

    it('should have max retries of 3', () => {
      expect(MAX_RETRIES).toBe(3);
    });

    it('should have retry delay of 1000ms', () => {
      expect(RETRY_DELAY_MS).toBe(1000);
    });

    it('should have rate limit delay of 60000ms', () => {
      expect(RATE_LIMIT_DELAY_MS).toBe(60000);
    });
  });

  describe('RESOURCE_ENDPOINTS', () => {
    it('should have correct endpoint mappings for all resources', () => {
      expect(RESOURCE_ENDPOINTS.product).toBe('products');
      expect(RESOURCE_ENDPOINTS.order).toBe('orders');
      expect(RESOURCE_ENDPOINTS.orderItem).toBe('order-items');
      expect(RESOURCE_ENDPOINTS.subscription).toBe('subscriptions');
      expect(RESOURCE_ENDPOINTS.subscriptionInvoice).toBe('subscription-invoices');
      expect(RESOURCE_ENDPOINTS.customer).toBe('customers');
      expect(RESOURCE_ENDPOINTS.licenseKey).toBe('license-keys');
      expect(RESOURCE_ENDPOINTS.licenseKeyInstance).toBe('license-key-instances');
      expect(RESOURCE_ENDPOINTS.discount).toBe('discounts');
      expect(RESOURCE_ENDPOINTS.discountRedemption).toBe('discount-redemptions');
      expect(RESOURCE_ENDPOINTS.store).toBe('stores');
      expect(RESOURCE_ENDPOINTS.variant).toBe('variants');
      expect(RESOURCE_ENDPOINTS.checkout).toBe('checkouts');
      expect(RESOURCE_ENDPOINTS.webhook).toBe('webhooks');
      expect(RESOURCE_ENDPOINTS.usageRecord).toBe('usage-records');
      expect(RESOURCE_ENDPOINTS.user).toBe('users');
    });

    it('should have 16 resource endpoints', () => {
      expect(Object.keys(RESOURCE_ENDPOINTS).length).toBe(16);
    });
  });

  describe('RESOURCE_ID_PARAMS', () => {
    it('should have correct ID parameter mappings', () => {
      expect(RESOURCE_ID_PARAMS.product).toBe('productId');
      expect(RESOURCE_ID_PARAMS.order).toBe('orderId');
      expect(RESOURCE_ID_PARAMS.orderItem).toBe('orderItemId');
      expect(RESOURCE_ID_PARAMS.subscription).toBe('subscriptionId');
      expect(RESOURCE_ID_PARAMS.subscriptionInvoice).toBe('subscriptionInvoiceId');
      expect(RESOURCE_ID_PARAMS.customer).toBe('customerId');
      expect(RESOURCE_ID_PARAMS.licenseKey).toBe('licenseKeyId');
      expect(RESOURCE_ID_PARAMS.licenseKeyInstance).toBe('licenseKeyInstanceId');
      expect(RESOURCE_ID_PARAMS.discount).toBe('discountId');
      expect(RESOURCE_ID_PARAMS.discountRedemption).toBe('discountRedemptionId');
      expect(RESOURCE_ID_PARAMS.store).toBe('storeId');
      expect(RESOURCE_ID_PARAMS.variant).toBe('variantId');
      expect(RESOURCE_ID_PARAMS.checkout).toBe('checkoutId');
      expect(RESOURCE_ID_PARAMS.webhook).toBe('webhookId');
      expect(RESOURCE_ID_PARAMS.usageRecord).toBe('usageRecordId');
    });
  });

  describe('WEBHOOK_EVENTS', () => {
    it('should contain all expected webhook events', () => {
      const eventValues = WEBHOOK_EVENTS.map((e) => e.value);
      expect(eventValues).toContain('order_created');
      expect(eventValues).toContain('order_refunded');
      expect(eventValues).toContain('subscription_created');
      expect(eventValues).toContain('subscription_updated');
      expect(eventValues).toContain('subscription_cancelled');
      expect(eventValues).toContain('subscription_resumed');
      expect(eventValues).toContain('subscription_expired');
      expect(eventValues).toContain('subscription_paused');
      expect(eventValues).toContain('subscription_unpaused');
      expect(eventValues).toContain('subscription_payment_success');
      expect(eventValues).toContain('subscription_payment_failed');
      expect(eventValues).toContain('subscription_payment_recovered');
      expect(eventValues).toContain('subscription_payment_refunded');
      expect(eventValues).toContain('license_key_created');
      expect(eventValues).toContain('license_key_updated');
    });

    it('should have 15 webhook events', () => {
      expect(WEBHOOK_EVENTS.length).toBe(15);
    });

    it('should have name and description for each event', () => {
      WEBHOOK_EVENTS.forEach((event) => {
        expect(event.name).toBeDefined();
        expect(event.value).toBeDefined();
        expect(event.description).toBeDefined();
      });
    });
  });

  describe('SUBSCRIPTION_STATUSES', () => {
    it('should contain all subscription statuses', () => {
      const statusValues = SUBSCRIPTION_STATUSES.map((s) => s.value);
      expect(statusValues).toContain('on_trial');
      expect(statusValues).toContain('active');
      expect(statusValues).toContain('paused');
      expect(statusValues).toContain('past_due');
      expect(statusValues).toContain('unpaid');
      expect(statusValues).toContain('cancelled');
      expect(statusValues).toContain('expired');
    });

    it('should have 7 subscription statuses', () => {
      expect(SUBSCRIPTION_STATUSES.length).toBe(7);
    });
  });

  describe('ORDER_STATUSES', () => {
    it('should contain all order statuses', () => {
      const statusValues = ORDER_STATUSES.map((s) => s.value);
      expect(statusValues).toContain('pending');
      expect(statusValues).toContain('failed');
      expect(statusValues).toContain('paid');
      expect(statusValues).toContain('refunded');
    });

    it('should have 4 order statuses', () => {
      expect(ORDER_STATUSES.length).toBe(4);
    });
  });

  describe('CUSTOMER_STATUSES', () => {
    it('should contain all customer statuses', () => {
      const statusValues = CUSTOMER_STATUSES.map((s) => s.value);
      expect(statusValues).toContain('subscribed');
      expect(statusValues).toContain('unsubscribed');
      expect(statusValues).toContain('archived');
      expect(statusValues).toContain('requires_verification');
      expect(statusValues).toContain('invalid_email');
      expect(statusValues).toContain('bounced');
    });

    it('should have 6 customer statuses', () => {
      expect(CUSTOMER_STATUSES.length).toBe(6);
    });
  });

  describe('LICENSE_KEY_STATUSES', () => {
    it('should contain all license key statuses', () => {
      const statusValues = LICENSE_KEY_STATUSES.map((s) => s.value);
      expect(statusValues).toContain('inactive');
      expect(statusValues).toContain('active');
      expect(statusValues).toContain('expired');
      expect(statusValues).toContain('disabled');
    });

    it('should have 4 license key statuses', () => {
      expect(LICENSE_KEY_STATUSES.length).toBe(4);
    });
  });

  describe('DISCOUNT_AMOUNT_TYPES', () => {
    it('should contain percent and fixed types', () => {
      const typeValues = DISCOUNT_AMOUNT_TYPES.map((t) => t.value);
      expect(typeValues).toContain('percent');
      expect(typeValues).toContain('fixed');
    });

    it('should have 2 discount amount types', () => {
      expect(DISCOUNT_AMOUNT_TYPES.length).toBe(2);
    });
  });

  describe('DISCOUNT_DURATION_TYPES', () => {
    it('should contain all duration types', () => {
      const durationValues = DISCOUNT_DURATION_TYPES.map((d) => d.value);
      expect(durationValues).toContain('once');
      expect(durationValues).toContain('repeating');
      expect(durationValues).toContain('forever');
    });

    it('should have descriptions for each duration type', () => {
      DISCOUNT_DURATION_TYPES.forEach((duration) => {
        expect(duration.description).toBeDefined();
      });
    });
  });

  describe('PAUSE_MODES', () => {
    it('should contain pause modes', () => {
      const modeValues = PAUSE_MODES.map((m) => m.value);
      expect(modeValues).toContain('');
      expect(modeValues).toContain('void');
      expect(modeValues).toContain('free');
    });

    it('should have descriptions for each mode', () => {
      PAUSE_MODES.forEach((mode) => {
        expect(mode.description).toBeDefined();
      });
    });
  });

  describe('PRODUCT_STATUSES', () => {
    it('should contain draft and published statuses', () => {
      const statusValues = PRODUCT_STATUSES.map((s) => s.value);
      expect(statusValues).toContain('draft');
      expect(statusValues).toContain('published');
    });
  });

  describe('INTERVAL_TYPES', () => {
    it('should contain all interval types', () => {
      const intervalValues = INTERVAL_TYPES.map((i) => i.value);
      expect(intervalValues).toContain('day');
      expect(intervalValues).toContain('week');
      expect(intervalValues).toContain('month');
      expect(intervalValues).toContain('year');
    });

    it('should have 4 interval types', () => {
      expect(INTERVAL_TYPES.length).toBe(4);
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

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
      const result = buildFilterParams(filters as never);
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

    it('should handle boolean values', () => {
      const filters = { testMode: true };
      const result = buildFilterParams(filters);
      expect(result['filter[test_mode]']).toBe(true);
    });

    it('should return empty object for empty filters', () => {
      const result = buildFilterParams({});
      expect(Object.keys(result).length).toBe(0);
    });

    it('should convert multiple uppercase letters correctly', () => {
      const filters = { orderItemId: '123' };
      const result = buildFilterParams(filters);
      expect(result['filter[order_item_id]']).toBe('123');
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

    it('should handle empty attributes', () => {
      const result = buildJsonApiBody('customers', {});
      expect(result.data).toEqual({
        type: 'customers',
        attributes: {},
      });
    });

    it('should handle multiple relationships', () => {
      const result = buildJsonApiBody(
        'checkouts',
        { custom_price: 1000 },
        {
          store: { type: 'stores', id: '123' },
          variant: { type: 'variants', id: '456' },
        },
      );
      const relationships = (result.data as Record<string, unknown>).relationships as Record<
        string,
        unknown
      >;
      expect(relationships.store).toEqual({ data: { type: 'stores', id: '123' } });
      expect(relationships.variant).toEqual({ data: { type: 'variants', id: '456' } });
    });

    it('should handle ID and relationships together', () => {
      const result = buildJsonApiBody(
        'subscriptions',
        { pause: null },
        { variant: { type: 'variants', id: '789' } },
        '123',
      );
      const data = result.data as Record<string, unknown>;
      expect(data.id).toBe('123');
      expect(data.relationships).toBeDefined();
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

    it('should throw for multiple missing fields', () => {
      expect(() => validateRequiredFields({}, ['name', 'email', 'phone'])).toThrow(
        'Missing required fields: name, email, phone',
      );
    });

    it('should not throw for empty required fields array', () => {
      expect(() => validateRequiredFields({ name: 'John' }, [])).not.toThrow();
    });

    it('should handle undefined fields', () => {
      expect(() => validateRequiredFields({ name: undefined }, ['name'])).toThrow(
        'Missing required fields: name',
      );
    });

    it('should pass with numeric 0 value', () => {
      expect(() => validateRequiredFields({ count: 0 }, ['count'])).not.toThrow();
    });

    it('should pass with boolean false value', () => {
      expect(() => validateRequiredFields({ active: false }, ['active'])).not.toThrow();
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

    it('should return false for different payload', () => {
      const payload = '{"test":"data"}';
      const secret = 'test-secret';
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const result = verifyWebhookSignature('{"different":"payload"}', signature, secret);
      expect(result).toBe(false);
    });

    it('should return false for different secret', () => {
      const payload = '{"test":"data"}';
      const secret = 'test-secret';
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const result = verifyWebhookSignature(payload, signature, 'different-secret');
      expect(result).toBe(false);
    });

    it('should return false for signature with different length', () => {
      const payload = '{"test":"data"}';
      const secret = 'test-secret';

      const result = verifyWebhookSignature(payload, 'short', secret);
      expect(result).toBe(false);
    });

    it('should handle empty payload', () => {
      const payload = '';
      const secret = 'test-secret';
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const result = verifyWebhookSignature(payload, expectedSignature, secret);
      expect(result).toBe(true);
    });
  });
});

// ============================================================================
// Validation Helper Tests
// ============================================================================

describe('Validation Helpers', () => {
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('test123@subdomain.example.com')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user @domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@@domain.com')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid external URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
      expect(isValidUrl('https://sub.domain.example.com/path')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://api.lemonsqueezy.com/v1')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('://missing-protocol.com')).toBe(false);
    });

    it('should return false for non-http(s) protocols', () => {
      expect(isValidUrl('ftp://files.example.com')).toBe(false);
      expect(isValidUrl('file:///etc/passwd')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('should return false for internal/private network URLs (security)', () => {
      expect(isValidUrl('http://localhost:3000')).toBe(false);
      expect(isValidUrl('http://127.0.0.1:8080')).toBe(false);
      expect(isValidUrl('http://0.0.0.0')).toBe(false);
      expect(isValidUrl('http://192.168.1.1')).toBe(false);
      expect(isValidUrl('http://10.0.0.1')).toBe(false);
      expect(isValidUrl('http://172.16.0.1')).toBe(false);
      expect(isValidUrl('http://169.254.169.254')).toBe(false); // AWS metadata
    });
  });

  describe('isValidIsoDate', () => {
    it('should return true for valid ISO dates', () => {
      expect(isValidIsoDate('2024-01-15')).toBe(true);
      expect(isValidIsoDate('2024-01-15T10:30:00Z')).toBe(true);
      expect(isValidIsoDate('2024-01-15T10:30:00.000Z')).toBe(true);
      expect(isValidIsoDate('2024-12-31')).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidIsoDate('invalid')).toBe(false);
      expect(isValidIsoDate('01/15/2024')).toBe(false);
      expect(isValidIsoDate('')).toBe(false);
      expect(isValidIsoDate('2024')).toBe(false);
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
      expect(isPositiveInteger(undefined)).toBe(false);
      expect(isPositiveInteger(NaN)).toBe(false);
      expect(isPositiveInteger(Infinity)).toBe(false);
    });
  });

  describe('validateField', () => {
    it('should validate required fields', () => {
      expect(() => validateField('name', 'John', 'required')).not.toThrow();
      expect(() => validateField('name', '', 'required')).toThrow('name is required');
      expect(() => validateField('name', null, 'required')).toThrow('name is required');
      expect(() => validateField('name', undefined, 'required')).toThrow('name is required');
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

    it('should validate date fields', () => {
      expect(() => validateField('date', '2024-01-15', 'date')).not.toThrow();
      expect(() => validateField('date', 'invalid', 'date')).toThrow(
        'date must be a valid ISO 8601 date',
      );
    });

    it('should validate positiveInteger fields', () => {
      expect(() => validateField('count', 5, 'positiveInteger')).not.toThrow();
      expect(() => validateField('count', -1, 'positiveInteger')).toThrow(
        'count must be a positive integer',
      );
      expect(() => validateField('count', 0, 'positiveInteger')).toThrow(
        'count must be a positive integer',
      );
    });

    it('should skip validation for empty optional fields', () => {
      expect(() => validateField('email', '', 'email')).not.toThrow();
      expect(() => validateField('url', null, 'url')).not.toThrow();
      expect(() => validateField('date', undefined, 'date')).not.toThrow();
      expect(() => validateField('count', '', 'positiveInteger')).not.toThrow();
    });

    it('should reject non-string values for email', () => {
      expect(() => validateField('email', 123, 'email')).toThrow(
        'email must be a valid email address',
      );
    });

    it('should reject non-string values for url', () => {
      expect(() => validateField('url', 123, 'url')).toThrow('url must be a valid URL');
    });

    it('should reject non-string values for date', () => {
      expect(() => validateField('date', new Date(), 'date')).toThrow(
        'date must be a valid ISO 8601 date',
      );
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"key":"value"}', 'data')).toEqual({ key: 'value' });
      expect(safeJsonParse('[1,2,3]', 'array')).toEqual([1, 2, 3]);
      expect(safeJsonParse('"string"', 'string')).toBe('string');
      expect(safeJsonParse('123', 'number')).toBe(123);
      expect(safeJsonParse('true', 'boolean')).toBe(true);
      expect(safeJsonParse('null', 'null')).toBe(null);
    });

    it('should throw descriptive error for invalid JSON', () => {
      expect(() => safeJsonParse('invalid', 'customData')).toThrow(
        'customData contains invalid JSON',
      );
      expect(() => safeJsonParse('{key: value}', 'config')).toThrow('config contains invalid JSON');
      expect(() => safeJsonParse('', 'empty')).toThrow('empty contains invalid JSON');
    });
  });
});

// ============================================================================
// Advanced Query Helper Tests
// ============================================================================

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

    it('should handle single include', () => {
      expect(buildIncludeParams(['store'])).toEqual({
        include: 'store',
      });
    });

    it('should handle multiple includes', () => {
      expect(buildIncludeParams(['store', 'product', 'variant', 'customer'])).toEqual({
        include: 'store,product,variant,customer',
      });
    });
  });

  describe('buildAdvancedFilterParams', () => {
    it('should build basic filter params', () => {
      const result = buildAdvancedFilterParams({ storeId: '123' });
      expect(result['filter[store_id]']).toBe('123');
    });

    it('should add sorting with descending direction', () => {
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

    it('should skip empty values', () => {
      const result = buildAdvancedFilterParams({
        storeId: '123',
        empty: '',
        nullValue: null,
        undefinedValue: undefined,
      } as never);
      expect(result['filter[store_id]']).toBe('123');
      expect(result['filter[empty]']).toBeUndefined();
      expect(result['filter[null_value]']).toBeUndefined();
    });

    it('should handle date range filters', () => {
      const result = buildAdvancedFilterParams(
        { createdAt: { from: '2024-01-01', to: '2024-12-31' } },
        { dateFields: ['createdAt'] },
      );
      expect(result['filter[created_at_after]']).toBe('2024-01-01');
      expect(result['filter[created_at_before]']).toBe('2024-12-31');
    });

    it('should handle date range with only from', () => {
      const result = buildAdvancedFilterParams(
        { createdAt: { from: '2024-01-01' } },
        { dateFields: ['createdAt'] },
      );
      expect(result['filter[created_at_after]']).toBe('2024-01-01');
      expect(result['filter[created_at_before]']).toBeUndefined();
    });

    it('should handle date range with only to', () => {
      const result = buildAdvancedFilterParams(
        { createdAt: { to: '2024-12-31' } },
        { dateFields: ['createdAt'] },
      );
      expect(result['filter[created_at_after]']).toBeUndefined();
      expect(result['filter[created_at_before]']).toBe('2024-12-31');
    });

    it('should handle date field as string', () => {
      const result = buildAdvancedFilterParams(
        { createdAt: '2024-01-15' },
        { dateFields: ['createdAt'] },
      );
      expect(result['filter[created_at]']).toBe('2024-01-15');
    });

    it('should not apply date range logic for non-date fields', () => {
      const result = buildAdvancedFilterParams({ storeId: '123' }, { dateFields: ['createdAt'] });
      expect(result['filter[store_id]']).toBe('123');
    });
  });

  describe('extractResponseData', () => {
    it('should extract data from response', () => {
      const response = { data: { id: '123', type: 'customers' } };
      expect(extractResponseData(response)).toEqual({ id: '123', type: 'customers' });
    });

    it('should extract array data from response', () => {
      const response = {
        data: [
          { id: '1', type: 'products' },
          { id: '2', type: 'products' },
        ],
      };
      expect(extractResponseData(response)).toEqual([
        { id: '1', type: 'products' },
        { id: '2', type: 'products' },
      ]);
    });

    it('should return undefined for null response', () => {
      expect(extractResponseData(null as never)).toBeUndefined();
    });

    it('should return undefined for non-object response', () => {
      expect(extractResponseData('string' as never)).toBeUndefined();
    });

    it('should return undefined for object without data property', () => {
      const result = extractResponseData({});
      expect(result).toBeUndefined();
    });
  });

  describe('extractIncludedResources', () => {
    it('should extract included resources', () => {
      const response = {
        data: { id: '123' },
        included: [
          { id: '456', type: 'stores' },
          { id: '789', type: 'products' },
        ],
      };
      expect(extractIncludedResources(response)).toEqual([
        { id: '456', type: 'stores' },
        { id: '789', type: 'products' },
      ]);
    });

    it('should return empty array if no included', () => {
      const response = { data: { id: '123' } };
      expect(extractIncludedResources(response)).toEqual([]);
    });

    it('should return empty array for null response', () => {
      expect(extractIncludedResources(null as never)).toEqual([]);
    });

    it('should return empty array for non-object response', () => {
      expect(extractIncludedResources('string' as never)).toEqual([]);
    });
  });
});

// ============================================================================
// Types Tests
// ============================================================================

describe('Types', () => {
  it('should export all necessary types', async () => {
    const types = await import('../nodes/LemonSqueezy/types');
    expect(types).toBeDefined();
  });
});

// ============================================================================
// Resource Exports Tests
// ============================================================================

describe('Resource Exports', () => {
  it('should export all resources from index', async () => {
    const resources = await import('../nodes/LemonSqueezy/resources/index');
    expect(resources.resourceProperty).toBeDefined();
    expect(resources.allOperations).toBeDefined();
    expect(resources.allFields).toBeDefined();
    expect(resources.productOperations).toBeDefined();
    expect(resources.orderOperations).toBeDefined();
    expect(resources.subscriptionOperations).toBeDefined();
    expect(resources.customerOperations).toBeDefined();
    expect(resources.userOperations).toBeDefined();
  });

  it('should have resource property with all resources', async () => {
    const resources = await import('../nodes/LemonSqueezy/resources/index');
    const options = resources.resourceProperty.options as Array<{ value: string }>;
    const values = options.map((o) => o.value);
    expect(values).toContain('product');
    expect(values).toContain('order');
    expect(values).toContain('subscription');
    expect(values).toContain('customer');
    expect(values).toContain('user');
  });
});

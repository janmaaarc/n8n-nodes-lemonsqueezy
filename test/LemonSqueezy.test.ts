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
  isRateLimitError,
  isRetryableError,
  validateDiscountAmount,
  validateCustomDataSize,
  getRetryAfterSeconds,
  validateObjectDepth,
  validateFutureDate,
  validateDateRange,
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
  LICENSE_KEY_STATUSES,
  DISCOUNT_DURATION_TYPES,
  PRODUCT_STATUSES,
  INTERVAL_TYPES,
  PRICE_CATEGORIES,
  PRICE_SCHEMES,
  AFFILIATE_STATUSES,
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
      expect(resourceValues).toContain('price');
      expect(resourceValues).toContain('subscriptionItem');
      expect(resourceValues).toContain('affiliate');
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
      expect(RESOURCE_ENDPOINTS.file).toBe('files');
      expect(RESOURCE_ENDPOINTS.price).toBe('prices');
      expect(RESOURCE_ENDPOINTS.subscriptionItem).toBe('subscription-items');
      expect(RESOURCE_ENDPOINTS.affiliate).toBe('affiliates');
    });

    it('should have 20 resource endpoints', () => {
      expect(Object.keys(RESOURCE_ENDPOINTS).length).toBe(20);
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
      expect(RESOURCE_ID_PARAMS.file).toBe('fileId');
      expect(RESOURCE_ID_PARAMS.price).toBe('priceId');
      expect(RESOURCE_ID_PARAMS.subscriptionItem).toBe('subscriptionItemId');
      expect(RESOURCE_ID_PARAMS.affiliate).toBe('affiliateId');
    });

    it('should have 19 resource ID params', () => {
      expect(Object.keys(RESOURCE_ID_PARAMS).length).toBe(19);
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
      expect(eventValues).toContain('affiliate_activated');
    });

    it('should have 16 webhook events', () => {
      expect(WEBHOOK_EVENTS.length).toBe(16);
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
      expect(statusValues).toContain('fraudulent');
    });

    it('should have 5 order statuses', () => {
      expect(ORDER_STATUSES.length).toBe(5);
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

  describe('PRICE_CATEGORIES', () => {
    it('should contain all price categories', () => {
      const categoryValues = PRICE_CATEGORIES.map((c) => c.value);
      expect(categoryValues).toContain('one_time');
      expect(categoryValues).toContain('subscription');
      expect(categoryValues).toContain('lead_magnet');
      expect(categoryValues).toContain('pwyw');
    });

    it('should have 4 price categories', () => {
      expect(PRICE_CATEGORIES.length).toBe(4);
    });
  });

  describe('PRICE_SCHEMES', () => {
    it('should contain all price schemes', () => {
      const schemeValues = PRICE_SCHEMES.map((s) => s.value);
      expect(schemeValues).toContain('standard');
      expect(schemeValues).toContain('package');
      expect(schemeValues).toContain('graduated');
      expect(schemeValues).toContain('volume');
    });

    it('should have 4 price schemes', () => {
      expect(PRICE_SCHEMES.length).toBe(4);
    });
  });

  describe('AFFILIATE_STATUSES', () => {
    it('should contain all affiliate statuses', () => {
      const statusValues = AFFILIATE_STATUSES.map((s) => s.value);
      expect(statusValues).toContain('active');
      expect(statusValues).toContain('pending');
      expect(statusValues).toContain('disabled');
    });

    it('should have 3 affiliate statuses', () => {
      expect(AFFILIATE_STATUSES.length).toBe(3);
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
    expect(resources.affiliateOperations).toBeDefined();
    expect(resources.affiliateFields).toBeDefined();
    expect(resources.priceOperations).toBeDefined();
    expect(resources.priceFields).toBeDefined();
    expect(resources.subscriptionItemOperations).toBeDefined();
    expect(resources.subscriptionItemFields).toBeDefined();
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
    expect(values).toContain('price');
    expect(values).toContain('subscriptionItem');
    expect(values).toContain('affiliate');
    expect(values.length).toBe(20);
  });
});

// ============================================================================
// Retry Logic & Error Detection Tests
// ============================================================================

describe('Retry Logic Helpers', () => {
  describe('isRateLimitError', () => {
    it('should return true for 429 statusCode', () => {
      expect(isRateLimitError({ statusCode: 429 })).toBe(true);
    });

    it('should return true for 429 in response.statusCode', () => {
      expect(isRateLimitError({ response: { statusCode: 429 } })).toBe(true);
    });

    it('should return false for other status codes', () => {
      expect(isRateLimitError({ statusCode: 400 })).toBe(false);
      expect(isRateLimitError({ statusCode: 401 })).toBe(false);
      expect(isRateLimitError({ statusCode: 404 })).toBe(false);
      expect(isRateLimitError({ statusCode: 500 })).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isRateLimitError(null)).toBe(false);
      expect(isRateLimitError(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isRateLimitError('error')).toBe(false);
      expect(isRateLimitError(429)).toBe(false);
      expect(isRateLimitError(true)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isRateLimitError({})).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for 5xx status codes', () => {
      expect(isRetryableError({ statusCode: 500 })).toBe(true);
      expect(isRetryableError({ statusCode: 502 })).toBe(true);
      expect(isRetryableError({ statusCode: 503 })).toBe(true);
      expect(isRetryableError({ statusCode: 504 })).toBe(true);
      expect(isRetryableError({ statusCode: 599 })).toBe(true);
    });

    it('should return true for 5xx in response.statusCode', () => {
      expect(isRetryableError({ response: { statusCode: 500 } })).toBe(true);
      expect(isRetryableError({ response: { statusCode: 503 } })).toBe(true);
    });

    it('should return true for network error codes', () => {
      expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true);
      expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
      expect(isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
    });

    it('should return false for 4xx status codes', () => {
      expect(isRetryableError({ statusCode: 400 })).toBe(false);
      expect(isRetryableError({ statusCode: 401 })).toBe(false);
      expect(isRetryableError({ statusCode: 403 })).toBe(false);
      expect(isRetryableError({ statusCode: 404 })).toBe(false);
      expect(isRetryableError({ statusCode: 422 })).toBe(false);
      expect(isRetryableError({ statusCode: 429 })).toBe(false);
    });

    it('should return false for other error codes', () => {
      expect(isRetryableError({ code: 'ENOTFOUND' })).toBe(false);
      expect(isRetryableError({ code: 'ENOENT' })).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isRetryableError('error')).toBe(false);
      expect(isRetryableError(500)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isRetryableError({})).toBe(false);
    });

    it('should return false for status code 600 (not 5xx)', () => {
      expect(isRetryableError({ statusCode: 600 })).toBe(false);
    });

    it('should return false for status code 499 (not 5xx)', () => {
      expect(isRetryableError({ statusCode: 499 })).toBe(false);
    });
  });
});

// ============================================================================
// Webhook Signature Edge Cases
// ============================================================================

describe('Webhook Signature Edge Cases', () => {
  it('should handle unicode characters in payload', () => {
    const payload = '{"name":"日本語テスト","emoji":"🎉"}';
    const secret = 'test-secret';
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('should handle very long payloads', () => {
    const payload = JSON.stringify({ data: 'x'.repeat(10000) });
    const secret = 'test-secret';
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('should handle special characters in secret', () => {
    const payload = '{"test":"data"}';
    const secret = 'secret!@#$%^&*()_+-=[]{}|;:,.<>?';
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('should return false for tampered payload', () => {
    const originalPayload = '{"amount":100}';
    const tamperedPayload = '{"amount":999}';
    const secret = 'test-secret';
    const signature = crypto.createHmac('sha256', secret).update(originalPayload).digest('hex');
    expect(verifyWebhookSignature(tamperedPayload, signature, secret)).toBe(false);
  });

  it('should return false for empty signature', () => {
    const payload = '{"test":"data"}';
    const secret = 'test-secret';
    expect(verifyWebhookSignature(payload, '', secret)).toBe(false);
  });
});

// ============================================================================
// Shared Resource Options Tests
// ============================================================================

describe('Shared Resource Options', () => {
  it('should export advanced options for resources', async () => {
    const shared = await import('../nodes/LemonSqueezy/resources/shared');
    expect(shared.orderAdvancedOptions).toBeDefined();
    expect(shared.subscriptionAdvancedOptions).toBeDefined();
    expect(shared.customerAdvancedOptions).toBeDefined();
    expect(shared.licenseKeyAdvancedOptions).toBeDefined();
    expect(shared.productAdvancedOptions).toBeDefined();
    expect(shared.variantAdvancedOptions).toBeDefined();
    expect(shared.checkoutAdvancedOptions).toBeDefined();
    expect(shared.discountAdvancedOptions).toBeDefined();
    expect(shared.priceAdvancedOptions).toBeDefined();
    expect(shared.subscriptionItemAdvancedOptions).toBeDefined();
  });

  it('should have sort fields in advanced options', async () => {
    const shared = await import('../nodes/LemonSqueezy/resources/shared');
    expect(shared.COMMON_SORT_FIELDS).toContainEqual({ name: 'Created At', value: 'created_at' });
    expect(shared.COMMON_SORT_FIELDS).toContainEqual({ name: 'Updated At', value: 'updated_at' });
  });

  it('should have sort direction options', async () => {
    const shared = await import('../nodes/LemonSqueezy/resources/shared');
    expect(shared.SORT_DIRECTIONS).toContainEqual({ name: 'Ascending', value: 'asc' });
    expect(shared.SORT_DIRECTIONS).toContainEqual({ name: 'Descending', value: 'desc' });
  });

  it('should have resource-specific includes', async () => {
    const shared = await import('../nodes/LemonSqueezy/resources/shared');
    expect(shared.RESOURCE_INCLUDES.order).toBeDefined();
    expect(shared.RESOURCE_INCLUDES.order.length).toBeGreaterThan(0);
    expect(shared.RESOURCE_INCLUDES.subscription).toBeDefined();
    expect(shared.RESOURCE_INCLUDES.customer).toBeDefined();
  });

  it('should create advanced options field with correct structure', async () => {
    const shared = await import('../nodes/LemonSqueezy/resources/shared');
    const field = shared.createAdvancedOptionsField('order');
    expect(field.displayName).toBe('Advanced Options');
    expect(field.name).toBe('advancedOptions');
    expect(field.type).toBe('collection');
    expect(field.displayOptions?.show?.resource).toContain('order');
  });
});

// ============================================================================
// Input Validation Edge Cases
// ============================================================================

describe('Input Validation Edge Cases', () => {
  describe('Email validation edge cases', () => {
    it('should accept valid complex emails', () => {
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('user123@sub.domain.example.com')).toBe(true);
      expect(isValidEmail("user!#$%&'*+/=?^_`{|}~-@example.com")).toBe(true);
    });

    it('should reject emails without proper TLD', () => {
      expect(isValidEmail('user@localhost')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
    });
  });

  describe('URL validation edge cases', () => {
    it('should accept URLs with ports', () => {
      expect(isValidUrl('https://example.com:8080')).toBe(true);
      expect(isValidUrl('https://example.com:443/path')).toBe(true);
    });

    it('should accept URLs with query strings and fragments', () => {
      expect(isValidUrl('https://example.com/path?query=value&other=123')).toBe(true);
      expect(isValidUrl('https://example.com/path#section')).toBe(true);
    });

    it('should block all private IPv4 ranges', () => {
      // 10.0.0.0/8
      expect(isValidUrl('http://10.255.255.255')).toBe(false);
      // 172.16.0.0/12
      expect(isValidUrl('http://172.31.255.255')).toBe(false);
      // 192.168.0.0/16
      expect(isValidUrl('http://192.168.255.255')).toBe(false);
    });

    it('should block IPv6 localhost', () => {
      expect(isValidUrl('http://[::1]')).toBe(false);
    });
  });

  describe('ISO date validation edge cases', () => {
    it('should accept various ISO 8601 formats', () => {
      expect(isValidIsoDate('2024-01-15')).toBe(true);
      expect(isValidIsoDate('2024-01-15T10:30:00Z')).toBe(true);
      expect(isValidIsoDate('2024-01-15T10:30:00.123Z')).toBe(true);
      expect(isValidIsoDate('2024-01-15T10:30:00+05:30')).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(isValidIsoDate('15-01-2024')).toBe(false);
      expect(isValidIsoDate('2024/01/15')).toBe(false);
      expect(isValidIsoDate('Jan 15, 2024')).toBe(false);
    });
  });

  describe('isValidUrl with requireHttps', () => {
    it('should accept HTTPS URLs when requireHttps is true', () => {
      expect(isValidUrl('https://example.com', true)).toBe(true);
      expect(isValidUrl('https://example.com/webhook', true)).toBe(true);
    });

    it('should reject HTTP URLs when requireHttps is true', () => {
      expect(isValidUrl('http://example.com', true)).toBe(false);
      expect(isValidUrl('http://example.com/webhook', true)).toBe(false);
    });

    it('should accept HTTP URLs when requireHttps is false', () => {
      expect(isValidUrl('http://example.com', false)).toBe(true);
      expect(isValidUrl('https://example.com', false)).toBe(true);
    });
  });

  describe('validateDiscountAmount', () => {
    it('should accept valid percent discounts (0-100)', () => {
      expect(() => validateDiscountAmount(0, 'percent')).not.toThrow();
      expect(() => validateDiscountAmount(50, 'percent')).not.toThrow();
      expect(() => validateDiscountAmount(100, 'percent')).not.toThrow();
    });

    it('should reject invalid percent discounts', () => {
      expect(() => validateDiscountAmount(-1, 'percent')).toThrow(
        'Percent discount must be between 0 and 100',
      );
      expect(() => validateDiscountAmount(101, 'percent')).toThrow(
        'Percent discount must be between 0 and 100',
      );
      expect(() => validateDiscountAmount(150, 'percent')).toThrow(
        'Percent discount must be between 0 and 100',
      );
    });

    it('should accept valid fixed discounts (positive integers)', () => {
      expect(() => validateDiscountAmount(0, 'fixed')).not.toThrow();
      expect(() => validateDiscountAmount(100, 'fixed')).not.toThrow();
      expect(() => validateDiscountAmount(1000, 'fixed')).not.toThrow();
    });

    it('should reject invalid fixed discounts', () => {
      expect(() => validateDiscountAmount(-100, 'fixed')).toThrow(
        'Fixed discount amount must be a positive integer (in cents)',
      );
      expect(() => validateDiscountAmount(10.5, 'fixed')).toThrow(
        'Fixed discount amount must be a positive integer (in cents)',
      );
    });
  });

  describe('validateCustomDataSize', () => {
    it('should accept small payloads', () => {
      expect(() => validateCustomDataSize({ key: 'value' })).not.toThrow();
      expect(() => validateCustomDataSize('{"key":"value"}')).not.toThrow();
      expect(() => validateCustomDataSize({})).not.toThrow();
    });

    it('should accept payloads under the limit', () => {
      const smallData = { data: 'x'.repeat(1000) }; // ~1KB
      expect(() => validateCustomDataSize(smallData)).not.toThrow();
    });

    it('should reject payloads exceeding the default limit (10KB)', () => {
      const largeData = { data: 'x'.repeat(15000) }; // ~15KB
      expect(() => validateCustomDataSize(largeData)).toThrow(/exceeds maximum size/);
    });

    it('should reject payloads exceeding custom limit', () => {
      const data = { data: 'x'.repeat(2000) }; // ~2KB
      expect(() => validateCustomDataSize(data, 1024)).toThrow(/exceeds maximum size/); // 1KB limit
    });

    it('should handle string input', () => {
      const largeString = JSON.stringify({ data: 'x'.repeat(15000) });
      expect(() => validateCustomDataSize(largeString)).toThrow(/exceeds maximum size/);
    });
  });

  describe('getRetryAfterSeconds', () => {
    it('should extract retry-after header from error response', () => {
      const error = {
        response: {
          headers: { 'retry-after': '60' },
        },
      };
      expect(getRetryAfterSeconds(error)).toBe(60);
    });

    it('should return undefined when no retry-after header', () => {
      const error = {
        response: {
          headers: {},
        },
      };
      expect(getRetryAfterSeconds(error)).toBeUndefined();
    });

    it('should return undefined for invalid retry-after value', () => {
      const error = {
        response: {
          headers: { 'retry-after': 'invalid' },
        },
      };
      expect(getRetryAfterSeconds(error)).toBeUndefined();
    });

    it('should return undefined for non-positive values', () => {
      const error = {
        response: {
          headers: { 'retry-after': '0' },
        },
      };
      expect(getRetryAfterSeconds(error)).toBeUndefined();
    });

    it('should return undefined for non-object errors', () => {
      expect(getRetryAfterSeconds(null)).toBeUndefined();
      expect(getRetryAfterSeconds(undefined)).toBeUndefined();
      expect(getRetryAfterSeconds('error')).toBeUndefined();
    });

    it('should return undefined when response is missing', () => {
      const error = { statusCode: 429 };
      expect(getRetryAfterSeconds(error)).toBeUndefined();
    });
  });

  describe('validateObjectDepth', () => {
    it('should accept shallow objects', () => {
      expect(() => validateObjectDepth({ a: 1, b: 2 })).not.toThrow();
      expect(() => validateObjectDepth({ a: { b: 1 } })).not.toThrow();
      expect(() => validateObjectDepth({ a: { b: { c: 1 } } })).not.toThrow();
    });

    it('should accept arrays', () => {
      expect(() => validateObjectDepth([1, 2, 3])).not.toThrow();
      expect(() => validateObjectDepth([{ a: 1 }, { b: 2 }])).not.toThrow();
    });

    it('should accept primitives', () => {
      expect(() => validateObjectDepth('string')).not.toThrow();
      expect(() => validateObjectDepth(123)).not.toThrow();
      expect(() => validateObjectDepth(null)).not.toThrow();
    });

    it('should reject deeply nested objects', () => {
      // Create object with depth > 10
      let deep: Record<string, unknown> = { value: 1 };
      for (let i = 0; i < 15; i++) {
        deep = { nested: deep };
      }
      expect(() => validateObjectDepth(deep)).toThrow(/exceeds maximum depth/);
    });

    it('should respect custom max depth', () => {
      const obj = { a: { b: { c: 1 } } }; // depth 3
      expect(() => validateObjectDepth(obj, 2)).toThrow(/exceeds maximum depth/);
      expect(() => validateObjectDepth(obj, 5)).not.toThrow();
    });
  });

  describe('validateFutureDate', () => {
    it('should accept future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(() => validateFutureDate(futureDate.toISOString(), 'expiresAt')).not.toThrow();
    });

    it('should reject past dates', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      expect(() => validateFutureDate(pastDate.toISOString(), 'expiresAt')).toThrow(
        /must be a future date/,
      );
    });

    it('should reject invalid dates', () => {
      expect(() => validateFutureDate('invalid', 'expiresAt')).toThrow(/must be a valid ISO 8601/);
    });

    it('should use field name in error messages', () => {
      expect(() => validateFutureDate('2020-01-01', 'myField')).toThrow(/myField/);
    });
  });

  describe('validateDateRange', () => {
    it('should accept valid date ranges', () => {
      expect(() =>
        validateDateRange('2024-01-01T00:00:00Z', '2024-12-31T00:00:00Z', 'startsAt', 'expiresAt'),
      ).not.toThrow();
    });

    it('should reject when start is after end', () => {
      expect(() =>
        validateDateRange('2024-12-31T00:00:00Z', '2024-01-01T00:00:00Z', 'startsAt', 'expiresAt'),
      ).toThrow(/startsAt must be before expiresAt/);
    });

    it('should reject when dates are equal', () => {
      expect(() =>
        validateDateRange('2024-06-15T00:00:00Z', '2024-06-15T00:00:00Z', 'startsAt', 'expiresAt'),
      ).toThrow(/startsAt must be before expiresAt/);
    });

    it('should reject invalid start date', () => {
      expect(() => validateDateRange('invalid', '2024-12-31', 'startsAt', 'expiresAt')).toThrow(
        /startsAt must be a valid ISO 8601/,
      );
    });

    it('should reject invalid end date', () => {
      expect(() => validateDateRange('2024-01-01', 'invalid', 'startsAt', 'expiresAt')).toThrow(
        /expiresAt must be a valid ISO 8601/,
      );
    });
  });
});

// ============================================================================
// Node Description Detailed Tests
// ============================================================================

describe('Node Description Details', () => {
  describe('LemonSqueezy Node Operations', () => {
    const node = new LemonSqueezy();

    it('should have operations for each resource', () => {
      const props = node.description.properties;
      const operationProps = props.filter((p) => p.name === 'operation');
      expect(operationProps.length).toBeGreaterThan(0);
    });

    it('should have filters for getAll operations', () => {
      const props = node.description.properties;
      const filterProps = props.filter((p) => p.name === 'filters');
      expect(filterProps.length).toBeGreaterThan(0);
    });

    it('should have returnAll and limit options', () => {
      const props = node.description.properties;
      const returnAllProps = props.filter((p) => p.name === 'returnAll');
      const limitProps = props.filter((p) => p.name === 'limit');
      expect(returnAllProps.length).toBeGreaterThan(0);
      expect(limitProps.length).toBeGreaterThan(0);
    });

    it('should have advancedOptions for supported resources', () => {
      const props = node.description.properties;
      const advancedProps = props.filter((p) => p.name === 'advancedOptions');
      expect(advancedProps.length).toBeGreaterThan(0);
    });

    it('should not have update operation for discount resource', async () => {
      const { discountOperations } = await import('../nodes/LemonSqueezy/resources/discount');
      const operations = discountOperations.options as Array<{ value: string }>;
      const operationValues = operations.map((o) => o.value);
      expect(operationValues).not.toContain('update');
      expect(operationValues).toContain('create');
      expect(operationValues).toContain('get');
      expect(operationValues).toContain('getAll');
      expect(operationValues).toContain('delete');
    });
  });

  describe('LemonSqueezyTrigger Node Details', () => {
    const triggerNode = new LemonSqueezyTrigger();

    it('should have storeId as required field', () => {
      const storeIdProp = triggerNode.description.properties.find((p) => p.name === 'storeId');
      expect(storeIdProp?.required).toBe(true);
    });

    it('should have webhookSecret as required field', () => {
      const secretProp = triggerNode.description.properties.find((p) => p.name === 'webhookSecret');
      expect(secretProp?.required).toBe(true);
      expect(secretProp?.typeOptions?.password).toBe(true);
    });

    it('should have maxEventAgeMinutes in options', () => {
      const optionsProp = triggerNode.description.properties.find((p) => p.name === 'options');
      const options = optionsProp?.options as Array<{ name: string }> | undefined;
      const maxAgeOption = options?.find((o) => o.name === 'maxEventAgeMinutes');
      expect(maxAgeOption).toBeDefined();
    });

    it('should have correct webhook response mode', () => {
      expect(triggerNode.description.webhooks?.[0].responseMode).toBe('onReceived');
    });
  });
});

/**
 * Lemon Squeezy API constants
 */

export const API_BASE_URL = 'https://api.lemonsqueezy.com/v1';

export const DEFAULT_PAGE_SIZE = 100;

export const MAX_RETRIES = 3;

export const RETRY_DELAY_MS = 1000;

export const RATE_LIMIT_DELAY_MS = 60000;

/**
 * Resource to API endpoint mapping
 */
export const RESOURCE_ENDPOINTS: Record<string, string> = {
  product: 'products',
  order: 'orders',
  orderItem: 'order-items',
  subscription: 'subscriptions',
  subscriptionInvoice: 'subscription-invoices',
  customer: 'customers',
  licenseKey: 'license-keys',
  licenseKeyInstance: 'license-key-instances',
  discount: 'discounts',
  discountRedemption: 'discount-redemptions',
  store: 'stores',
  variant: 'variants',
  checkout: 'checkouts',
  webhook: 'webhooks',
  usageRecord: 'usage-records',
  user: 'users',
};

/**
 * Resource to ID parameter mapping
 */
export const RESOURCE_ID_PARAMS: Record<string, string> = {
  product: 'productId',
  order: 'orderId',
  orderItem: 'orderItemId',
  subscription: 'subscriptionId',
  subscriptionInvoice: 'subscriptionInvoiceId',
  customer: 'customerId',
  licenseKey: 'licenseKeyId',
  licenseKeyInstance: 'licenseKeyInstanceId',
  discount: 'discountId',
  discountRedemption: 'discountRedemptionId',
  store: 'storeId',
  variant: 'variantId',
  checkout: 'checkoutId',
  webhook: 'webhookId',
  usageRecord: 'usageRecordId',
};

/**
 * Webhook event types with descriptions
 */
export const WEBHOOK_EVENTS = [
  {
    name: 'Order Created',
    value: 'order_created',
    description: 'Triggered when a new order is created',
  },
  {
    name: 'Order Refunded',
    value: 'order_refunded',
    description: 'Triggered when an order is refunded',
  },
  {
    name: 'Subscription Created',
    value: 'subscription_created',
    description: 'Triggered when a new subscription is created',
  },
  {
    name: 'Subscription Updated',
    value: 'subscription_updated',
    description: 'Triggered when a subscription is updated',
  },
  {
    name: 'Subscription Cancelled',
    value: 'subscription_cancelled',
    description: 'Triggered when a subscription is cancelled',
  },
  {
    name: 'Subscription Resumed',
    value: 'subscription_resumed',
    description: 'Triggered when a subscription is resumed',
  },
  {
    name: 'Subscription Expired',
    value: 'subscription_expired',
    description: 'Triggered when a subscription expires',
  },
  {
    name: 'Subscription Paused',
    value: 'subscription_paused',
    description: 'Triggered when a subscription is paused',
  },
  {
    name: 'Subscription Unpaused',
    value: 'subscription_unpaused',
    description: 'Triggered when a subscription is unpaused',
  },
  {
    name: 'Subscription Payment Success',
    value: 'subscription_payment_success',
    description: 'Triggered when a subscription payment succeeds',
  },
  {
    name: 'Subscription Payment Failed',
    value: 'subscription_payment_failed',
    description: 'Triggered when a subscription payment fails',
  },
  {
    name: 'Subscription Payment Recovered',
    value: 'subscription_payment_recovered',
    description: 'Triggered when a failed payment is recovered',
  },
  {
    name: 'Subscription Payment Refunded',
    value: 'subscription_payment_refunded',
    description: 'Triggered when a subscription payment is refunded',
  },
  {
    name: 'License Key Created',
    value: 'license_key_created',
    description: 'Triggered when a license key is created',
  },
  {
    name: 'License Key Updated',
    value: 'license_key_updated',
    description: 'Triggered when a license key is updated',
  },
];

/**
 * Subscription statuses
 */
export const SUBSCRIPTION_STATUSES = [
  { name: 'On Trial', value: 'on_trial' },
  { name: 'Active', value: 'active' },
  { name: 'Paused', value: 'paused' },
  { name: 'Past Due', value: 'past_due' },
  { name: 'Unpaid', value: 'unpaid' },
  { name: 'Cancelled', value: 'cancelled' },
  { name: 'Expired', value: 'expired' },
];

/**
 * Order statuses
 */
export const ORDER_STATUSES = [
  { name: 'Pending', value: 'pending' },
  { name: 'Failed', value: 'failed' },
  { name: 'Paid', value: 'paid' },
  { name: 'Refunded', value: 'refunded' },
];

/**
 * Customer statuses
 */
export const CUSTOMER_STATUSES = [
  { name: 'Subscribed', value: 'subscribed' },
  { name: 'Unsubscribed', value: 'unsubscribed' },
  { name: 'Archived', value: 'archived' },
  { name: 'Requires Verification', value: 'requires_verification' },
  { name: 'Invalid Email', value: 'invalid_email' },
  { name: 'Bounced', value: 'bounced' },
];

/**
 * License key statuses
 */
export const LICENSE_KEY_STATUSES = [
  { name: 'Inactive', value: 'inactive' },
  { name: 'Active', value: 'active' },
  { name: 'Expired', value: 'expired' },
  { name: 'Disabled', value: 'disabled' },
];

/**
 * Discount types
 */
export const DISCOUNT_AMOUNT_TYPES = [
  { name: 'Percent', value: 'percent' },
  { name: 'Fixed', value: 'fixed' },
];

/**
 * Discount duration types
 */
export const DISCOUNT_DURATION_TYPES = [
  { name: 'Once', value: 'once', description: 'Applied only to the first payment' },
  {
    name: 'Repeating',
    value: 'repeating',
    description: 'Applied for a specified number of months',
  },
  { name: 'Forever', value: 'forever', description: 'Applied to all payments' },
];

/**
 * Pause modes for subscriptions
 */
export const PAUSE_MODES = [
  { name: 'Not Paused', value: '', description: 'Resume or keep subscription active' },
  { name: 'Void', value: 'void', description: 'Pause without extending billing period' },
  { name: 'Free', value: 'free', description: 'Pause and give free days when resumed' },
];

/**
 * Product statuses
 */
export const PRODUCT_STATUSES = [
  { name: 'Draft', value: 'draft' },
  { name: 'Published', value: 'published' },
];

/**
 * Interval types for subscriptions
 */
export const INTERVAL_TYPES = [
  { name: 'Day', value: 'day' },
  { name: 'Week', value: 'week' },
  { name: 'Month', value: 'month' },
  { name: 'Year', value: 'year' },
];

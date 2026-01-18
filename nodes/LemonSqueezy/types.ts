import type { IDataObject } from 'n8n-workflow';

/**
 * Lemon Squeezy API response wrapper
 */
export interface LemonSqueezyResponse<T = IDataObject> {
  data: T | T[];
  meta?: {
    page: {
      currentPage: number;
      from: number;
      lastPage: number;
      perPage: number;
      to: number;
      total: number;
    };
  };
  links?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
  jsonapi?: {
    version: string;
  };
}

/**
 * Base attributes shared across resources
 */
export interface BaseAttributes {
  created_at: string;
  updated_at: string;
}

/**
 * JSON:API resource object
 */
export interface JsonApiResource<T extends string, A extends BaseAttributes> {
  type: T;
  id: string;
  attributes: A;
  relationships?: Record<string, JsonApiRelationship>;
  links?: {
    self: string;
  };
}

/**
 * JSON:API relationship
 */
export interface JsonApiRelationship {
  links?: {
    related: string;
    self: string;
  };
  data?: {
    type: string;
    id: string;
  } | null;
}

/**
 * Store attributes
 */
export interface StoreAttributes extends BaseAttributes {
  name: string;
  slug: string;
  domain: string;
  url: string;
  avatar_url: string;
  plan: string;
  country: string;
  country_nicename: string;
  currency: string;
  total_sales: number;
  total_revenue: number;
  thirty_day_sales: number;
  thirty_day_revenue: number;
}

/**
 * Product attributes
 */
export interface ProductAttributes extends BaseAttributes {
  store_id: number;
  name: string;
  slug: string;
  description: string;
  status: 'draft' | 'published';
  status_formatted: string;
  thumb_url: string | null;
  large_thumb_url: string | null;
  price: number;
  price_formatted: string;
  from_price: number | null;
  to_price: number | null;
  pay_what_you_want: boolean;
  buy_now_url: string;
  test_mode: boolean;
}

/**
 * Variant attributes
 */
export interface VariantAttributes extends BaseAttributes {
  product_id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  is_subscription: boolean;
  interval: 'day' | 'week' | 'month' | 'year' | null;
  interval_count: number | null;
  has_free_trial: boolean;
  trial_interval: 'day' | 'week' | 'month' | 'year';
  trial_interval_count: number;
  pay_what_you_want: boolean;
  min_price: number;
  suggested_price: number;
  has_license_keys: boolean;
  license_activation_limit: number;
  is_license_limit_unlimited: boolean;
  license_length_value: number | null;
  license_length_unit: 'days' | 'months' | 'years';
  sort: number;
  status: 'pending' | 'draft' | 'published';
  status_formatted: string;
  test_mode: boolean;
}

/**
 * Customer attributes
 */
export interface CustomerAttributes extends BaseAttributes {
  store_id: number;
  name: string;
  email: string;
  status:
    | 'subscribed'
    | 'unsubscribed'
    | 'archived'
    | 'requires_verification'
    | 'invalid_email'
    | 'bounced';
  status_formatted: string;
  city: string | null;
  region: string | null;
  country: string | null;
  total_revenue_currency: number;
  mrr: number;
  urls: {
    customer_portal: string;
  };
}

/**
 * Order attributes
 */
export interface OrderAttributes extends BaseAttributes {
  store_id: number;
  customer_id: number;
  identifier: string;
  order_number: number;
  user_name: string;
  user_email: string;
  currency: string;
  currency_rate: string;
  subtotal: number;
  discount_total: number;
  tax: number;
  total: number;
  subtotal_usd: number;
  discount_total_usd: number;
  tax_usd: number;
  total_usd: number;
  tax_name: string | null;
  tax_rate: string;
  status: 'pending' | 'failed' | 'paid' | 'refunded';
  status_formatted: string;
  refunded: boolean;
  refunded_at: string | null;
  subtotal_formatted: string;
  discount_total_formatted: string;
  tax_formatted: string;
  total_formatted: string;
  first_order_item: IDataObject;
  urls: {
    receipt: string;
  };
  test_mode: boolean;
}

/**
 * Subscription attributes
 */
export interface SubscriptionAttributes extends BaseAttributes {
  store_id: number;
  customer_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name: string;
  user_name: string;
  user_email: string;
  status: 'on_trial' | 'active' | 'paused' | 'past_due' | 'unpaid' | 'cancelled' | 'expired';
  status_formatted: string;
  card_brand: string | null;
  card_last_four: string | null;
  pause: {
    mode: 'void' | 'free';
    resumes_at: string | null;
  } | null;
  cancelled: boolean;
  trial_ends_at: string | null;
  billing_anchor: number;
  first_subscription_item: IDataObject;
  urls: {
    update_payment_method: string;
    customer_portal: string;
  };
  renews_at: string;
  ends_at: string | null;
  test_mode: boolean;
}

/**
 * License Key attributes
 */
export interface LicenseKeyAttributes extends BaseAttributes {
  store_id: number;
  customer_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  user_name: string;
  user_email: string;
  key: string;
  key_short: string;
  activation_limit: number;
  instances_count: number;
  disabled: boolean;
  status: 'inactive' | 'active' | 'expired' | 'disabled';
  status_formatted: string;
  expires_at: string | null;
  test_mode: boolean;
}

/**
 * Discount attributes
 */
export interface DiscountAttributes extends BaseAttributes {
  store_id: number;
  name: string;
  code: string;
  amount: number;
  amount_type: 'percent' | 'fixed';
  is_limited_to_products: boolean;
  is_limited_redemptions: boolean;
  max_redemptions: number;
  starts_at: string | null;
  expires_at: string | null;
  duration: 'once' | 'repeating' | 'forever';
  duration_in_months: number | null;
  status: 'draft' | 'published';
  status_formatted: string;
  test_mode: boolean;
}

/**
 * Checkout attributes
 */
export interface CheckoutAttributes extends BaseAttributes {
  store_id: number;
  variant_id: number;
  custom_price: number | null;
  product_options: {
    name: string;
    description: string;
    media: string[];
    redirect_url: string;
    receipt_button_text: string;
    receipt_link_url: string;
    receipt_thank_you_note: string;
    enabled_variants: number[];
  };
  checkout_options: {
    embed: boolean;
    media: boolean;
    logo: boolean;
    desc: boolean;
    discount: boolean;
    dark: boolean;
    subscription_preview: boolean;
    button_color: string;
  };
  checkout_data: {
    email: string;
    name: string;
    billing_address: IDataObject;
    tax_number: string;
    discount_code: string;
    custom: IDataObject;
    variant_quantities: IDataObject[];
  };
  preview: {
    currency: string;
    currency_rate: number;
    subtotal: number;
    discount_total: number;
    tax: number;
    total: number;
    subtotal_usd: number;
    discount_total_usd: number;
    tax_usd: number;
    total_usd: number;
    subtotal_formatted: string;
    discount_total_formatted: string;
    tax_formatted: string;
    total_formatted: string;
  };
  expires_at: string | null;
  url: string;
  test_mode: boolean;
}

/**
 * Webhook attributes
 */
export interface WebhookAttributes extends BaseAttributes {
  store_id: number;
  url: string;
  events: string[];
  last_sent_at: string | null;
  test_mode: boolean;
}

/**
 * License Key Instance attributes
 */
export interface LicenseKeyInstanceAttributes extends BaseAttributes {
  license_key_id: number;
  identifier: string;
  name: string;
}

/**
 * Resource types
 */
export type Store = JsonApiResource<'stores', StoreAttributes>;
export type Product = JsonApiResource<'products', ProductAttributes>;
export type Variant = JsonApiResource<'variants', VariantAttributes>;
export type Customer = JsonApiResource<'customers', CustomerAttributes>;
export type Order = JsonApiResource<'orders', OrderAttributes>;
export type Subscription = JsonApiResource<'subscriptions', SubscriptionAttributes>;
export type LicenseKey = JsonApiResource<'license-keys', LicenseKeyAttributes>;
export type Discount = JsonApiResource<'discounts', DiscountAttributes>;
export type Checkout = JsonApiResource<'checkouts', CheckoutAttributes>;
export type Webhook = JsonApiResource<'webhooks', WebhookAttributes>;
export type LicenseKeyInstance = JsonApiResource<
  'license-key-instances',
  LicenseKeyInstanceAttributes
>;

/**
 * Webhook event types
 */
export type WebhookEventType =
  | 'order_created'
  | 'order_refunded'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused'
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'subscription_payment_recovered'
  | 'subscription_payment_refunded'
  | 'license_key_created'
  | 'license_key_updated';

/**
 * Webhook payload
 */
export interface WebhookPayload {
  meta: {
    event_name: WebhookEventType;
    custom_data?: IDataObject;
    test_mode: boolean;
  };
  data: IDataObject;
}

/**
 * Resource name to endpoint mapping
 */
export type ResourceName =
  | 'product'
  | 'order'
  | 'subscription'
  | 'customer'
  | 'licenseKey'
  | 'discount'
  | 'store'
  | 'variant'
  | 'checkout'
  | 'webhook'
  | 'licenseKeyInstance';

/**
 * Operation types
 */
export type OperationType =
  | 'get'
  | 'getAll'
  | 'create'
  | 'update'
  | 'delete'
  | 'cancel'
  | 'activate'
  | 'deactivate'
  | 'validate';

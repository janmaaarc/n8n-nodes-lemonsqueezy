import type { INodeProperties } from 'n8n-workflow';

/**
 * Shared field definitions for advanced query options
 * Used across multiple resources for consistent sorting and relationship expansion
 *
 * This module reduces code duplication by providing reusable field definitions
 * for common patterns like pagination (returnAll, limit), sorting, and filtering.
 */

// ============================================================================
// Common Field Generators
// ============================================================================

/**
 * Creates a 'Return All' toggle field for a resource
 * @param resource - The resource name (e.g., 'product', 'order')
 * @param operations - Operations where this field applies (default: ['getAll'])
 */
export function createReturnAllField(
  resource: string,
  operations: string[] = ['getAll'],
): INodeProperties {
  return {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: {
      show: { resource: [resource], operation: operations },
    },
  };
}

/**
 * Creates a 'Limit' number field for a resource
 * @param resource - The resource name
 * @param operations - Operations where this field applies
 */
export function createLimitField(
  resource: string,
  operations: string[] = ['getAll'],
): INodeProperties {
  return {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return',
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: { resource: [resource], operation: operations, returnAll: [false] },
    },
  };
}

/**
 * Creates a resource ID field
 * @param resource - The resource name
 * @param idName - The parameter name for the ID (e.g., 'productId')
 * @param displayName - Display name shown in UI
 * @param operations - Operations where this field applies
 */
export function createIdField(
  resource: string,
  idName: string,
  displayName: string,
  operations: string[] = ['get', 'delete'],
): INodeProperties {
  return {
    displayName,
    name: idName,
    type: 'string',
    required: true,
    default: '',
    description: `The ID of the ${resource}`,
    displayOptions: {
      show: { resource: [resource], operation: operations },
    },
  };
}

// ============================================================================
// Sort Options
// ============================================================================

/**
 * Sort direction options for API queries
 */
export const SORT_DIRECTIONS = [
  { name: 'Ascending', value: 'asc' },
  { name: 'Descending', value: 'desc' },
];

/**
 * Common sortable fields across resources
 */
export const COMMON_SORT_FIELDS = [
  { name: 'Created At', value: 'created_at' },
  { name: 'Updated At', value: 'updated_at' },
];

/**
 * Resource-specific includable relationships
 */
export const RESOURCE_INCLUDES: Record<string, Array<{ name: string; value: string }>> = {
  order: [
    { name: 'Store', value: 'store' },
    { name: 'Customer', value: 'customer' },
    { name: 'Order Items', value: 'order-items' },
    { name: 'Subscriptions', value: 'subscriptions' },
    { name: 'License Keys', value: 'license-keys' },
    { name: 'Discount Redemptions', value: 'discount-redemptions' },
  ],
  subscription: [
    { name: 'Store', value: 'store' },
    { name: 'Customer', value: 'customer' },
    { name: 'Order', value: 'order' },
    { name: 'Order Item', value: 'order-item' },
    { name: 'Product', value: 'product' },
    { name: 'Variant', value: 'variant' },
  ],
  customer: [
    { name: 'Store', value: 'store' },
    { name: 'Orders', value: 'orders' },
    { name: 'Subscriptions', value: 'subscriptions' },
    { name: 'License Keys', value: 'license-keys' },
  ],
  licenseKey: [
    { name: 'Store', value: 'store' },
    { name: 'Customer', value: 'customer' },
    { name: 'Order', value: 'order' },
    { name: 'Order Item', value: 'order-item' },
    { name: 'Product', value: 'product' },
    { name: 'License Key Instances', value: 'license-key-instances' },
  ],
  product: [
    { name: 'Store', value: 'store' },
    { name: 'Variants', value: 'variants' },
  ],
  variant: [
    { name: 'Product', value: 'product' },
    { name: 'Files', value: 'files' },
  ],
  checkout: [
    { name: 'Store', value: 'store' },
    { name: 'Variant', value: 'variant' },
  ],
  discount: [
    { name: 'Store', value: 'store' },
    { name: 'Discount Redemptions', value: 'discount-redemptions' },
  ],
};

/**
 * Generate advanced options field for a specific resource
 */
export function createAdvancedOptionsField(
  resource: string,
  operations: string[] = ['getAll'],
): INodeProperties {
  const includes = RESOURCE_INCLUDES[resource] || [];

  const options: INodeProperties['options'] = [
    {
      displayName: 'Sort Field',
      name: 'sortField',
      type: 'options',
      options: COMMON_SORT_FIELDS,
      default: '',
      description: 'Field to sort results by',
    },
    {
      displayName: 'Sort Direction',
      name: 'sortDirection',
      type: 'options',
      options: SORT_DIRECTIONS,
      default: 'desc',
      description: 'Direction to sort results',
    },
  ];

  if (includes.length > 0) {
    options.push({
      displayName: 'Include Related',
      name: 'include',
      type: 'multiOptions',
      options: includes,
      default: [],
      description: 'Related resources to include in the response',
    });
  }

  return {
    displayName: 'Advanced Options',
    name: 'advancedOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: { resource: [resource], operation: operations },
    },
    options,
  };
}

/**
 * Pre-built advanced options fields for each resource
 */
export const orderAdvancedOptions = createAdvancedOptionsField('order');
export const subscriptionAdvancedOptions = createAdvancedOptionsField('subscription');
export const customerAdvancedOptions = createAdvancedOptionsField('customer');
export const licenseKeyAdvancedOptions = createAdvancedOptionsField('licenseKey');
export const productAdvancedOptions = createAdvancedOptionsField('product');
export const variantAdvancedOptions = createAdvancedOptionsField('variant');
export const checkoutAdvancedOptions = createAdvancedOptionsField('checkout');
export const discountAdvancedOptions = createAdvancedOptionsField('discount');

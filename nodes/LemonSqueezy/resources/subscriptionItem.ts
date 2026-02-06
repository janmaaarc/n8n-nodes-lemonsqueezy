/**
 * Subscription Item Resource
 *
 * Provides operations for subscription items in Lemon Squeezy.
 * Subscription items link a price to a subscription and contain
 * quantity information. Essential for usage-based billing.
 *
 * Available operations:
 * - Get: Retrieve a single subscription item by ID
 * - Get Many: Retrieve multiple subscription items with filtering
 * - Update: Update a subscription item (quantity, invoicing, prorations)
 * - Get Current Usage: Retrieve current usage for a subscription item
 *
 * @see https://docs.lemonsqueezy.com/api/subscription-items
 */
import type { INodeProperties } from 'n8n-workflow';

export const subscriptionItemOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: { resource: ['subscriptionItem'] },
    },
    options: [
      {
        name: 'Get',
        value: 'get',
        action: 'Get a subscription item',
        description: 'Retrieve a single subscription item by ID',
      },
      {
        name: 'Get Current Usage',
        value: 'getCurrentUsage',
        action: 'Get current usage for a subscription item',
        description: 'Retrieve the current usage for a metered subscription item',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many subscription items',
        description: 'Retrieve multiple subscription items',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update a subscription item',
        description: 'Update a subscription item',
      },
    ],
    default: 'getAll',
  },
];

export const subscriptionItemFields: INodeProperties[] = [
  // Subscription Item ID for Get/Update/GetCurrentUsage
  {
    displayName: 'Subscription Item ID',
    name: 'subscriptionItemId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the subscription item',
    displayOptions: {
      show: { resource: ['subscriptionItem'], operation: ['get', 'update', 'getCurrentUsage'] },
    },
  },
  // Update Fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['subscriptionItem'], operation: ['update'] },
    },
    options: [
      {
        displayName: 'Quantity',
        name: 'quantity',
        type: 'number',
        default: 1,
        description: 'The quantity of the subscription item',
        typeOptions: { minValue: 1 },
      },
      {
        displayName: 'Invoice Immediately',
        name: 'invoiceImmediately',
        type: 'boolean',
        default: false,
        description: 'Whether to invoice the customer immediately for the change',
      },
      {
        displayName: 'Disable Prorations',
        name: 'disableProrations',
        type: 'boolean',
        default: false,
        description: 'Whether to disable prorations for the quantity change',
      },
    ],
  },
  // Return All
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: {
      show: { resource: ['subscriptionItem'], operation: ['getAll'] },
    },
  },
  // Limit
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return',
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: { resource: ['subscriptionItem'], operation: ['getAll'], returnAll: [false] },
    },
  },
  // Filters
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: { resource: ['subscriptionItem'], operation: ['getAll'] },
    },
    options: [
      {
        displayName: 'Subscription ID',
        name: 'subscriptionId',
        type: 'string',
        default: '',
        description: 'Filter by subscription ID',
      },
      {
        displayName: 'Price ID',
        name: 'priceId',
        type: 'string',
        default: '',
        description: 'Filter by price ID',
      },
    ],
  },
];

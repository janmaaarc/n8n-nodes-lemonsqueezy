/**
 * Subscription Resource
 *
 * Provides operations for managing subscriptions in Lemon Squeezy.
 *
 * Available operations:
 * - Cancel: Cancel a subscription at end of billing period
 * - Get: Retrieve a single subscription by ID
 * - Get Many: Retrieve multiple subscriptions with filtering
 * - Pause: Pause a subscription (void or free mode)
 * - Resume: Resume a paused subscription
 * - Update: Update subscription details (variant, billing anchor, etc.)
 *
 * @see https://docs.lemonsqueezy.com/api/subscriptions
 */
import type { INodeProperties } from 'n8n-workflow';
import { SUBSCRIPTION_STATUSES, PAUSE_MODES } from '../constants';

export const subscriptionOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['subscription'] },
  },
  options: [
    {
      name: 'Cancel',
      value: 'cancel',
      action: 'Cancel a subscription',
      description: 'Cancel a subscription at end of billing period',
    },
    {
      name: 'Get',
      value: 'get',
      action: 'Get a subscription',
      description: 'Retrieve a single subscription by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many subscriptions',
      description: 'Retrieve multiple subscriptions',
    },
    {
      name: 'Get Many by ID',
      value: 'getManyById',
      action: 'Get many subscriptions by ID',
      description: 'Retrieve multiple subscriptions by their IDs in parallel',
    },
    {
      name: 'Pause',
      value: 'pause',
      action: 'Pause a subscription',
      description: 'Pause a subscription (void or free mode)',
    },
    {
      name: 'Resume',
      value: 'resume',
      action: 'Resume a subscription',
      description: 'Resume a paused subscription',
    },
    {
      name: 'Update',
      value: 'update',
      action: 'Update a subscription',
      description: 'Update subscription details',
    },
  ],
  default: 'getAll',
};

export const subscriptionFields: INodeProperties[] = [
  // Subscription ID
  {
    displayName: 'Subscription ID',
    name: 'subscriptionId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the subscription (e.g., "123456")',
    displayOptions: {
      show: {
        resource: ['subscription'],
        operation: ['get', 'update', 'cancel', 'resume', 'pause'],
      },
    },
  },
  // Get Many by ID
  {
    displayName: 'Subscription IDs',
    name: 'batchSubscriptionIds',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'e.g., 123,456,789',
    description: 'Comma-separated list of subscription IDs to retrieve',
    displayOptions: {
      show: { resource: ['subscription'], operation: ['getManyById'] },
    },
  },
  // Pause Mode for Pause operation
  {
    displayName: 'Pause Mode',
    name: 'pauseMode',
    type: 'options',
    required: true,
    options: PAUSE_MODES,
    default: 'void',
    description:
      'How to pause the subscription. "Void" stops billing entirely. "Free" continues access but stops billing.',
    displayOptions: {
      show: { resource: ['subscription'], operation: ['pause'] },
    },
  },
  // Return All
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: {
      show: { resource: ['subscription'], operation: ['getAll'] },
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
      show: { resource: ['subscription'], operation: ['getAll'], returnAll: [false] },
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
      show: { resource: ['subscription'], operation: ['getAll'] },
    },
    options: [
      {
        displayName: 'Store ID',
        name: 'storeId',
        type: 'string',
        default: '',
        description: 'Filter by store ID',
      },
      {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'string',
        default: '',
        description: 'Filter by order ID',
      },
      {
        displayName: 'Product ID',
        name: 'productId',
        type: 'string',
        default: '',
        description: 'Filter by product ID',
      },
      {
        displayName: 'Variant ID',
        name: 'variantId',
        type: 'string',
        default: '',
        description: 'Filter by variant ID',
      },
      {
        displayName: 'User Email',
        name: 'userEmail',
        type: 'string',
        default: '',
        description: 'Filter by customer email',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: SUBSCRIPTION_STATUSES,
        default: '',
        description: 'Filter by subscription status',
      },
      {
        displayName: 'Order Item ID',
        name: 'orderItemId',
        type: 'string',
        default: '',
        description: 'Filter by order item ID',
      },
      {
        displayName: 'Renews Within Days',
        name: 'renewsWithinDays',
        type: 'number',
        default: 0,
        description:
          'Only return active/on_trial subscriptions that renew within this many days. Set to 0 to disable.',
        typeOptions: { minValue: 0, maxValue: 365 },
      },
    ],
  },
  // Update Fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['subscription'], operation: ['update'] },
    },
    options: [
      {
        displayName: 'Variant ID',
        name: 'variantId',
        type: 'string',
        default: '',
        description: 'Change the subscription to a different variant (plan change)',
      },
      {
        displayName: 'Pause Mode',
        name: 'pause',
        type: 'options',
        options: PAUSE_MODES,
        default: '',
        description: 'Pause or unpause the subscription',
      },
      {
        displayName: 'Cancelled',
        name: 'cancelled',
        type: 'boolean',
        default: false,
        description:
          'Whether the subscription should be cancelled at the end of the billing period',
      },
      {
        displayName: 'Billing Anchor',
        name: 'billingAnchor',
        type: 'number',
        default: 0,
        description: 'Day of the month for billing (1-31)',
        typeOptions: { minValue: 1, maxValue: 31 },
      },
      {
        displayName: 'Invoice Immediately',
        name: 'invoiceImmediately',
        type: 'boolean',
        default: false,
        description: 'Whether to invoice immediately when changing variants',
      },
      {
        displayName: 'Disable Prorations',
        name: 'disableProrations',
        type: 'boolean',
        default: false,
        description: 'Whether to disable prorations when changing variants',
      },
      {
        displayName: 'Trial Ends At',
        name: 'trialEndsAt',
        type: 'dateTime',
        default: '',
        description:
          'Date the trial ends (ISO 8601 format). Set to change or extend the trial period.',
      },
    ],
  },
];

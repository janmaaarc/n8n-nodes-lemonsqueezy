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
      description: 'Cancel a subscription',
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
      name: 'Resume',
      value: 'resume',
      action: 'Resume a subscription',
      description: 'Resume a paused subscription',
    },
    {
      name: 'Update',
      value: 'update',
      action: 'Update a subscription',
      description: 'Update a subscription',
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
    description: 'The ID of the subscription',
    displayOptions: {
      show: { resource: ['subscription'], operation: ['get', 'update', 'cancel', 'resume'] },
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
    typeOptions: { minValue: 1 },
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
    ],
  },
];

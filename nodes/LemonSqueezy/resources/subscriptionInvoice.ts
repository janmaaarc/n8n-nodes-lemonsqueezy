/**
 * Subscription Invoice Resource
 *
 * Provides operations for managing subscription invoices in Lemon Squeezy.
 *
 * Available operations:
 * - Get: Retrieve a single subscription invoice by ID
 * - Get Many: Retrieve multiple subscription invoices with filtering
 * - Generate: Generate a new invoice for an outstanding balance
 * - Refund: Issue a refund for a subscription invoice
 *
 * @see https://docs.lemonsqueezy.com/api/subscription-invoices
 */
import type { INodeProperties } from 'n8n-workflow';

export const subscriptionInvoiceOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['subscriptionInvoice'],
      },
    },
    options: [
      {
        name: 'Generate',
        value: 'generate',
        description: 'Generate an invoice for outstanding subscription balance',
        action: 'Generate a subscription invoice',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get a subscription invoice by ID',
        action: 'Get a subscription invoice',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many subscription invoices',
        action: 'Get many subscription invoices',
      },
      {
        name: 'Refund',
        value: 'refund',
        description: 'Issue a refund for a subscription invoice',
        action: 'Refund a subscription invoice',
      },
    ],
    default: 'getAll',
  },
];

export const subscriptionInvoiceFields: INodeProperties[] = [
  // Subscription Invoice ID for Get and Refund operations
  {
    displayName: 'Subscription Invoice ID',
    name: 'subscriptionInvoiceId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['subscriptionInvoice'],
        operation: ['get', 'refund'],
      },
    },
    description: 'The ID of the subscription invoice (e.g., "123456")',
  },

  // Subscription ID for Generate operation
  {
    displayName: 'Subscription ID',
    name: 'generateSubscriptionId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['subscriptionInvoice'],
        operation: ['generate'],
      },
    },
    description:
      'The ID of the subscription to generate an invoice for. Only works if the subscription has an outstanding balance.',
  },

  // Refund Options
  {
    displayName: 'Refund Amount',
    name: 'refundAmount',
    type: 'number',
    required: false,
    default: 0,
    displayOptions: {
      show: {
        resource: ['subscriptionInvoice'],
        operation: ['refund'],
      },
    },
    description:
      'Amount to refund in cents (e.g., 1000 = $10.00). Leave at 0 for full refund. Must not exceed the original invoice amount.',
    typeOptions: {
      minValue: 0,
    },
  },

  // Get All
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['subscriptionInvoice'],
        operation: ['getAll'],
      },
    },
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    typeOptions: {
      minValue: 1,
      maxValue: 100,
    },
    displayOptions: {
      show: {
        resource: ['subscriptionInvoice'],
        operation: ['getAll'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['subscriptionInvoice'],
        operation: ['getAll'],
      },
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
        displayName: 'Subscription ID',
        name: 'subscriptionId',
        type: 'string',
        default: '',
        description: 'Filter by subscription ID',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        default: '',
        options: [
          { name: 'Pending', value: 'pending' },
          { name: 'Paid', value: 'paid' },
          { name: 'Void', value: 'void' },
          { name: 'Refunded', value: 'refunded' },
        ],
        description: 'Filter by invoice status',
      },
      {
        displayName: 'Refunded',
        name: 'refunded',
        type: 'boolean',
        default: false,
        description: 'Whether to filter by refunded invoices',
      },
    ],
  },
];

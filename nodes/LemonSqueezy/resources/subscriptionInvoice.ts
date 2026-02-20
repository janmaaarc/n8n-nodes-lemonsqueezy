/**
 * Subscription Invoice Resource
 *
 * Provides operations for managing subscription invoices in Lemon Squeezy.
 *
 * Available operations:
 * - Get: Retrieve a single subscription invoice by ID
 * - Get Many: Retrieve multiple subscription invoices with filtering
 * - Generate: Generate a downloadable invoice PDF for a subscription invoice
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
        description: 'Generate a downloadable invoice PDF for a subscription invoice',
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

  // Subscription Invoice ID for Generate operation
  {
    displayName: 'Subscription Invoice ID',
    name: 'generateInvoiceId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['subscriptionInvoice'],
        operation: ['generate'],
      },
    },
    description: 'The ID of the subscription invoice to generate a PDF for',
  },
  // Invoice Generation Fields (required for generate)
  {
    displayName: 'Invoice Name',
    name: 'generateName',
    type: 'string',
    required: true,
    default: '',
    description: 'Full name for the invoice (e.g., "John Doe")',
    displayOptions: {
      show: { resource: ['subscriptionInvoice'], operation: ['generate'] },
    },
  },
  {
    displayName: 'Invoice Address',
    name: 'generateAddress',
    type: 'string',
    required: true,
    default: '',
    description: 'Street address for the invoice',
    displayOptions: {
      show: { resource: ['subscriptionInvoice'], operation: ['generate'] },
    },
  },
  {
    displayName: 'Invoice City',
    name: 'generateCity',
    type: 'string',
    required: true,
    default: '',
    description: 'City for the invoice',
    displayOptions: {
      show: { resource: ['subscriptionInvoice'], operation: ['generate'] },
    },
  },
  {
    displayName: 'Invoice Zip Code',
    name: 'generateZipCode',
    type: 'string',
    required: true,
    default: '',
    description: 'Zip/postal code for the invoice',
    displayOptions: {
      show: { resource: ['subscriptionInvoice'], operation: ['generate'] },
    },
  },
  {
    displayName: 'Invoice Country',
    name: 'generateCountry',
    type: 'string',
    required: true,
    default: '',
    description: 'Country for the invoice (ISO 3166-1 alpha-2 code, e.g., "US", "GB")',
    displayOptions: {
      show: { resource: ['subscriptionInvoice'], operation: ['generate'] },
    },
  },
  {
    displayName: 'Invoice Options',
    name: 'generateOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: { resource: ['subscriptionInvoice'], operation: ['generate'] },
    },
    options: [
      {
        displayName: 'State',
        name: 'state',
        type: 'string',
        default: '',
        description: 'State/province (required for US and CA)',
      },
      {
        displayName: 'Notes',
        name: 'notes',
        type: 'string',
        default: '',
        description: 'Additional notes to include on the invoice',
      },
      {
        displayName: 'Locale',
        name: 'locale',
        type: 'string',
        default: '',
        description: 'ISO 639 language code for the invoice (e.g., "en", "fr")',
      },
    ],
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
          { name: 'Partial Refund', value: 'partial_refund' },
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

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
    ],
    default: 'getAll',
  },
];

export const subscriptionInvoiceFields: INodeProperties[] = [
  // Get
  {
    displayName: 'Subscription Invoice ID',
    name: 'subscriptionInvoiceId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['subscriptionInvoice'],
        operation: ['get'],
      },
    },
    description: 'The ID of the subscription invoice to retrieve',
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

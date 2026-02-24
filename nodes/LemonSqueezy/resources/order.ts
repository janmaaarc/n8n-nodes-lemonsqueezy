/**
 * Order Resource
 *
 * Provides operations for managing orders in Lemon Squeezy.
 * Orders are created when customers complete purchases.
 *
 * Available operations:
 * - Get: Retrieve a single order by ID
 * - Get Many: Retrieve multiple orders with filtering
 * - Refund: Issue a full or partial refund for an order
 * - Generate Invoice: Generate a downloadable invoice for an order
 *
 * @see https://docs.lemonsqueezy.com/api/orders
 */
import type { INodeProperties } from 'n8n-workflow';
import { ORDER_STATUSES } from '../constants';

export const orderOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['order'] },
  },
  options: [
    {
      name: 'Get',
      value: 'get',
      action: 'Get an order',
      description: 'Retrieve a single order by ID',
    },
    {
      name: 'Generate Invoice',
      value: 'generateInvoice',
      action: 'Generate an order invoice',
      description: 'Generate a downloadable invoice for an order',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many orders',
      description: 'Retrieve multiple orders',
    },
    {
      name: 'Refund',
      value: 'refund',
      action: 'Refund an order',
      description: 'Issue a refund for an order',
    },
  ],
  default: 'getAll',
};

export const orderFields: INodeProperties[] = [
  // Order ID for Get/Refund operations
  {
    displayName: 'Order ID',
    name: 'orderId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the order (e.g., "123456")',
    displayOptions: {
      show: { resource: ['order'], operation: ['get', 'refund', 'generateInvoice'] },
    },
  },
  // Invoice Generation Fields (required for generateInvoice)
  {
    displayName: 'Invoice Name',
    name: 'invoiceName',
    type: 'string',
    required: true,
    default: '',
    description: 'Full name for the invoice (e.g., "John Doe")',
    displayOptions: {
      show: { resource: ['order'], operation: ['generateInvoice'] },
    },
  },
  {
    displayName: 'Invoice Address',
    name: 'invoiceAddress',
    type: 'string',
    required: true,
    default: '',
    description: 'Street address for the invoice (e.g., "123 Main St")',
    displayOptions: {
      show: { resource: ['order'], operation: ['generateInvoice'] },
    },
  },
  {
    displayName: 'Invoice City',
    name: 'invoiceCity',
    type: 'string',
    required: true,
    default: '',
    description: 'City for the invoice',
    displayOptions: {
      show: { resource: ['order'], operation: ['generateInvoice'] },
    },
  },
  {
    displayName: 'Invoice Zip Code',
    name: 'invoiceZipCode',
    type: 'string',
    required: true,
    default: '',
    description: 'Zip/postal code for the invoice',
    displayOptions: {
      show: { resource: ['order'], operation: ['generateInvoice'] },
    },
  },
  {
    displayName: 'Invoice Country',
    name: 'invoiceCountry',
    type: 'string',
    required: true,
    default: '',
    description: 'Country for the invoice (ISO 3166-1 alpha-2 code, e.g., "US", "GB")',
    displayOptions: {
      show: { resource: ['order'], operation: ['generateInvoice'] },
    },
  },
  {
    displayName: 'Download PDF',
    name: 'downloadPdf',
    type: 'boolean',
    default: false,
    description: 'Whether to download the generated invoice as a PDF binary file',
    displayOptions: {
      show: { resource: ['order'], operation: ['generateInvoice'] },
    },
  },
  {
    displayName: 'Binary Property',
    name: 'invoiceBinaryProperty',
    type: 'string',
    default: 'data',
    required: true,
    description: 'Name of the binary property to write the PDF to',
    displayOptions: {
      show: { resource: ['order'], operation: ['generateInvoice'], downloadPdf: [true] },
    },
  },
  {
    displayName: 'Invoice Options',
    name: 'invoiceOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: { resource: ['order'], operation: ['generateInvoice'] },
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
  // Refund Amount for partial refunds
  {
    displayName: 'Refund Amount',
    name: 'orderRefundAmount',
    type: 'number',
    required: false,
    default: 0,
    description:
      'Amount to refund in cents (e.g., 1000 = $10.00). Leave at 0 for full refund. Must not exceed the original order amount.',
    typeOptions: {
      minValue: 0,
    },
    displayOptions: {
      show: { resource: ['order'], operation: ['refund'] },
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
      show: { resource: ['order'], operation: ['getAll'] },
    },
  },
  // Limit
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return (API maximum is 100 per page)',
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: { resource: ['order'], operation: ['getAll'], returnAll: [false] },
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
      show: { resource: ['order'], operation: ['getAll'] },
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
        options: ORDER_STATUSES,
        default: '',
        description: 'Filter by order status',
      },
      {
        displayName: 'Refunded',
        name: 'refunded',
        type: 'boolean',
        default: false,
        description: 'Filter by refunded status',
      },
      {
        displayName: 'Order Number',
        name: 'orderNumber',
        type: 'number',
        default: '',
        description: 'Filter by order number',
      },
    ],
  },
];

import type { INodeProperties } from 'n8n-workflow';

export const checkoutOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['checkout'] },
  },
  options: [
    { name: 'Create', value: 'create', action: 'Create a checkout', description: 'Create a new checkout link' },
    { name: 'Get', value: 'get', action: 'Get a checkout', description: 'Retrieve a single checkout by ID' },
    { name: 'Get Many', value: 'getAll', action: 'Get many checkouts', description: 'Retrieve multiple checkouts' },
  ],
  default: 'create',
};

export const checkoutFields: INodeProperties[] = [
  // Checkout ID for Get operation
  {
    displayName: 'Checkout ID',
    name: 'checkoutId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the checkout to retrieve',
    displayOptions: {
      show: { resource: ['checkout'], operation: ['get'] },
    },
  },
  // Create Fields
  {
    displayName: 'Store ID',
    name: 'checkoutStoreId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the store',
    displayOptions: {
      show: { resource: ['checkout'], operation: ['create'] },
    },
  },
  {
    displayName: 'Variant ID',
    name: 'checkoutVariantId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the variant to checkout',
    displayOptions: {
      show: { resource: ['checkout'], operation: ['create'] },
    },
  },
  {
    displayName: 'Additional Options',
    name: 'additionalOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: { resource: ['checkout'], operation: ['create'] },
    },
    options: [
      {
        displayName: 'Custom Price',
        name: 'customPrice',
        type: 'number',
        default: 0,
        description: 'Custom price in cents (for pay-what-you-want products)',
      },
      {
        displayName: 'Discount Code',
        name: 'discountCode',
        type: 'string',
        default: '',
        description: 'Discount code to apply to the checkout',
      },
      {
        displayName: 'Customer Email',
        name: 'email',
        type: 'string',
        default: '',
        description: 'Pre-fill customer email',
      },
      {
        displayName: 'Customer Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'Pre-fill customer name',
      },
      {
        displayName: 'Redirect URL',
        name: 'redirectUrl',
        type: 'string',
        default: '',
        description: 'URL to redirect after successful purchase',
      },
      {
        displayName: 'Receipt Button Text',
        name: 'receiptButtonText',
        type: 'string',
        default: '',
        description: 'Custom text for receipt button',
      },
      {
        displayName: 'Receipt Link URL',
        name: 'receiptLinkUrl',
        type: 'string',
        default: '',
        description: 'Custom URL for receipt button',
      },
      {
        displayName: 'Receipt Thank You Note',
        name: 'receiptThankYouNote',
        type: 'string',
        default: '',
        description: 'Custom thank you note on receipt',
      },
      {
        displayName: 'Custom Data',
        name: 'customData',
        type: 'json',
        default: '{}',
        description: 'Custom data to attach to the checkout (will be passed to webhooks)',
      },
      {
        displayName: 'Expires At',
        name: 'expiresAt',
        type: 'dateTime',
        default: '',
        description: 'When the checkout link expires (ISO 8601 format)',
      },
      {
        displayName: 'Test Mode',
        name: 'testMode',
        type: 'boolean',
        default: false,
        description: 'Whether this is a test checkout',
      },
    ],
  },
  // Checkout Options
  {
    displayName: 'Checkout Display Options',
    name: 'checkoutOptions',
    type: 'collection',
    placeholder: 'Add Display Option',
    default: {},
    displayOptions: {
      show: { resource: ['checkout'], operation: ['create'] },
    },
    options: [
      {
        displayName: 'Dark Mode',
        name: 'dark',
        type: 'boolean',
        default: false,
        description: 'Whether to use dark mode',
      },
      {
        displayName: 'Embed Mode',
        name: 'embed',
        type: 'boolean',
        default: false,
        description: 'Whether checkout is embedded',
      },
      {
        displayName: 'Show Logo',
        name: 'logo',
        type: 'boolean',
        default: true,
        description: 'Whether to show the store logo',
      },
      {
        displayName: 'Show Description',
        name: 'desc',
        type: 'boolean',
        default: true,
        description: 'Whether to show the product description',
      },
      {
        displayName: 'Show Media',
        name: 'media',
        type: 'boolean',
        default: true,
        description: 'Whether to show product media',
      },
      {
        displayName: 'Show Discount Field',
        name: 'discount',
        type: 'boolean',
        default: true,
        description: 'Whether to show the discount code field',
      },
      {
        displayName: 'Button Color',
        name: 'buttonColor',
        type: 'string',
        default: '',
        description: 'Custom button color (hex code)',
        placeholder: '#7c3aed',
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
      show: { resource: ['checkout'], operation: ['getAll'] },
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
      show: { resource: ['checkout'], operation: ['getAll'], returnAll: [false] },
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
      show: { resource: ['checkout'], operation: ['getAll'] },
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
        displayName: 'Variant ID',
        name: 'variantId',
        type: 'string',
        default: '',
        description: 'Filter by variant ID',
      },
    ],
  },
];

/**
 * Variant Resource
 *
 * Available operations:
 * - Create: Create a new variant for a product
 * - Delete: Delete a variant
 * - Get: Retrieve a single variant by ID
 * - Get Many: Retrieve multiple variants with filtering
 * - Update: Update a variant
 *
 * @see https://docs.lemonsqueezy.com/api/variants
 */
import type { INodeProperties } from 'n8n-workflow';
import { INTERVAL_TYPES } from '../constants';

export const variantOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['variant'] },
  },
  options: [
    {
      name: 'Create',
      value: 'create',
      action: 'Create a variant',
      description: 'Create a new variant for a product',
    },
    {
      name: 'Delete',
      value: 'delete',
      action: 'Delete a variant',
      description: 'Delete a variant',
    },
    {
      name: 'Get',
      value: 'get',
      action: 'Get a variant',
      description: 'Retrieve a single variant by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many variants',
      description: 'Retrieve multiple variants',
    },
    {
      name: 'Update',
      value: 'update',
      action: 'Update a variant',
      description: 'Update an existing variant',
    },
  ],
  default: 'getAll',
};

export const variantFields: INodeProperties[] = [
  {
    displayName: 'Variant ID',
    name: 'variantId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the variant',
    displayOptions: {
      show: { resource: ['variant'], operation: ['get', 'update', 'delete'] },
    },
  },
  {
    displayName: 'Product ID',
    name: 'variantProductId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the product this variant belongs to',
    displayOptions: {
      show: { resource: ['variant'], operation: ['create'] },
    },
  },
  {
    displayName: 'Name',
    name: 'variantName',
    type: 'string',
    required: true,
    default: '',
    description: 'The name of the variant',
    displayOptions: {
      show: { resource: ['variant'], operation: ['create'] },
    },
  },
  {
    displayName: 'Price (Cents)',
    name: 'variantPrice',
    type: 'number',
    required: true,
    default: 0,
    typeOptions: { minValue: 0 },
    description: 'The price of the variant in cents (e.g. 999 = $9.99)',
    displayOptions: {
      show: { resource: ['variant'], operation: ['create'] },
    },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['variant'], operation: ['create'] },
    },
    options: [
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        typeOptions: { rows: 3 },
        default: '',
        description: 'The variant description (HTML supported)',
      },
      {
        displayName: 'Has Free Trial',
        name: 'hasFreeTrialPeriod',
        type: 'boolean',
        default: false,
        description: 'Whether this subscription variant has a free trial period',
      },
      {
        displayName: 'Has License Keys',
        name: 'hasLicenseKeys',
        type: 'boolean',
        default: false,
        description: 'Whether this variant generates license keys',
      },
      {
        displayName: 'Is Subscription',
        name: 'isSubscription',
        type: 'boolean',
        default: false,
        description: 'Whether this is a subscription variant',
      },
      {
        displayName: 'License Activation Limit',
        name: 'licenseActivationLimit',
        type: 'number',
        default: 0,
        typeOptions: { minValue: 0 },
        description: 'Maximum number of times a license key can be activated (0 = unlimited)',
      },
      {
        displayName: 'License Length Unit',
        name: 'licenseLengthUnit',
        type: 'options',
        options: [
          { name: 'Days', value: 'days' },
          { name: 'Months', value: 'months' },
          { name: 'Years', value: 'years' },
        ],
        default: 'years',
        description: 'The unit for the license key length',
      },
      {
        displayName: 'License Length Value',
        name: 'licenseLengthValue',
        type: 'number',
        default: 1,
        typeOptions: { minValue: 1 },
        description: 'The duration value for the license key length',
      },
      {
        displayName: 'Pay What You Want',
        name: 'payWhatYouWant',
        type: 'boolean',
        default: false,
        description: 'Whether customers can choose their own price',
      },
      {
        displayName: 'Renewal Interval',
        name: 'interval',
        type: 'options',
        options: INTERVAL_TYPES,
        default: 'month',
        description: 'The interval for subscription billing (requires Is Subscription = true)',
      },
      {
        displayName: 'Renewal Interval Count',
        name: 'intervalCount',
        type: 'number',
        default: 1,
        typeOptions: { minValue: 1 },
        description: 'How many intervals between billing cycles',
      },
      {
        displayName: 'Sort Order',
        name: 'sort',
        type: 'number',
        default: 0,
        description: 'The sort order of the variant (lower numbers appear first)',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'Draft', value: 'draft' },
          { name: 'Published', value: 'published' },
        ],
        default: 'draft',
        description: 'The variant status',
      },
      {
        displayName: 'Test Mode',
        name: 'testMode',
        type: 'boolean',
        default: false,
        description: 'Whether to create the variant in test mode',
      },
      {
        displayName: 'Trial Interval',
        name: 'trialInterval',
        type: 'options',
        options: INTERVAL_TYPES,
        default: 'day',
        description: 'The interval unit for the free trial period',
      },
      {
        displayName: 'Trial Interval Count',
        name: 'trialIntervalCount',
        type: 'number',
        default: 7,
        typeOptions: { minValue: 1 },
        description: 'The duration of the free trial period',
      },
    ],
  },
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['variant'], operation: ['update'] },
    },
    options: [
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        typeOptions: { rows: 3 },
        default: '',
        description: 'The variant description (HTML supported)',
      },
      {
        displayName: 'License Activation Limit',
        name: 'licenseActivationLimit',
        type: 'number',
        default: 1,
        typeOptions: { minValue: 1 },
        description: 'Maximum number of license key activations',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'The name of the variant',
      },
      {
        displayName: 'Price (Cents)',
        name: 'price',
        type: 'number',
        default: 0,
        typeOptions: { minValue: 0 },
        description: 'The variant price in cents',
      },
      {
        displayName: 'Sort Order',
        name: 'sort',
        type: 'number',
        default: 0,
        description: 'The sort order of the variant',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'Draft', value: 'draft' },
          { name: 'Published', value: 'published' },
        ],
        default: 'draft',
        description: 'The variant status',
      },
    ],
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: {
      show: { resource: ['variant'], operation: ['getAll'] },
    },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return',
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: { resource: ['variant'], operation: ['getAll'], returnAll: [false] },
    },
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: { resource: ['variant'], operation: ['getAll'] },
    },
    options: [
      {
        displayName: 'Product ID',
        name: 'productId',
        type: 'string',
        default: '',
        description: 'Filter by product ID',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'Any', value: '' },
          { name: 'Pending', value: 'pending' },
          { name: 'Draft', value: 'draft' },
          { name: 'Published', value: 'published' },
        ],
        default: '',
        description: 'Filter by variant status',
      },
    ],
  },
];

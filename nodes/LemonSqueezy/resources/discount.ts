import type { INodeProperties } from 'n8n-workflow';
import { DISCOUNT_AMOUNT_TYPES, DISCOUNT_DURATION_TYPES } from '../constants';

export const discountOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['discount'] },
  },
  options: [
    {
      name: 'Create',
      value: 'create',
      action: 'Create a discount',
      description: 'Create a new discount code',
    },
    {
      name: 'Delete',
      value: 'delete',
      action: 'Delete a discount',
      description: 'Delete a discount code',
    },
    {
      name: 'Get',
      value: 'get',
      action: 'Get a discount',
      description: 'Retrieve a single discount by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many discounts',
      description: 'Retrieve multiple discounts',
    },
    {
      name: 'Update',
      value: 'update',
      action: 'Update a discount',
      description: 'Update an existing discount code',
    },
  ],
  default: 'getAll',
};

export const discountFields: INodeProperties[] = [
  // Discount ID for Get/Update/Delete operations
  {
    displayName: 'Discount ID',
    name: 'discountId',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'e.g., 12345',
    description: 'The ID of the discount (numeric string)',
    displayOptions: {
      show: { resource: ['discount'], operation: ['get', 'update', 'delete'] },
    },
  },
  // Create Fields
  {
    displayName: 'Store ID',
    name: 'discountStoreId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the store this discount belongs to',
    displayOptions: {
      show: { resource: ['discount'], operation: ['create'] },
    },
  },
  {
    displayName: 'Name',
    name: 'discountName',
    type: 'string',
    required: true,
    default: '',
    description: 'Internal name for the discount (not visible to customers)',
    displayOptions: {
      show: { resource: ['discount'], operation: ['create'] },
    },
  },
  {
    displayName: 'Code',
    name: 'discountCode',
    type: 'string',
    required: true,
    default: '',
    description: 'The discount code customers will use at checkout',
    displayOptions: {
      show: { resource: ['discount'], operation: ['create'] },
    },
  },
  {
    displayName: 'Amount',
    name: 'discountAmount',
    type: 'number',
    required: true,
    default: 0,
    description: 'Discount amount (percentage 0-100 or fixed amount in cents)',
    displayOptions: {
      show: { resource: ['discount'], operation: ['create'] },
    },
  },
  {
    displayName: 'Amount Type',
    name: 'discountAmountType',
    type: 'options',
    options: DISCOUNT_AMOUNT_TYPES,
    default: 'percent',
    description: 'Whether the discount is a percentage or fixed amount',
    displayOptions: {
      show: { resource: ['discount'], operation: ['create'] },
    },
  },
  {
    displayName: 'Additional Options',
    name: 'additionalOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: { resource: ['discount'], operation: ['create'] },
    },
    options: [
      {
        displayName: 'Duration',
        name: 'duration',
        type: 'options',
        options: DISCOUNT_DURATION_TYPES,
        default: 'once',
        description: 'How long the discount should apply for subscriptions',
      },
      {
        displayName: 'Duration In Months',
        name: 'durationInMonths',
        type: 'number',
        default: 1,
        description: 'Number of months the discount applies (only for "repeating" duration)',
        typeOptions: { minValue: 1 },
      },
      {
        displayName: 'Max Redemptions',
        name: 'maxRedemptions',
        type: 'number',
        default: 0,
        description: 'Maximum number of times this discount can be used (0 for unlimited)',
        typeOptions: { minValue: 0 },
      },
      {
        displayName: 'Starts At',
        name: 'startsAt',
        type: 'dateTime',
        default: '',
        description: 'When the discount becomes active (ISO 8601 format)',
      },
      {
        displayName: 'Expires At',
        name: 'expiresAt',
        type: 'dateTime',
        default: '',
        description: 'When the discount expires (ISO 8601 format)',
      },
      {
        displayName: 'Test Mode',
        name: 'testMode',
        type: 'boolean',
        default: false,
        description: 'Whether this is a test discount',
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
      show: { resource: ['discount'], operation: ['update'] },
    },
    options: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'Internal name for the discount (not visible to customers)',
      },
      {
        displayName: 'Code',
        name: 'code',
        type: 'string',
        default: '',
        description: 'The discount code customers will use at checkout',
      },
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'number',
        default: 0,
        description:
          'Discount amount (percentage 0-100 for percent type, or fixed amount in cents for fixed type)',
      },
      {
        displayName: 'Amount Type',
        name: 'amountType',
        type: 'options',
        options: DISCOUNT_AMOUNT_TYPES,
        default: 'percent',
        description: 'Whether the discount is a percentage or fixed amount',
      },
      {
        displayName: 'Duration',
        name: 'duration',
        type: 'options',
        options: DISCOUNT_DURATION_TYPES,
        default: 'once',
        description: 'How long the discount should apply for subscriptions',
      },
      {
        displayName: 'Duration In Months',
        name: 'durationInMonths',
        type: 'number',
        default: 1,
        description: 'Number of months the discount applies (only for "repeating" duration)',
        typeOptions: { minValue: 1 },
      },
      {
        displayName: 'Max Redemptions',
        name: 'maxRedemptions',
        type: 'number',
        default: 0,
        description: 'Maximum number of times this discount can be used (0 for unlimited)',
        typeOptions: { minValue: 0 },
      },
      {
        displayName: 'Starts At',
        name: 'startsAt',
        type: 'dateTime',
        default: '',
        description: 'When the discount becomes active (ISO 8601 format, e.g., 2024-01-15T10:30:00Z)',
      },
      {
        displayName: 'Expires At',
        name: 'expiresAt',
        type: 'dateTime',
        default: '',
        description: 'When the discount expires (ISO 8601 format, e.g., 2024-12-31T23:59:59Z)',
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
      show: { resource: ['discount'], operation: ['getAll'] },
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
      show: { resource: ['discount'], operation: ['getAll'], returnAll: [false] },
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
      show: { resource: ['discount'], operation: ['getAll'] },
    },
    options: [
      {
        displayName: 'Store ID',
        name: 'storeId',
        type: 'string',
        default: '',
        description: 'Filter by store ID',
      },
    ],
  },
];
